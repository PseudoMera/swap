import { NextRequest, NextResponse } from "next/server";
import { getApiConfigByCommittee } from "@/config/reown";

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
        { status: 400 }
      );
    }

    const apiConfig = getApiConfigByCommittee(committee);

    // Check if endpoint contains "admin" to determine which URL to use
    const isAdminEndpoint = endpoint.includes("admin");
    const baseUrl = isAdminEndpoint ? apiConfig.ADMIN_URL : apiConfig.QUERY_URL;

    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${baseUrl}/${cleanEndpoint}`;

    console.log(`[Proxy] POST ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const contentType = response.headers.get("content-type");
    const responseText = await response.text();

    console.log(`[Proxy] Response status: ${response.status}`);
    console.log(`[Proxy] Content-Type: ${contentType}`);
    console.log(`[Proxy] Response body: ${responseText.substring(0, 200)}`);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[Proxy] Failed to parse JSON response:`, responseText);
      return NextResponse.json(
        { error: "Invalid JSON response from backend", rawResponse: responseText },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error(`[Proxy] Error ${response.status}:`, responseData);
      return NextResponse.json(
        { error: responseData },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[Proxy] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy request failed" },
      { status: 500 }
    );
  }
}
