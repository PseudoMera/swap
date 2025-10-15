import { getApiConfigByCommittee } from "@/config/reown";
import { EncryptedCanopyKeyfile } from "@/types/wallet";

export const importKeyStore = async (
  committee: number = 1,
  keyfile: EncryptedCanopyKeyfile,
): Promise<string> => {
  const apiConfig = getApiConfigByCommittee(committee);
  const response = await fetch(`${apiConfig.ADMIN_URL}/keystore-import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nickname: keyfile.keyNickname,
      address: keyfile.keyAddress,
      publicKey: keyfile.publicKey,
      salt: keyfile.salt,
      encrypted: keyfile.encrypted,
    }),
  });

  if (!response.ok) throw new Error("Failed to import keystore");
  return response.json();
};
