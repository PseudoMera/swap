import { cn } from "@/lib/utils";

interface TransactionTypeBadgeProps {
  type: string;
  className?: string;
}

function getTypeStyles(type: string) {
  switch (type.toLowerCase()) {
    case 'sell':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'buy':
      return 'bg-primary/10 text-primary border-primary/20';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function TransactionTypeBadge({ type, className }: TransactionTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded text-xs font-medium border",
        getTypeStyles(type),
        className
      )}
    >
      {type}
    </span>
  );
}

export default TransactionTypeBadge;