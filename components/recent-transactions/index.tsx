import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

type Transaction = {
  from: string;
  to: string;
  amount: string;
  rate: string;
  time: string;
};

const transactions: Transaction[] = [
  {
    from: "USDC",
    to: "CNPY",
    amount: "100 USDC",
    rate: "2.45",
    time: "10 min ago",
  },
  {
    from: "ETH",
    to: "CNPY",
    amount: "0.05 ETH",
    rate: "1250.00",
    time: "2 hours ago",
  },
  {
    from: "USDT",
    to: "CNPY",
    amount: "250 USDT",
    rate: "2.43",
    time: "1 day ago",
  },
];

function RecentTransactionsCard() {
  return (
    <Card className="max-w-md w-full mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0">
        {transactions.map((tx, i) => (
          <div key={i} className="flex items-center py-4 first:pt-0 last:pb-0">
            {/* Left: Icon */}
            <div className="flex-shrink-0">
              <div className="rounded-full bg-muted/50 w-9 h-9 flex items-center justify-center mr-4">
                <ArrowRight className="text-green-500 w-5 h-5" />
              </div>
            </div>
            {/* Middle: Details */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-base text-foreground truncate">
                  {tx.from}{" "}
                  <span className="mx-1 text-muted-foreground">→</span> {tx.to}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{tx.time}</span>
            </div>
            {/* Right: Amount and Rate */}
            <div className="flex flex-col items-end min-w-[80px]">
              <span className="font-medium text-base text-foreground">
                {tx.amount}
              </span>
              <span className="text-xs text-muted-foreground">
                Rate: {tx.rate}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default RecentTransactionsCard;
