import { env } from '../../config/env';

export async function chatCompletion(
  messages: Array<{ role: string; content: string }>,
  system?: string
): Promise<string> {
  const url = `${env.NVIDIA_API_URL}/chat/completions`;

  const payloadMessages = [...messages];
  if (system) {
    payloadMessages.unshift({ role: 'system', content: system });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      model: env.NVIDIA_API_MODEL,
      messages: payloadMessages,
      max_tokens: 4096,
      temperature: 0.2,
      top_p: 1.0,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || '';
}
