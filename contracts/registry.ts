import { CHAIN_IDS, USDC_ABI } from '@/constants/tokens'

export interface ContractInfo {
  address: `0x${string}`
  abi: readonly unknown[]
  deployedBlock: number
  verified: boolean
  name: string
}

export class ContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContractError'
  }
}

const CONTRACT_REGISTRY: Record<number, Record<string, ContractInfo>> = {
  [CHAIN_IDS.MAINNET]: {
    USDC: {
      address: '0xA0b86a33E6f73D5f3aE8E7AA7b9F7A73c7f6F5aE',
      abi: USDC_ABI,
      deployedBlock: 6082465,
      verified: true,
      name: 'USD Coin'
    }
  },
  [CHAIN_IDS.SEPOLIA]: {
    USDC: {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      abi: USDC_ABI,
      deployedBlock: 3000000,
      verified: true,
      name: 'USD Coin (Testnet)'
    }
  }
}

export function getContract(chainId: number, contractName: string): ContractInfo {
  const chainContracts = CONTRACT_REGISTRY[chainId]
  if (!chainContracts) {
    throw new ContractError(`Unsupported chain: ${chainId}`)
  }
  
  const contract = chainContracts[contractName]
  if (!contract) {
    throw new ContractError(`Contract ${contractName} not found on chain ${chainId}`)
  }
  
  if (!contract.verified) {
    throw new ContractError(`Contract ${contractName} not verified on chain ${chainId}`)
  }
  
  return contract
}

export function getContractAddress(chainId: number, contractName: string): `0x${string}` {
  const contract = getContract(chainId, contractName)
  return contract.address
}

export function getSupportedChains(): number[] {
  return Object.keys(CONTRACT_REGISTRY).map(Number)
}

export function getSupportedContracts(chainId: number): string[] {
  const chainContracts = CONTRACT_REGISTRY[chainId]
  return chainContracts ? Object.keys(chainContracts) : []
}