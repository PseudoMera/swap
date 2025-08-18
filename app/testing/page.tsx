"use client";

import { USDCSelfSend } from "@/components/USDCSelfSend";
import { MemoVerifier } from "@/components/MemoVerifier";

export default function TestingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 USDC Testing & Development</h1>
        <p className="text-gray-600">
          Test USDC transactions with memo data for oracle integration. Use Sepolia testnet only.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <USDCSelfSend />
        </div>
        
        <div className="space-y-6">
          <MemoVerifier />
          
          <div className="p-6 border rounded-lg bg-blue-50">
            <h2 className="text-xl font-bold mb-4">📋 Testing Guide</h2>
            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-semibold">1. Setup</h3>
                <p>• Switch to Sepolia testnet</p>
                <p>• Get USDC from <a href="https://faucet.circle.com/" target="_blank" className="text-blue-600 underline">Circle Faucet</a></p>
              </div>
              
              <div>
                <h3 className="font-semibold">2. Test Regular Transfer</h3>
                <p>• Send small amount (use Min button for 0.000001 USDC)</p>
                <p>• Verify transaction succeeds</p>
              </div>
              
              <div>
                <h3 className="font-semibold">3. Test Memo Transfer</h3>
                <p>• Enable "Include Oracle Memo Data"</p>
                <p>• Send minimum amount (0.000001 USDC) to test memo</p>
                <p>• Copy transaction hash</p>
              </div>
              
              <div>
                <h3 className="font-semibold">4. Verify Memo</h3>
                <p>• Paste transaction hash in verifier</p>
                <p>• Check decoded lock order data</p>
                <p>• Confirm oracle compatibility</p>
              </div>
            </div>
          </div>

          <div className="p-6 border rounded-lg bg-yellow-50">
            <h2 className="text-xl font-bold mb-4">⚠️ Important Notes</h2>
            <div className="space-y-2 text-sm">
              <p>• <strong>Testnet Only:</strong> Never use mainnet for testing</p>
              <p>• <strong>Minimum Amount:</strong> Use 0.000001 USDC (1 unit) for testing</p>
              <p>• <strong>Quick Amounts:</strong> Use Min button or 0.01 for convenience</p>
              <p>• <strong>Oracle Format:</strong> Memo includes order_id, addresses, deadline</p>
              <p>• <strong>Transaction Structure:</strong> Standard USDC transfer + JSON memo</p>
              <p>• <strong>Etherscan:</strong> View transactions to see input data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}