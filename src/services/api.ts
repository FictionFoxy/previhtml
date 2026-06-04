import axios from 'axios';

// Prefer using the OpenRouter FE SDK when available in the browser (UMD global or installed package).
// If the FE SDK isn't present, fall back to the existing axios-based direct HTTP request.

declare global {
  interface Window {
    OpenRouter?: any;
  }
}

export async function generateHtmlRequest(apiKey: string | null, payload: any, signal?: AbortSignal) {
  // If running in a browser and the OpenRouter UMD SDK was loaded (e.g. via CDN), use it.
  const hasGlobalSDK = typeof window !== 'undefined' && !!(window as any).OpenRouter;

  if (hasGlobalSDK && apiKey) {
    try {
      const OpenRouter = (window as any).OpenRouter;
      const client = new OpenRouter({ apiKey });

      // The FE SDK exposes chat.completions.create(payload)
      // We don't have a standardized AbortSignal integration here, so call without signal.
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
