export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

interface ValidatedConfig {
  PROJECT_ID: string;
  RPC_URL: string;
  ADMIN_RPC_URL: string;
  KEYFILE_SECRET: string;
  EXPLORER_URL: string;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isValidProjectId(projectId: string): boolean {
  // Reown project IDs are typically 32-character hex strings
  return /^[a-f0-9]{32}$/i.test(projectId);
}

function isValidSecret(secret: string): boolean {
  const isDevelopment = process.env.NODE_ENV === "development";
  if (isDevelopment) {
    return true;
  }
  // Minimum 32 characters for security
  return secret.length >= 32;
}

export function validateEnvironment(): ValidatedConfig {
  const errors: string[] = [];
  const isDevelopment = process.env.NODE_ENV === "development";

  // Validate Project ID
  const PROJECT_ID = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
  if (!PROJECT_ID) {
    errors.push("NEXT_PUBLIC_REOWN_PROJECT_ID is required");
  } else if (!isValidProjectId(PROJECT_ID)) {
    errors.push(
      "NEXT_PUBLIC_REOWN_PROJECT_ID must be a valid 32-character hex string",
    );
  }

  // Validate RPC URL
  const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
  if (!RPC_URL) {
    if (isDevelopment) {
      // In development, use localhost default but warn
      console.warn(
        "NEXT_PUBLIC_RPC_URL not set, using default localhost:50002",
      );
    } else {
      errors.push("NEXT_PUBLIC_RPC_URL is required in production");
    }
  } else if (!isValidUrl(RPC_URL)) {
    errors.push("NEXT_PUBLIC_RPC_URL must be a valid HTTP/HTTPS URL");
  }

  // Validate Admin RPC URL
  const ADMIN_RPC_URL = process.env.NEXT_PUBLIC_ADMIN_RPC_URL;
  if (!ADMIN_RPC_URL) {
    if (isDevelopment) {
      // In development, use localhost default but warn
      console.warn(
        "NEXT_PUBLIC_ADMIN_RPC_URL not set, using default localhost:50003",
      );
    } else {
      errors.push("NEXT_PUBLIC_ADMIN_RPC_URL is required in production");
    }
  } else if (!isValidUrl(ADMIN_RPC_URL)) {
    errors.push("NEXT_PUBLIC_ADMIN_RPC_URL must be a valid HTTP/HTTPS URL");
  }

  // Validate Keyfile Secret
  const KEYFILE_SECRET = process.env.NEXT_PUBLIC_KEYFILE_SECRET;
  if (!KEYFILE_SECRET) {
    errors.push("NEXT_PUBLIC_KEYFILE_SECRET is required for wallet encryption");
  } else if (!isValidSecret(KEYFILE_SECRET)) {
    errors.push(
      "NEXT_PUBLIC_KEYFILE_SECRET must be at least 32 characters for security",
    );
  }

  // Validate Explorer URL
  const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL;
  if (!EXPLORER_URL) {
    errors.push("NEXT_PUBLIC_EXPLORER_URL is required for transaction links");
  } else if (!isValidUrl(EXPLORER_URL)) {
    errors.push("NEXT_PUBLIC_EXPLORER_URL must be a valid HTTP/HTTPS URL");
  }

  // In production, ensure no localhost URLs
  if (!isDevelopment) {
    if (RPC_URL?.includes("localhost") || RPC_URL?.includes("127.0.0.1")) {
      errors.push("NEXT_PUBLIC_RPC_URL cannot use localhost in production");
    }
    if (
      ADMIN_RPC_URL?.includes("localhost") ||
      ADMIN_RPC_URL?.includes("127.0.0.1")
    ) {
      errors.push(
        "NEXT_PUBLIC_ADMIN_RPC_URL cannot use localhost in production",
      );
    }
  }

  if (errors.length > 0) {
    throw new ConfigError(
      `Environment validation failed:\n${errors.join("\n")}`,
    );
  }

  return {
    PROJECT_ID: PROJECT_ID!,
    RPC_URL: RPC_URL || "http://localhost:50002",
    ADMIN_RPC_URL: ADMIN_RPC_URL || "http://localhost:50003",
    KEYFILE_SECRET: KEYFILE_SECRET!,
    EXPLORER_URL: EXPLORER_URL!,
  };
}

// Validate on module load
let validatedConfig: ValidatedConfig;
try {
  validatedConfig = validateEnvironment();
} catch (error) {
  console.error("❌ Environment validation failed:", error);
  throw error;
}

export { validatedConfig };
