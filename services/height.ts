import { API_CONFIG } from "@/config";

export async function fetchHeight(): Promise<number> {
  const response = await fetch(`${API_CONFIG.QUERY_URL}/height`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) throw new Error("Failed to fetch height");
  return response.json();
}
