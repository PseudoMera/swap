import { EncryptedCanopyKeyfile } from "@/types/wallet";

export const importKeyStore = async (
  committee: number = 3,
  keyfile: EncryptedCanopyKeyfile,
): Promise<string> => {
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: "/keystore-import",
      committee,
      data: {
        nickname: keyfile.keyNickname,
        address: keyfile.keyAddress,
        publicKey: keyfile.publicKey,
        salt: keyfile.salt,
        encrypted: keyfile.encrypted,
      },
    }),
  });

  if (!response.ok) throw new Error("Failed to import keystore");
  return response.json();
};
