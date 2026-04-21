const hre = require('hardhat')
const { createPublicClient, createWalletClient, http } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')
const { celo } = require('viem/chains')

async function main() {
  const rpcUrl =
    process.env.CELO_RPC_URL ||
    process.env.VITE_RPC_URL ||
    'https://forno.celo.org'

  const privateKey =
    process.env.DEPLOYER_PRIVATE_KEY ||
    process.env.DEPLOYER_KEY

  if (!privateKey) {
    throw new Error(
      'Missing DEPLOYER_PRIVATE_KEY or DEPLOYER_KEY in the environment.',
    )
  }

  if (!privateKey.startsWith('0x')) {
    throw new Error('Deployer private key must start with 0x.')
  }

  await hre.run('compile')

  const artifact = await hre.artifacts.readArtifact('BlitzQuiz')
  const account = privateKeyToAccount(privateKey)
  const publicClient = createPublicClient({
    chain: celo,
    transport: http(rpcUrl),
  })
  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(rpcUrl),
  })

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    account,
    chain: celo,
  })

  console.log(`Deployment transaction: ${hash}`)

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  if (!receipt.contractAddress) {
    throw new Error('Deployment succeeded but no contract address was returned.')
  }

  console.log(`BlitzQuiz deployed to: ${receipt.contractAddress}`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exitCode = 1
})
