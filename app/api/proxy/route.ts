import { NextRequest, NextResponse } from "next/server";
import { getApiConfigByCommittee, ENV_CONFIG } from "@/config/reown";

/**
 * API Proxy to bypass CORS restrictions
 * Forwards POST requests from frontend to backend
 */
export async function POST(request: NextRequest) {
  try {
    const { endpoint, committee = 1, data } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint parameter" },
        { status: 400 },
      );
    }

    const apiConfig = getApiConfigByCommittee(committee);

    // Determine which base URL to use
    let baseUrl: string;

    // /v1/tx should use RPC_URL (port 50002)
    if (endpoint === "/v1/tx") {
      baseUrl = ENV_CONFIG.RPC_URL;
    } else {
      // Admin endpoints that should use ADMIN_URL
      const adminEndpoints = [
        "/tx-create-order",
        "/tx-edit-order",
        "/tx-delete-order",
        "/keystore-import",
      ];

      const isAdminEndpoint = adminEndpoints.some((adminPath) =>
        endpoint.includes(adminPath),
      );
      baseUrl = isAdminEndpoint ? apiConfig.ADMIN_URL : apiConfig.QUERY_URL;
    }

    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith("/")
      ? endpoint.slice(1)
      : endpoint;
    const url = `${baseUrl}/${cleanEndpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseText = await response.text();

    console.log(`[Proxy] Response status: ${response.status}`);
    console.log(`[Proxy] Response body: ${responseText.substring(0, 200)}`);

    // /v1/tx returns plain text (transaction hash), not JSON
    if (endpoint === "/v1/tx") {
      if (!response.ok) {
        console.error(`[Proxy] Error ${response.status}:`, responseText);
        return new NextResponse(responseText, { status: response.status });
      }
      return new NextResponse(responseText, { status: 200 });
    }

    // All other endpoints return JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[Proxy] Failed to parse JSON response:`, responseText);
      console.error(`[Proxy] ${parseError}`);
      return NextResponse.json(
        {
          error: "Invalid JSON response from backend",
          rawResponse: responseText,
        },
        { status: 502 },
      );
    }

    if (!response.ok) {
      console.error(`[Proxy] Error ${response.status}:`, responseData);
      return NextResponse.json(
        { error: responseData },
        { status: response.status },
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[Proxy] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Proxy request failed",
      },
      { status: 500 },
    );
  }
}
