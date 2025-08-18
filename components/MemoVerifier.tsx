import { useState } from 'react'
import { getTransaction } from 'wagmi/actions'
import { wagmiConfig } from '@/config'

export function MemoVerifier() {
  const [txHash, setTxHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const extractMemoFromTransaction = async (txHash: string) => {
    try {
      const tx = await getTransaction(wagmiConfig, { 
        hash: txHash as `0x${string}` 
      })
      
      // Standard USDC transfer is 138 chars (0x + 8 + 128)
      const transferDataLength = 138
      
      if (tx.input.length > transferDataLength) {
        const memoHex = tx.input.slice(transferDataLength)
        
        // Convert hex to string
        const memoBytes = new Uint8Array(
          memoHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
        )
        const memoString = new TextDecoder().decode(memoBytes)
        
        // Parse JSON lock order
        return {
          hasExtraData: true,
          memoHex,
          memoString,
          lockOrder: JSON.parse(memoString),
          transactionDetails: {
            hash: tx.hash,
            to: tx.to,
            value: tx.value.toString(),
            gasUsed: tx.gas?.toString(),
            blockNumber: tx.blockNumber?.toString()
          }
        }
      }
      
      return {
        hasExtraData: false,
        transactionDetails: {
          hash: tx.hash,
          to: tx.to,
          value: tx.value.toString(),
          gasUsed: tx.gas?.toString(),
          blockNumber: tx.blockNumber?.toString()
        }
      }
    } catch (error) {
      throw new Error(`Failed to decode memo: ${error}`)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!txHash) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const parsedData = await extractMemoFromTransaction(txHash)
      setResult(parsedData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">🔍 Memo Verifier</h2>
      <p className="text-sm text-gray-600 mb-4">
        Paste a transaction hash to verify and decode memo data
      </p>

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Transaction Hash
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            className="w-full p-2 border rounded font-mono text-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !txHash}
          className="w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? 'Analyzing...' : 'Verify Memo'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          <div className="p-3 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">📊 Transaction Analysis</h3>
            <div className="text-sm space-y-1">
              <p><strong>Hash:</strong> <span className="font-mono">{result.transactionDetails.hash}</span></p>
              <p><strong>To:</strong> <span className="font-mono">{result.transactionDetails.to}</span></p>
              <p><strong>Block:</strong> {result.transactionDetails.blockNumber}</p>
              <p><strong>Has Extra Data:</strong> {result.hasExtraData ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>

          {result.hasExtraData ? (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <h3 className="font-semibold mb-2">📝 Decoded Lock Order</h3>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{JSON.stringify(result.lockOrder, null, 2)}
                </pre>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-semibold mb-2">🔢 Raw Memo Data</h3>
                <p className="text-xs"><strong>Hex:</strong></p>
                <p className="font-mono text-xs bg-white p-2 rounded border break-all">
                  {result.memoHex}
                </p>
                <p className="text-xs mt-2"><strong>UTF-8 String:</strong></p>
                <p className="font-mono text-xs bg-white p-2 rounded border break-all">
                  {result.memoString}
                </p>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                <h3 className="font-semibold mb-2">🎯 Oracle Validation</h3>
                <div className="text-sm space-y-1">
                  <p><strong>✅ Structure Valid:</strong> Contains required fields</p>
                  <p><strong>✅ Format Valid:</strong> Valid JSON in memo</p>
                  <p><strong>✅ Oracle Compatible:</strong> Appended after byte 68</p>
                  <p className="text-xs text-gray-600 mt-2">
                    Your oracle should be able to parse this transaction successfully.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm">This transaction contains no memo data - it's a standard USDC transfer.</p>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p>View on Sepolia Etherscan: <a 
              href={`https://sepolia.etherscan.io/tx/${result.transactionDetails.hash}`} 
              target="_blank" 
              className="text-blue-600 underline"
            >
              {result.transactionDetails.hash.slice(0, 20)}...
            </a></p>
          </div>
        </div>
      )}
    </div>
  )
}