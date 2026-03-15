import { GoogleGenAI, Modality } from "@google/genai";
import { AIProvider } from "./aiProvider";

export class GeminiProvider implements AIProvider {
  private ai: any;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateImage(prompt: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return "";
  }

  async generateAudio(text: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read this news synthesis in a professional, authoritative broadcast voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return "";
    
    // Gemini TTS returns raw PCM 16-bit 24kHz. We need to add a WAV header for browser playback.
    const wavBase64 = this.addWavHeader(base64Audio);
    return `data:audio/wav;base64,${wavBase64}`;
  }

  private addWavHeader(base64Pcm: string): string {
    const binaryString = atob(base64Pcm);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    // RIFF identifier
    view.setUint8(0, 'R'.charCodeAt(0));
    view.setUint8(1, 'I'.charCodeAt(0));
    view.setUint8(2, 'F'.charCodeAt(0));
    view.setUint8(3, 'F'.charCodeAt(0));
    // file length
    view.setUint32(4, 36 + len, true);
    // RIFF type
    view.setUint8(8, 'W'.charCodeAt(0));
    view.setUint8(9, 'A'.charCodeAt(0));
    view.setUint8(10, 'V'.charCodeAt(0));
    view.setUint8(11, 'E'.charCodeAt(0));
    // format chunk identifier
    view.setUint8(12, 'f'.charCodeAt(0));
    view.setUint8(13, 'm'.charCodeAt(0));
    view.setUint8(14, 't'.charCodeAt(0));
    view.setUint8(15, ' '.charCodeAt(0));
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (PCM)
    view.setUint16(20, 1, true);
    // channel count (Mono)
    view.setUint16(22, 1, true);
    // sample rate (24kHz)
    view.setUint32(24, 24000, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, 24000 * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    view.setUint8(36, 'd'.charCodeAt(0));
    view.setUint8(37, 'a'.charCodeAt(0));
    view.setUint8(38, 't'.charCodeAt(0));
    view.setUint8(39, 'a'.charCodeAt(0));
    // data chunk length
    view.setUint32(40, len, true);

    const wavBytes = new Uint8Array(44 + len);
    wavBytes.set(new Uint8Array(header), 0);
    wavBytes.set(bytes, 44);

    let binary = '';
    const chunkLen = wavBytes.byteLength;
    for (let i = 0; i < chunkLen; i++) {
      binary += String.fromCharCode(wavBytes[i]);
    }
    return btoa(binary);
  }

  async generateBrief(rawText: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Turn the following raw news text into a clean 300-word brief. Focus on the core events, key figures, and primary claims. Do not add any bias yet.
      
      TEXT:
      ${rawText}`,
    });
    return response.text || "";
  }

  async analyzeSentinel(brief: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `AGENT: The Sentinel (Right-leaning)
      INSTRUCTION: Focus on individual liberty, free-market impact, and government overreach. Use a skeptical, rigorous tone.
      CONSTRAINT: Do not use inflammatory slurs; use intellectual conservative framing (e.g., "bureaucratic friction" instead of "government failure").
      SOURCE BRIEF:
      ${brief}`,
    });
    return response.text || "";
  }

  async analyzeAdvocate(brief: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `AGENT: The Advocate (Left-leaning)
      INSTRUCTION: Focus on systemic equity, labor rights, and corporate accountability. Use an empathetic, reform-oriented tone.
      CONSTRAINT: Avoid "activist" tropes; focus on data-driven social impacts mentioned in the text.
      SOURCE BRIEF:
      ${brief}`,
    });
    return response.text || "";
  }

  async analyzeJurist(brief: string): Promise<{ content: string; score: number }> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `AGENT: The Jurist (Neutral Fact-Checker)
      INSTRUCTION: Strip away all adjectives. List only verifiable claims. Score the article's "Neutrality" from 1-10.
      CONSTRAINT: Identify "Missing Context"—what did the original author leave out?
      FORMAT: Return your response as a JSON-like structure (but in plain text) where the first line is "NEUTRALITY_SCORE: [number]" and then the list of claims.
      SOURCE BRIEF:
      ${brief}`,
    });
    const text = response.text || "";
    const scoreMatch = text.match(/NEUTRALITY_SCORE:\s*(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
    return {
      content: text.replace(/NEUTRALITY_SCORE:\s*\d+/, "").trim(),
      score
    };
  }

  async synthesize(sentinel: string, advocate: string, jurist: string): Promise<{ content: string; meter: number }> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `AGENT: The Prism Synthesis (Orchestrator)
      INSTRUCTION: Review the outputs of The Sentinel, The Advocate, and The Jurist. 
      TASK:
      1. Identify the "Shared Reality" (facts all three agree on).
      2. Generate a "Polarization Meter" (%) based on how much the interpretations of Sentinel and Advocate diverge.
      3. Write a high-standard executive synthesis report in the style of The Wall Street Journal. Use clear headings, professional vocabulary, and a structured narrative.
      
      FORMAT: 
      - The first line MUST be "POLARIZATION_METER: [number]%"
      - Use Markdown for the report.
      - Use bolding for key terms.
      - Include a "### SHARED REALITY" section.
      - Include a "### DIVERGENT INTERPRETATIONS" section.
      - Include a "### FORENSIC CONCLUSION" section.
      
      SENTINEL OUTPUT:
      ${sentinel}
      
      ADVOCATE OUTPUT:
      ${advocate}
      
      JURIST OUTPUT:
      ${jurist}`,
    });
    const text = response.text || "";
    const meterMatch = text.match(/POLARIZATION_METER:\s*(\d+)%/);
    const meter = meterMatch ? parseInt(meterMatch[1]) : 50;
    return {
      content: text.replace(/POLARIZATION_METER:\s*\d+%/, "").trim(),
      meter
    };
  }
}
