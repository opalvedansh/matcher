import { supabase } from '../supabase';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ─── Fix 2: Physical Device Networking ────────────────────────────
// `localhost` resolves to the phone itself on physical devices.
// We use the Expo Metro bundler host (your Mac's LAN IP) in dev instead.
function getBaseUrl(): string {
  if (__DEV__ && Platform.OS !== 'web') {
    const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
    const host = debuggerHost?.split(':')[0] ?? 'localhost';
    return `http://${host}:4000`;
  }
  return process.env.EXPO_PUBLIC_API_URL ?? 'https://mymatcher-production.up.railway.app';
}

const BASE_URL = getBaseUrl();

// ─── Error shape ──────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Token helper ─────────────────────────────────────────────────
async function getToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Parse body regardless of status
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // no-op — body might be empty
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error ?? `HTTP ${res.status}`,
      body?.detail,
    );
  }

  return body as T;
}

// ─── Convenience helpers ──────────────────────────────────────────
export const api = {
  get:    <T>(path: string)                   => request<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body: unknown)    => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)    => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)                   => request<T>(path, { method: 'DELETE' }),
};

export default api;
