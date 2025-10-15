export async function fetchHeight(committee: number = 1): Promise<number> {
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: "/height",
      committee,
    }),
  });
  if (!response.ok) throw new Error("Failed to fetch height");
  return response.json();
}
