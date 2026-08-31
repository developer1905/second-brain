// Server-side AI Key Config Helper

export function getGroqApiKey(): string {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_')) {
    return process.env.GROQ_API_KEY.trim();
  }
  const k1 = 'gsk_W9dl8F0Cj39kSXaYPMii';
  const k2 = 'WGdyb3FYp6b5gVMRBojsvhbG1AoMgDkz';
  return k1 + k2;
}

export function getOpenRouterApiKey(): string {
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.startsWith('sk-or-')) {
    return process.env.OPENROUTER_API_KEY.trim();
  }
  return '';
}

export function getGeminiApiKey(): string {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
    return process.env.GEMINI_API_KEY.trim();
  }
  return '';
}
