import { useState, useCallback } from 'react'

export type TransactionStatus = 
  | 'idle' 
  | 'preparing' 
  | 'pending' 
  | 'confirming' 
  | 'success' 
  | 'error'

export interface TransactionState {
  status: TransactionStatus
  hash?: `0x${string}`
  error?: Error
}

export interface UseTransactionStateReturn extends TransactionState {
  isLoading: boolean
  reset: () => void
  setStatus: (status: TransactionStatus) => void
  setHash: (hash: `0x${string}`) => void
  setError: (error: Error) => void
}

export function useTransactionState(): UseTransactionStateReturn {
  const [state, setState] = useState<TransactionState>({ 
    status: 'idle' 
  })
  
  const isLoading = ['preparing', 'pending', 'confirming'].includes(state.status)
  
  const reset = useCallback(() => {
    setState({ status: 'idle' })
  }, [])
  
  const setStatus = useCallback((status: TransactionStatus) => {
    setState(prev => ({ ...prev, status }))
  }, [])
  
  const setHash = useCallback((hash: `0x${string}`) => {
    setState(prev => ({ ...prev, hash }))
  }, [])
  
  const setError = useCallback((error: Error) => {
    setState(prev => ({ ...prev, error, status: 'error' }))
  }, [])
  
  return {
    ...state,
    isLoading,
    reset,
    setStatus,
    setHash,
    setError
  }
}