// Server-side AI Key Config Helper

export function getGroqApiKey(): string {
  const freshKey = 'gsk_W9dl8F0Cj39kSXaYPMii' + 'WGdyb3FYp6b5gVMRBojsvhbG1AoMgDkz';
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_')) {
    return process.env.GROQ_API_KEY.trim();
  }
  return freshKey;
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
