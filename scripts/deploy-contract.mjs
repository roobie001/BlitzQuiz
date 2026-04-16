import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import solc from 'solc'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { celo, celoAlfajores } from 'viem/chains'

function loadEnvFile(filename) {
  const filePath = path.resolve(filename)
  if (!existsSync(filePath)) return

  const contents = readFileSync(filePath, 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function resolveChain(chainId, rpcUrl) {
  if (chainId === celo.id) return celo
  if (chainId === celoAlfajores.id) return celoAlfajores

  return {
    ...celoAlfajores,
    id: chainId,
    name: 'Custom Celo Network',
    rpcUrls: {
      default: { http: [rpcUrl] },
      public: { http: [rpcUrl] },
    },
  }
}

function compileContract() {
  const contractPath = path.resolve('contracts', 'BlitzQuiz.sol')
  const source = readFileSync(contractPath, 'utf8')

  const input = {
    language: 'Solidity',
    sources: {
      'BlitzQuiz.sol': {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  }

  const output = JSON.parse(solc.compile(JSON.stringify(input)))
  const errors = output.errors?.filter((entry) => entry.severity === 'error') ?? []

  if (errors.length > 0) {
    throw new Error(errors.map((entry) => entry.formattedMessage).join('\n\n'))
  }

  const contract = output.contracts['BlitzQuiz.sol']?.BlitzQuiz
  if (!contract) {
    throw new Error('Compiled contract output not found for BlitzQuiz.')
  }

  return {
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
  }
}

async function main() {
  loadEnvFile('.env.local')
  loadEnvFile('.env')

  const privateKey = requireEnv('DEPLOYER_PRIVATE_KEY')
  const rpcUrl = requireEnv('VITE_RPC_URL')
  const chainId = Number(requireEnv('VITE_CHAIN_ID'))

  if (!privateKey.startsWith('0x')) {
    throw new Error('DEPLOYER_PRIVATE_KEY must start with 0x.')
  }

  const chain = resolveChain(chainId, rpcUrl)
  const account = privateKeyToAccount(privateKey)
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  })
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  })

  const { abi, bytecode } = compileContract()
  const deploymentHash = await walletClient.deployContract({
    abi,
    bytecode,
    account,
    chain,
  })

  console.log(`Deployment transaction: ${deploymentHash}`)

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: deploymentHash,
  })

  if (!receipt.contractAddress) {
    throw new Error('Deployment receipt did not include a contract address.')
  }

  console.log(`BlitzQuiz deployed to: ${receipt.contractAddress}`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exitCode = 1
})
