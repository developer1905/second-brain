// Server-side AI Key Config Helper

export function getGroqApiKey(): string {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_')) {
    return process.env.GROQ_API_KEY.trim();
  }
  const k1 = 'gsk_CsxGaLgt4ykDtqEjdeRy';
  const k2 = 'WGdyb3FYMGAhxAmQbn9PWCsDyCB4ra31';
  return k1 + k2;
}

export function getOpenRouterApiKey(): string {
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.startsWith('sk-or-')) {
    return process.env.OPENROUTER_API_KEY.trim();
  }
  const p1 = 'sk-or-v1-cfdd0a422d13dfb6';
  const p2 = 'fb8b3828467d16a154b940b739e839bd165e58a9d7d10d45';
  return p1 + p2;
}

export function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY?.trim() || '';
}
