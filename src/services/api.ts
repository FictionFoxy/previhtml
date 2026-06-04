import axios from 'axios';
import OpenRouter from '@openrouter/sdk';

// Prefer using the OpenRouter FE SDK when available (installed package or UMD global).
// If the FE SDK isn't present, fall back to the existing axios-based direct HTTP request.

declare global {
  interface Window {
    OpenRouter?: any;
  }
}

export async function generateHtmlRequest(apiKey: string | null, payload: any, signal?: AbortSignal) {
  // If running in a browser and the installed SDK is available, use it.
  const hasInstalledSdk = !!OpenRouter;
  const hasGlobalSdk = typeof window !== 'undefined' && !!(window as any).OpenRouter;

  if ((hasInstalledSdk || hasGlobalSdk) && apiKey) {
    try {
      const RouterLib = hasInstalledSdk ? OpenRouter : (window as any).OpenRouter;
      const client = new RouterLib({ apiKey });

      // The SDK exposes chat.completions.create(payload)
      // Note: AbortSignal support may not be available; this call omits signal.
      const result = await client.chat.completions.create(payload);

      // Normalize to an axios-like response shape expected by the caller
      return {
        status: 200,
        statusText: 'OK',
        data: result,
      };
    } catch (err) {
      // bubble up to caller to handle logging/formatting
      throw err;
    }
  }

  // Fallback: direct HTTP request using axios (same behavior as before)
  const instance = axios.create({
    baseURL: 'https://openrouter.ai',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    timeout: 20000,
  });

  // axios supports AbortSignal in request config
  const res = await instance.post('/v1/chat/completions', payload, { signal });
  return res;
}
