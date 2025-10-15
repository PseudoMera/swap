import { getApiConfigByCommittee } from "@/config/reown";

export async function fetchHeight(committee: number = 0): Promise<number> {
  const apiConfig = getApiConfigByCommittee(committee);
  const response = await fetch(`${apiConfig.QUERY_URL}/height`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) throw new Error("Failed to fetch height");
  return response.json();
}
