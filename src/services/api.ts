import axios from 'axios';

// Prefer using the OpenRouter FE SDK when available (installed package or UMD global).
// We import the SDK dynamically at runtime to avoid Vite / SSR build-time issues.
// If the FE SDK isn't present, fall back to the existing axios-based direct HTTP request.

declare global {
  interface Window {
    OpenRouter?: any;
  }
}

export async function generateHtmlRequest(apiKey: string | null, payload: any, signal?: AbortSignal) {
  // Attempt dynamic import of the installed SDK only at runtime (browser)
  let RouterLib: any = null;
  if (typeof window !== 'undefined' && apiKey) {
    try {
      const mod = await import('@openrouter/sdk');
      RouterLib = mod.default || mod.OpenRouter || mod;
    } catch (e) {
      // dynamic import failed (package not resolvable at runtime or bundler issue) — we'll fall back to axios
      RouterLib = null;
    }
  }

  const hasGlobalSdk = typeof window !== 'undefined' && !!(window as any).OpenRouter;

  if ((RouterLib || hasGlobalSdk) && apiKey) {
    try {
      const Lib = RouterLib || (window as any).OpenRouter;
      const client = new Lib({ apiKey });

      // SDK surface differs between versions — prefer chat.send or chat.completions.create where available.
      // Note: AbortSignal support may not be available; this call omits signal.
      let result: any = null;

      if (client.chat && typeof client.chat.send === 'function') {
        // new sdk: chat.send expects an object with ChatRequest body
        result = await client.chat.send({ ChatRequest: payload });
      } else if (client.chat && client.chat.completions && typeof client.chat.completions.create === 'function') {
        // alternate surface
        result = await client.chat.completions.create(payload);
      } else {
        throw new Error('OpenRouter SDK: chat API not found on client');
      }

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
