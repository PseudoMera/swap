import { useState, useCallback } from 'react'
import { useSwitchChain } from 'wagmi'
import { useUnifiedWallet } from './useUnifiedWallet'

export interface ChainValidationState {
  isCorrectChain: boolean
  currentChain: { id: number; name?: string } | null
  isSwitching: boolean
  switchToRequiredChain: () => Promise<void>
  error: Error | null
}

export function useChainValidation(requiredChainId: number): ChainValidationState {
  const { wallet } = useUnifiedWallet()
  const { switchChainAsync } = useSwitchChain()
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const currentChain = wallet?.chain || null
  const isCorrectChain = currentChain?.id === requiredChainId
  
  const switchToRequiredChain = useCallback(async () => {
    if (!currentChain || currentChain.id === requiredChainId) return
    
    try {
      setIsSwitching(true)
      setError(null)
      await switchChainAsync({ chainId: requiredChainId })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Chain switch failed')
      setError(error)
      throw error
    } finally {
      setIsSwitching(false)
    }
  }, [currentChain, requiredChainId, switchChainAsync])
  
  return {
    isCorrectChain,
    currentChain,
    isSwitching,
    switchToRequiredChain,
    error
  }
}