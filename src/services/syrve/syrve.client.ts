import {
  SYRVE_BASE_URL,
  SYRVE_NOMENCLATURE_ENDPOINT,
  SYRVE_TARGET_ORGANIZATION_ID,
} from "./syrve.constants";
import { SyrveNomenclatureResponse } from "./syrve.types";

const ACCESS_TOKEN_ENDPOINT = "/api/1/access_token";

interface SyrveAccessTokenResponse {
  correlationId?: string;
  token?: string;
}

function getSyrveApiLogin(): string {
  const apiLogin = process.env.SYRVE_API_LOGIN;

  if (!apiLogin) {
    throw new Error("SYRVE_API_LOGIN is not set in environment variables");
  }

  return apiLogin;
}

async function getFreshSyrveToken(): Promise<string> {
  const apiLogin = getSyrveApiLogin();

  const response = await fetch(`${SYRVE_BASE_URL}${ACCESS_TOKEN_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiLogin,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Failed to get Syrve access token: ${response.status} ${response.statusText}. ${errorText}`
    );
  }

  const data = (await response.json()) as SyrveAccessTokenResponse;

  if (!data.token) {
    throw new Error("Syrve access token is missing in response");
  }

  return data.token;
}

async function parseWindows1251Json<T>(response: Response): Promise<T> {
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder("windows-1251");
  const text = decoder.decode(buffer);

  return JSON.parse(text) as T;
}

export async function fetchSyrveNomenclature(): Promise<SyrveNomenclatureResponse> {
  const token = await getFreshSyrveToken();

  const response = await fetch(
    `${SYRVE_BASE_URL}${SYRVE_NOMENCLATURE_ENDPOINT}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        organizationId: SYRVE_TARGET_ORGANIZATION_ID,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Syrve nomenclature request failed: ${response.status} ${response.statusText}. ${errorText}`
    );
  }

  const data = await parseWindows1251Json<SyrveNomenclatureResponse>(response);

  if (!data.groups || !data.products) {
    throw new Error("Invalid Syrve response: groups or products missing");
  }

  return data;
}