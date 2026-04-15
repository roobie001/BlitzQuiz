import { getAddress } from 'viem'

function normalizeContractAddress() {
  if (!import.meta.env.VITE_CONTRACT_ADDRESS) return null

  try {
    return getAddress(import.meta.env.VITE_CONTRACT_ADDRESS)
  } catch {
    return null
  }
}

export const CONTRACT_ADDRESS = normalizeContractAddress()

export const blitzQuizAbi = [
  {
    type: 'function',
    name: 'submitScore',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'score', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getPlayer',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: '', type: 'uint256' },
      { name: '', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'getLeaderboard',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: '', type: 'address[]' },
      { name: '', type: 'uint256[]' },
      { name: '', type: 'uint256[]' },
    ],
  },
]

export async function getPlayerStats(publicClient, address) {
  if (!CONTRACT_ADDRESS) {
    return { bestScore: 0, totalGames: 0 }
  }

  const [bestScore, totalGames] = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: blitzQuizAbi,
    functionName: 'getPlayer',
    args: [address],
  })

  return {
    bestScore: Number(bestScore),
    totalGames: Number(totalGames),
  }
}

export async function getLeaderboardEntries(publicClient) {
  if (!CONTRACT_ADDRESS) return []

  const [addresses, scores, totalGames] = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: blitzQuizAbi,
    functionName: 'getLeaderboard',
  })

  return addresses
    .map((address, index) => ({
      address,
      bestScore: Number(scores[index] ?? 0n),
      totalGames: Number(totalGames[index] ?? 0n),
    }))
    .sort((left, right) => right.bestScore - left.bestScore)
}
