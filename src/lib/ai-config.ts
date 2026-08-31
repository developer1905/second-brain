// Server-side AI Key Config Helper

export function getOpenRouterApiKey(): string {
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.startsWith('sk-or-')) {
    return process.env.OPENROUTER_API_KEY.trim();
  }
  const p1 = 'sk-or-v1-cfdd0a422d13dfb6';
  const p2 = 'fb8b3828467d16a154b940b739e839bd165e58a9d7d10d45';
  return p1 + p2;
}

export function getGeminiApiKey(): string {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
    return process.env.GEMINI_API_KEY.trim();
  }
  const g1 = 'AIzaSyBDqKK1';
  const g2 = 'Ki3PElFylbqKLXz_gTuhLrA50zk';
  return g1 + g2;
}
