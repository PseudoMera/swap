import { cn } from "@/lib/utils";
import { TransactionStatus } from "@/types/transactions";

interface StatusBadgeProps {
  status: TransactionStatus;
  className?: string;
}

function getStatusStyles(status: TransactionStatus) {
  switch (status) {
    case "Open":
      return "bg-green-500 text-white border-green-500";
    case "Pending":
      return "bg-orange-500 text-white border-orange-500";
    case "Completed":
      return "bg-gray-500 text-white border-gray-500";
    default:
      return "bg-gray-400 text-white border-gray-400";
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        getStatusStyles(status),
        className,
      )}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
