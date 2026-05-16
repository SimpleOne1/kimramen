import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/admin/guard";

const SYRVE_BASE_URL = "https://api-eu.syrve.live";
const ACCESS_TOKEN_ENDPOINT = "/api/1/access_token";
const NOMENCLATURE_ENDPOINT = "/api/1/nomenclature";
const ORGANIZATION_ID = "65d544e4-d155-4d7a-bdeb-c66fecc5aae5";

interface SyrveAccessTokenResponse {
  token?: string;
}

function getSyrveApiLogin(): string {
  const apiLogin = process.env.SYRVE_API_LOGIN;

  if (!apiLogin) {
    throw new Error("SYRVE_API_LOGIN is not set");
  }

  return apiLogin;
}

async function getFreshToken(): Promise<string> {
  const response = await fetch(`${SYRVE_BASE_URL}${ACCESS_TOKEN_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiLogin: getSyrveApiLogin(),
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as SyrveAccessTokenResponse;

  if (!data.token) {
    throw new Error("No Syrve token returned");
  }

  return data.token;
}

export async function GET() {
  try {
    const guard = await requireAdmin("syrve.sync");
    if (!guard.ok) return guard.response;
    const token = await getFreshToken();

    const response = await fetch(`${SYRVE_BASE_URL}${NOMENCLATURE_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        organizationId: ORGANIZATION_ID,
      }),
      cache: "no-store",
    });

    const buffer = await response.arrayBuffer();

    const utf8 = new TextDecoder("utf-8").decode(buffer);
    const win1251 = new TextDecoder("windows-1251").decode(buffer);
    const latin1 = Buffer.from(buffer).toString("latin1");

    return NextResponse.json({
      success: true,
      preview: {
        utf8: utf8.slice(0, 2000),
        windows1251: win1251.slice(0, 2000),
        latin1: latin1.slice(0, 2000),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
