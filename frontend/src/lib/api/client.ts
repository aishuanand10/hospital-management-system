import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/lib/auth/storage";
import type { AuthTokens, LoginCredentials, User } from "@/types/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api/v1";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data as { detail?: string })?.detail || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }
  return data as T;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const response = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = await response.json();
  const access = (data as { access: string; refresh?: string }).access;
  const newRefresh = (data as { refresh?: string }).refresh ?? refresh;
  setTokens({ access, refresh: newRefresh });
  return access;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const access = getAccessToken();
  if (access) {
    headers.set("Authorization", `Bearer ${access}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401 && retry) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers.set("Authorization", `Bearer ${newAccess}`);
      const retryResponse = await fetch(`${API_URL}${path}`, { ...options, headers });
      return parseResponse<T>(retryResponse);
    }
  }

  return parseResponse<T>(response);
}

export async function login(credentials: LoginCredentials): Promise<AuthTokens> {
  const response = await fetch(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const data = await parseResponse<AuthTokens>(response);
  setTokens(data);
  return data;
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  try {
    if (refresh) {
      await apiFetch("/auth/logout/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      });
    }
  } finally {
    clearTokens();
  }
}

export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>("/auth/me/");
}

export async function checkHealth(): Promise<{ status: string; database: string }> {
  const response = await fetch(`${API_URL}/health/`);
  return parseResponse(response);
}
