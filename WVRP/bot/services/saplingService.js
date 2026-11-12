import dotenv from 'dotenv';
dotenv.config();

const SAPLING_API_URL = 'https://api.sapling.ai/api/v1/aidetect';

export class SaplingService {
  constructor() {
    this.apiKey = process.env.SAPLING_API_KEY || '';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async analyzeAnswers(answers = []) {
    // Combine text answers (focusing on descriptive questions 5-13)
    const textBlob = answers
      .map((a, i) => `Q${i + 1}: ${a}`)
      .join('\n\n');

    if (!this.isConfigured()) {
      return {
        configured: false,
        score: null,
        confidence: null,
        aiDetected: false,
        summary: 'Sapling API key not configured in .env. Advisory AI analysis skipped.',
        raw: null
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(SAPLING_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: this.apiKey,
          text: textBlob
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          configured: true,
          score: null,
          confidence: null,
          aiDetected: false,
          summary: `Sapling API returned error status ${res.status}. Analysis unavailable.`,
          raw: null
        };
      }

      const data = await res.json();
      const score = typeof data.score === 'number' ? Math.round(data.score * 100) : 0;
      const aiDetected = score > 65;

      return {
        configured: true,
        score,
        confidence: data.score,
        aiDetected,
        summary: aiDetected
          ? `⚠️ Elevated AI-writing indicators detected (${score}% probability). Review carefully for copied text.`
          : `✅ Human writing indicators consistent (${score}% AI probability).`,
        raw: data
      };
    } catch (err) {
      return {
        configured: true,
        score: null,
        confidence: null,
        aiDetected: false,
        summary: `Sapling connection timeout/error: ${err.message}.`,
        raw: null
      };
    }
  }
}

export const saplingService = new SaplingService();
export default saplingService;
