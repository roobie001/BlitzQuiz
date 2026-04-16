import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { celo, celoAlfajores } from "viem/chains";
import { CONTRACT_ADDRESS, blitzQuizAbi } from "./lib/contract";

const configuredChainId = Number(import.meta.env.VITE_CHAIN_ID || 11142220);
const configuredRpcUrl =
  import.meta.env.VITE_RPC_URL || "https://alfajores-forno.celo-testnet.org";

const supportedChain =
  configuredChainId === celo.id
    ? celo
    : configuredChainId === celoAlfajores.id
      ? celoAlfajores
      : {
          ...celoAlfajores,
          id: configuredChainId,
          name: "Custom Celo Testnet",
          rpcUrls: {
            default: { http: [configuredRpcUrl] },
            public: { http: [configuredRpcUrl] },
          },
        };
const chainHex = `0x${supportedChain.id.toString(16)}`;

function getInjectedProvider() {
  if (typeof window === "undefined") return null;

  const injectedProvider = window.ethereum ?? null;
  if (!injectedProvider) return null;

  if (Array.isArray(injectedProvider.providers)) {
    const miniPayProvider = injectedProvider.providers.find(
      (provider) => provider?.isMiniPay,
    );
    if (miniPayProvider) return miniPayProvider;

    const fallbackProvider = injectedProvider.providers.find(
      (provider) => provider?.request && !provider?.isMetaMask,
    );
    if (fallbackProvider) return fallbackProvider;
  }

  return injectedProvider;
}

export function useMiniPay() {
  const [account, setAccount] = useState("");
  const [detectedAccount, setDetectedAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [txStatus, setTxStatus] = useState("idle");
  const [txError, setTxError] = useState("");

  const provider = getInjectedProvider();
  const isMiniPay =
    Boolean(provider?.isMiniPay) ||
    (typeof navigator !== "undefined" &&
      navigator.userAgent.toLowerCase().includes("minipay"));

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: supportedChain,
        transport: http(configuredRpcUrl),
      }),
    [],
  );

  const isOnSupportedChain = chainId === supportedChain.id;

  const syncWalletState = useCallback(async () => {
    if (!provider) return;

    const [selectedAddress] = await provider.request({
      method: "eth_accounts",
    });
    const activeChain = await provider.request({
      method: "eth_chainId",
    });

    setDetectedAccount(selectedAddress || "");
    setChainId(Number.parseInt(activeChain, 16));
  }, [provider]);

  useEffect(() => {
    if (!provider?.request) return undefined;

    syncWalletState();

    function handleAccountsChanged(accounts) {
      const nextAccount = accounts[0] || "";
      setDetectedAccount(nextAccount);
      setAccount((currentAccount) => (currentAccount ? nextAccount : ""));
    }

    function handleChainChanged(nextChainId) {
      setChainId(Number.parseInt(nextChainId, 16));
    }

    provider.on?.("accountsChanged", handleAccountsChanged);
    provider.on?.("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [provider, syncWalletState]);

  async function connectWallet() {
    if (!provider) {
      setTxError(
        "MiniPay or another injected wallet was not found in this browser.",
      );
      return;
    }

    setIsConnecting(true);
    setTxError("");

    try {
      const [selectedAddress] = await provider.request({
        method: "eth_requestAccounts",
      });
      const activeChain = await provider.request({
        method: "eth_chainId",
      });

      setDetectedAccount(selectedAddress || "");
      setAccount(selectedAddress);
      setChainId(Number.parseInt(activeChain, 16));
    } catch (error) {
      setTxError(error.message || "Unable to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  }

  function disconnectWallet() {
    setAccount("");
    setTxStatus("idle");
    setTxError("");
  }

  async function switchToSupportedChain() {
    if (!provider) {
      setTxError("No injected wallet found.");
      return;
    }

    setTxError("");

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainHex }],
      });
      await syncWalletState();
    } catch (switchError) {
      if (switchError.code === 4902) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainHex,
              chainName: supportedChain.name,
              nativeCurrency: supportedChain.nativeCurrency,
              rpcUrls: [configuredRpcUrl],
              blockExplorerUrls: supportedChain.blockExplorers?.default?.url
                ? [supportedChain.blockExplorers.default.url]
                : [],
            },
          ],
        });
        await syncWalletState();
        return;
      }

      setTxError(switchError.message || "Unable to switch chain.");
    }
  }

  async function submitScore(score) {
    if (!provider) {
      throw new Error("Wallet not available.");
    }
    if (!account) {
      throw new Error("Connect wallet before submitting.");
    }
    if (!CONTRACT_ADDRESS) {
      throw new Error("Contract address is not configured.");
    }

    setTxStatus("pending");
    setTxError("");

    try {
      if (!isOnSupportedChain) {
        await switchToSupportedChain();
      }

      const walletClient = createWalletClient({
        account,
        chain: supportedChain,
        transport: custom(provider),
      });

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: blitzQuizAbi,
        functionName: "submitScore",
        args: [BigInt(score)],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setTxStatus("success");
      await syncWalletState();
      return hash;
    } catch (error) {
      setTxStatus("error");
      setTxError(error.shortMessage || error.message || "Transaction failed.");
      throw error;
    }
  }

  return {
    account,
    chainId,
    connectWallet,
    detectedAccount,
    disconnectWallet,
    isConnecting,
    isMiniPay,
    isOnSupportedChain,
    publicClient,
    submitScore,
    supportedChain,
    switchToSupportedChain,
    txError,
    txStatus,
  };
}
