import RecentTransactionsCard from "@/components/recent-transactions/RecentTransactionsCard";
import SwapCard from "@/components/swap-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel */}
      <div className="flex flex-col gap-6 lg:col-span-1">
        {/* Swap Panel */}
        <SwapCard />
        {/* Recent Transactions */}
        <RecentTransactionsCard />
      </div>
      {/* Main Panel */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Order Book */}
        <Card>
          <CardHeader>
            <CardTitle>Order Book</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">
              Dummy content for Order Book
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
