import type {
  CanopyKeyfile,
  EncryptedCanopyKeyfile,
  CanopyKeyfileCollection,
  KeyfileFormat,
} from "@/types/wallet";

export interface KeyfileValidationResult {
  isValid: boolean;
  errors: string[];
  accounts?: CanopyKeyfile[];
  format?: KeyfileFormat;
}

/**
 * Validates if the uploaded JSON follows the expected keyfile format
 */
export function validateKeyfileFormat(
  jsonData: unknown,
): KeyfileValidationResult {
  const errors: string[] = [];

  // Check if it's valid JSON (should already be parsed at this point)
  if (jsonData === null || jsonData === undefined) {
    return {
      isValid: false,
      errors: ["Invalid JSON: File is empty or corrupted"],
    };
  }

  if (typeof jsonData !== "object") {
    return {
      isValid: false,
      errors: ["Invalid format: Expected object or array of objects"],
    };
  }

  // Detect format type
  const format = detectKeyfileFormat(jsonData);

  let validatedKeyfiles: CanopyKeyfile[] = [];

  if (format === "encrypted") {
    // Handle encrypted format (object with named keys containing encrypted data)
    const result = validateEncryptedKeyfileFormat(
      jsonData as CanopyKeyfileCollection,
    );
    errors.push(...result.errors);
    validatedKeyfiles = result.accounts || [];
  } else {
    // Handle plain format (single keyfile or array of keyfiles)
    let keyfiles: unknown[];
    if (Array.isArray(jsonData)) {
      keyfiles = jsonData;
    } else {
      keyfiles = [jsonData];
    }

    // Validate each keyfile
    keyfiles.forEach((keyfile, index) => {
      const keyfileErrors = validateSingleKeyfile(keyfile, index);

      if (keyfileErrors.length === 0) {
        validatedKeyfiles.push(keyfile as CanopyKeyfile);
      } else {
        errors.push(...keyfileErrors);
      }
    });
  }

  // Check if we have at least one valid keyfile
  if (validatedKeyfiles.length === 0) {
    errors.push("No valid keyfiles found in the uploaded file");
  }

  // Check for duplicate addresses
  const addresses = validatedKeyfiles.map((kf) => kf.Address);
  const duplicates = addresses.filter(
    (addr, index) => addresses.indexOf(addr) !== index,
  );
  if (duplicates.length > 0) {
    errors.push(
      `Duplicate addresses found: ${[...new Set(duplicates)].join(", ")}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    accounts: validatedKeyfiles,
    format,
  };
}

/**
 * Validates a single keyfile object
 */
function validateSingleKeyfile(keyfile: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Keyfile ${index + 1}:`;

  // Check if it's an object
  if (!keyfile || typeof keyfile !== "object") {
    errors.push(`${prefix} Must be an object`);
    return errors;
  }

  const kf = keyfile as Record<string, unknown>;

  // Required fields validation
  const requiredFields = ["Address", "PublicKey", "PrivateKey"];

  for (const field of requiredFields) {
    if (!kf[field]) {
      errors.push(`${prefix} Missing required field '${field}'`);
    } else if (typeof kf[field] !== "string") {
      errors.push(`${prefix} Field '${field}' must be a string`);
    } else if ((kf[field] as string).trim().length === 0) {
      errors.push(`${prefix} Field '${field}' cannot be empty`);
    }
  }

  // Address format validation (basic check for hex format)
  if (kf.Address && typeof kf.Address === "string") {
    const address = kf.Address as string;
    if (!isValidAddress(address)) {
      errors.push(`${prefix} Invalid address format: ${address}`);
    }
  }

  // Key format validation (basic length checks)
  if (kf.PublicKey && typeof kf.PublicKey === "string") {
    const publicKey = kf.PublicKey as string;
    // Check for valid hex format and reasonable length (32+ chars for practical keys)
    const hexRegex = /^[a-fA-F0-9]+$/;
    if (!hexRegex.test(publicKey)) {
      errors.push(
        `${prefix} Public key must contain only hexadecimal characters`,
      );
    } else if (publicKey.length < 32) {
      errors.push(`${prefix} Public key appears to be too short`);
    }
  }

  if (kf.PrivateKey && typeof kf.PrivateKey === "string") {
    const privateKey = kf.PrivateKey as string;
    // Check for valid hex format and reasonable length (32+ chars for practical keys)
    const hexRegex = /^[a-fA-F0-9]+$/;
    if (!hexRegex.test(privateKey)) {
      errors.push(
        `${prefix} Private key must contain only hexadecimal characters`,
      );
    } else if (privateKey.length < 32) {
      errors.push(`${prefix} Private key appears to be too short`);
    }
  }

  return errors;
}

/**
 * Detect keyfile format type
 */
function detectKeyfileFormat(jsonData: unknown): KeyfileFormat {
  if (!jsonData || typeof jsonData !== "object") return "plain";

  // Check if it's an array (plain format)
  if (Array.isArray(jsonData)) return "plain";

  const obj = jsonData as Record<string, unknown>;

  // Check if it has direct Address/PublicKey/PrivateKey properties (plain format)
  if ("Address" in obj || "PublicKey" in obj || "PrivateKey" in obj) {
    return "plain";
  }

  // Check if it has nested objects with encrypted keyfile properties
  const firstKey = Object.keys(obj)[0];
  if (firstKey && typeof obj[firstKey] === "object" && obj[firstKey] !== null) {
    const firstEntry = obj[firstKey] as Record<string, unknown>;
    if (
      "keyAddress" in firstEntry &&
      "encrypted" in firstEntry &&
      "publicKey" in firstEntry
    ) {
      return "encrypted";
    }
  }

  return "plain";
}

/**
 * Validate encrypted keyfile format
 */
function validateEncryptedKeyfileFormat(collection: CanopyKeyfileCollection): {
  errors: string[];
  accounts: CanopyKeyfile[];
} {
  const errors: string[] = [];
  const accounts: CanopyKeyfile[] = [];

  const entries = Object.entries(collection);

  if (entries.length === 0) {
    errors.push("No accounts found in keyfile");
    return { errors, accounts };
  }

  entries.forEach(([nickname, encryptedKeyfile]) => {
    const prefix = `Account "${nickname}":`;

    if (!encryptedKeyfile || typeof encryptedKeyfile !== "object") {
      errors.push(`${prefix} Invalid account data`);
      return;
    }

    // Required fields for encrypted format
    const requiredFields = [
      "publicKey",
      "salt",
      "encrypted",
      "keyAddress",
      "keyNickname",
    ];

    for (const field of requiredFields) {
      if (
        !(field in encryptedKeyfile) ||
        typeof encryptedKeyfile[field as keyof EncryptedCanopyKeyfile] !==
          "string"
      ) {
        errors.push(`${prefix} Missing or invalid field '${field}'`);
      }
    }

    // Validate keyAddress format
    if (
      encryptedKeyfile.keyAddress &&
      typeof encryptedKeyfile.keyAddress === "string"
    ) {
      if (!isValidAddress(encryptedKeyfile.keyAddress)) {
        errors.push(
          `${prefix} Invalid keyAddress format: ${encryptedKeyfile.keyAddress}`,
        );
      }
    }

    // Validate hex fields
    const hexFields = ["publicKey", "salt", "encrypted"];
    hexFields.forEach((field) => {
      const value = encryptedKeyfile[field as keyof EncryptedCanopyKeyfile];
      if (value && typeof value === "string") {
        const hexRegex = /^[a-fA-F0-9]+$/;
        if (!hexRegex.test(value)) {
          errors.push(
            `${prefix} Field '${field}' must contain only hexadecimal characters`,
          );
        } else if (value.length < 16) {
          errors.push(`${prefix} Field '${field}' appears to be too short`);
        }
      }
    });

    // If validation passed, create a CanopyKeyfile representation
    if (
      encryptedKeyfile.keyAddress &&
      isValidAddress(encryptedKeyfile.keyAddress)
    ) {
      accounts.push({
        Address: encryptedKeyfile.keyAddress,
        PublicKey: encryptedKeyfile.publicKey || "",
        PrivateKey: "[encrypted]", // We don't have the actual private key, it's encrypted
      });
    }
  });

  return { errors, accounts };
}

/**
 * Basic address validation
 */
function isValidAddress(address: string): boolean {
  // Check if it's a valid hex address format (with or without 0x prefix)
  const hexWithPrefixRegex = /^0x[a-fA-F0-9]{40}$/;
  const hexWithoutPrefixRegex = /^[a-fA-F0-9]{40}$/;

  return (
    hexWithPrefixRegex.test(address) || hexWithoutPrefixRegex.test(address)
  );
}

/**
 * Get human-readable error message for UI display
 */
export function getValidationErrorMessage(
  result: KeyfileValidationResult,
): string {
  if (result.isValid) return "";

  if (result.errors.length === 1) {
    return result.errors[0];
  }

  return `Multiple issues found:\n• ${result.errors.join("\n• ")}`;
}
