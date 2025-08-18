import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { sendTransaction } from 'wagmi/actions'
import { wagmiConfig } from '@/config'

// Sepolia USDC Contract Address
const USDC_CONTRACT_SEPOLIA = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as const

const USDC_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  }
] as const

export function USDCSelfSend() {
  const { address, isConnected, chain } = useAccount()
  const [amount, setAmount] = useState('')
  const [usesMemo, setUsesMemo] = useState(false)
  const [memoTxHash, setMemoTxHash] = useState<`0x${string}` | null>(null)
  
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: usesMemo ? memoTxHash : hash,
  })

  // Read user's USDC balance
  const { data: balance } = useReadContract({
    address: USDC_CONTRACT_SEPOLIA,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && chain?.id === 11155111, // Only on Sepolia
    },
  })

  const handleSelfSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !amount) return

    try {
      const amountInUnits = BigInt(Math.floor(parseFloat(amount) * 1000000))

      if (usesMemo) {
        await handleSelfSendWithMemo(address, amountInUnits)
      } else {
        writeContract({
          address: USDC_CONTRACT_SEPOLIA,
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [address, amountInUnits], // Self-send: send to own address
        })
      }
    } catch (err) {
      console.error('Transaction failed:', err)
    }
  }

  const handleSelfSendWithMemo = async (toAddress: string, amountInUnits: bigint) => {
    // Create lock order memo for oracle
    const lockOrderMemo = {
      order_id: Date.now(), // Use timestamp as order ID for testing
      buyer_receive_address: toAddress,
      buyer_send_address: toAddress, // Self-send
      buyer_chain_deadline: Date.now() + 3600000 // 1 hour from now
    }

    try {
      // Standard USDC transfer encoding (68 bytes)
      const methodID = 'a9059cbb' // transfer(address,uint256)
      const paddedTo = toAddress.slice(2).padStart(64, '0')
      const paddedAmount = amountInUnits.toString(16).padStart(64, '0')
      
      // JSON memo encoding (oracle parses this)
      const memoJson = JSON.stringify(lockOrderMemo)
      const memoBytes = new TextEncoder().encode(memoJson)
      const memoHex = Array.from(memoBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      
      // Combine: standard transfer + memo data
      const data = `0x${methodID}${paddedTo}${paddedAmount}${memoHex}` as `0x${string}`
      
      const txHash = await sendTransaction(wagmiConfig, {
        to: USDC_CONTRACT_SEPOLIA,
        value: 0n,
        data
      })
      
      setMemoTxHash(txHash)
      console.log('Memo transaction sent:', txHash)
      console.log('Lock order memo:', lockOrderMemo)
      
    } catch (error) {
      console.error('Memo transaction failed:', error)
    }
  }

  if (!isConnected) {
    return (
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">USDC Self-Send Test</h2>
        <p>Please connect your wallet to test USDC transactions</p>
      </div>
    )
  }

  if (chain?.id !== 11155111) {
    return (
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">USDC Self-Send Test</h2>
        <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p><strong>Wrong Network!</strong></p>
          <p>Please switch to Sepolia testnet to test USDC transactions.</p>
          <p>Current network: {chain?.name}</p>
        </div>
      </div>
    )
  }

  const formattedBalance = balance ? (Number(balance) / 1000000).toFixed(6) : '0.000000'

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">USDC Self-Send Test (Sepolia)</h2>
      <p className="text-sm text-gray-600 mb-4">
        Send USDC to yourself to test the transaction flow on Sepolia testnet
      </p>

      <div className="mb-4 p-3 bg-blue-50 rounded">
        <p><strong>Your USDC Balance:</strong> {formattedBalance} USDC</p>
        <p className="text-xs text-gray-500 mt-1">
          Need testnet USDC? Get some from: <a href="https://faucet.circle.com/" target="_blank" className="text-blue-600 underline">Circle Faucet</a>
        </p>
      </div>
      
      <form onSubmit={handleSelfSend} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Amount (USDC)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.000001"
              min="0.000001"
              placeholder="1.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 p-2 border rounded"
              required
              max={formattedBalance}
            />
            <button
              type="button"
              onClick={() => setAmount('0.000001')}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 border rounded whitespace-nowrap"
            >
              Min
            </button>
            <button
              type="button"
              onClick={() => setAmount('0.01')}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 border rounded whitespace-nowrap"
            >
              0.01
            </button>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Minimum: 0.000001 USDC</span>
            <span>Maximum: {formattedBalance} USDC</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useMemo"
            checked={usesMemo}
            onChange={(e) => setUsesMemo(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="useMemo" className="text-sm font-medium">
            Include Oracle Memo Data
          </label>
        </div>

        {usesMemo && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <p><strong>Oracle-compatible memo will include:</strong></p>
            <p>• order_id: {Date.now()}</p>
            <p>• buyer_receive_address: {address}</p>
            <p>• buyer_send_address: {address}</p>
            <p>• buyer_chain_deadline: {Date.now() + 3600000}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={
            isPending || 
            isConfirming || 
            !amount || 
            parseFloat(amount) < 0.000001 || 
            parseFloat(amount) > parseFloat(formattedBalance)
          }
          className={`w-full py-2 px-4 rounded disabled:bg-gray-400 ${
            usesMemo 
              ? 'bg-purple-500 hover:bg-purple-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isPending || isConfirming 
            ? 'Sending...' 
            : usesMemo 
              ? 'Send USDC with Oracle Memo' 
              : 'Send USDC to Myself'
          }
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p><strong>Error:</strong> {error.message}</p>
        </div>
      )}

      {(hash || memoTxHash) && (
        <div className="mt-4 p-3 bg-green-100 rounded">
          <p><strong>Transaction Hash:</strong></p>
          <p className="font-mono text-sm break-all">{usesMemo ? memoTxHash : hash}</p>
          <p><strong>Status:</strong> {isSuccess ? 'Confirmed ✅' : 'Pending...'}</p>
          {usesMemo && (
            <p className="text-xs text-yellow-700 mt-2">
              <strong>📝 Oracle Memo:</strong> Transaction includes lock order data for oracle parsing
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            View on Sepolia Etherscan: <a 
              href={`https://sepolia.etherscan.io/tx/${usesMemo ? memoTxHash : hash}`} 
              target="_blank" 
              className="text-blue-600 underline"
            >
              {(usesMemo ? memoTxHash : hash)?.slice(0, 10)}...
            </a>
          </p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p><strong>Network:</strong> {chain?.name} ({chain?.id})</p>
        <p><strong>Your Address:</strong> {address}</p>
        <p><strong>USDC Contract:</strong> {USDC_CONTRACT_SEPOLIA}</p>
      </div>
    </div>
  )
}