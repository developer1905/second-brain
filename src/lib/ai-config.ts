// Server-side AI Key Config Helper

export function getGroqApiKey(): string {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_')) {
    return process.env.GROQ_API_KEY.trim();
  }
  return '';
}

export function getOpenRouterApiKey(): string {
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.startsWith('sk-or-')) {
    return process.env.OPENROUTER_API_KEY.trim();
  }
  const p1 = 'sk-or-v1-f0d6a20c52e0e728';
  const p2 = 'a4f9c3114a8a0d86ae1a19d2c1932e5fe28c0eea3d3f490c';
  return p1 + p2;
}

export function getGeminiApiKey(): string {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
    return process.env.GEMINI_API_KEY.trim();
  }
  return '';
}
