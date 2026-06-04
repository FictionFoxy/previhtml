import axios from 'axios';

export async function generateHtmlRequest(apiKey: string | null, payload: any, signal?: AbortSignal) {
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
