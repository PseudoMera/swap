import { Card, CardContent } from "@/components/ui/card";
import { TransactionStats } from "@/types/transactions";
import { formatAmount, formatCurrency } from "@/utils/transactions";

interface StatsCardsProps {
  stats: TransactionStats;
  loading?: boolean;
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  const statItems = [
    {
      title: "Total Transactions",
      value: stats.totalTransactions.toLocaleString(),
      icon: "📋",
    },
    {
      title: "Total Volume",
      value: `$${formatAmount(stats.totalVolume, 2)}`,
      icon: "💰",
    },
    {
      title: "Success Rate",
      value: `${formatAmount(stats.successRate, 1)}%`,
      icon: "✅",
    },
    {
      title: "Avg. Fee",
      value: formatCurrency(stats.avgFee),
      icon: "💸",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-8 bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </p>
                <p className="text-2xl font-bold text-[#111827]">
                  {item.value}
                </p>
              </div>
              <span className="text-2xl">{item.icon}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default StatsCards;
