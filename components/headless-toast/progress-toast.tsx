import { useEffect, useRef, useState } from "react";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProgressToastProps {
  payAssetSymbol: string;
  receiveAssetSymbol: string;
  duration?: number; // Duration in milliseconds, defaults to 20 seconds
  title?: string;
}

function ProgressToast({
  payAssetSymbol,
  receiveAssetSymbol,
  duration = 20000,
  title = "Ask Creation in Progress",
}: ProgressToastProps) {
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const estimatedSecondsLeft = Math.ceil((progress / 100) * (duration / 1000));

  useEffect(() => {
    const interval = 100; // Update every 100ms for smooth animation
    const decrement = 100 / (duration / interval);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrement;
        if (next <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [duration]);

  return (
    <div className="w-full min-w-[320px] text-black">
      <div className="w-full flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <RefreshCcw className="animate-spin text-black" size={20} />
          <div className="flex flex-col">
            <span className="text-black font-medium">{title}</span>
            <span className="flex gap-2 items-center text-black">
              {payAssetSymbol} <ArrowRight size={16} /> {receiveAssetSymbol}
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-700">
          Estimated completion: {estimatedSecondsLeft} seconds
        </div>
      </div>
      <Progress
        value={progress}
        className="w-full mt-3 h-2 bg-gray-200 [&>[data-slot=progress-indicator]]:bg-[#76E698]"
      />
    </div>
  );
}

export default ProgressToast;
