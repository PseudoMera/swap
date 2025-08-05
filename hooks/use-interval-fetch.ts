import { API_INTERVAL_REQUEST } from "@/constants/api";
import { useEffect, useState } from "react";

// Payload or rpc call may need to be memoized
// If the reference is not stable just try useMmemo or usecallback
function useIntervalFetch<T, P>(
  rpcCall: (payload: P) => Promise<T>,
  payload: P,
  interval: number = API_INTERVAL_REQUEST,
): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await rpcCall(payload);
        setData(response);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData(); // Fetch immediately on mount or payload change

    const intervalId = setInterval(fetchData, interval);

    return () => clearInterval(intervalId);
  }, [rpcCall, payload, interval]);

  return data;
}

export default useIntervalFetch;
