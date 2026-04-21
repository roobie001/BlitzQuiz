const fs = require('node:fs')
const path = require('node:path')

function loadEnvFile(filename) {
  const filePath = path.resolve(__dirname, filename)
  if (!fs.existsSync(filePath)) return

  const contents = fs.readFileSync(filePath, 'utf8')
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

loadEnvFile('.env.local')
loadEnvFile('.env')

const rpcUrl =
  process.env.CELO_RPC_URL ||
  process.env.VITE_RPC_URL ||
  'https://forno.celo.org'

const deployerKey =
  process.env.DEPLOYER_PRIVATE_KEY ||
  process.env.DEPLOYER_KEY ||
  ''

module.exports = {
  solidity: '0.8.20',
  networks: {
    celo: {
      url: rpcUrl,
      chainId: 42220,
      accounts: deployerKey ? [deployerKey] : [],
    },
  },
}
