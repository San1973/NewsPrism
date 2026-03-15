/**
 * AI Provider Interface
 * This abstraction allows swapping between different LLM providers (Gemini, Amazon Nova, etc.)
 */

export interface AnalystOutput {
  content: string;
  score?: number;
  meter?: number;
  imageUrl?: string;
}

export interface AIProvider {
  generateBrief(rawText: string): Promise<string>;
  analyzeSentinel(brief: string): Promise<string>;
  analyzeAdvocate(brief: string): Promise<string>;
  analyzeJurist(brief: string): Promise<{ content: string; score: number }>;
  synthesize(sentinel: string, advocate: string, jurist: string): Promise<{ content: string; meter: number }>;
  generateImage(prompt: string): Promise<string>;
  generateAudio(text: string): Promise<string>;
}
