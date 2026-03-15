# Prism News: The Dialectical News Intelligence Network

## 🚀 Project Overview
**Prism News** is a multimodal "Live Agent" designed to combat media polarization and information overload. Instead of a standard chatbot, Prism is a **Multi-Agent Orchestration Network** that deconstructs news articles through opposing ideological lenses to isolate objective truth. It "thinks" like a creative director, weaving together text, generated illustrations, and professional audio briefings into a single, immersive editorial experience.

## 💡 The Problem
In today's media landscape, "truth" is often buried under layers of ideological framing. Users are trapped in echo chambers, and fact-checking is often seen as biased itself.

## ✨ The Solution: Dialectical Synthesis
Prism News doesn't try to be "neutral." Instead, it uses **Dialectical Synthesis**:
1. **The Sentinel (Right)** and **The Advocate (Left)** analyze the same story simultaneously.
2. **The Jurist (Neutral)** performs forensic fact-checking.
3. **The Orchestrator** cross-references these perspectives to find the **"Shared Reality"**—the facts that survive the friction of opposing biases.

## 🛠️ Multimodal "Live Agent" Features
Prism News meets the **Gemini Live Agent Challenge** requirements through a fluid, interleaved output stream:
- **Visual Metaphors**: Using `gemini-2.5-flash-image`, the agent generates high-contrast editorial illustrations for each analyst's perspective, providing a visual anchor for the ideological lens.
- **Audio Briefing**: Using `gemini-2.5-flash-preview-tts`, the agent creates a professional broadcast audio summary of the final synthesis, transforming a static report into an immersive "live" news event.
- **Live Activity Log**: A terminal-style console that reveals the agent's "inner monologue" as it scrapes, neutralizes, and synthesizes information in real-time.
- **Behind-the-Scenes GCP Console**: A dedicated "Cloud Console" overlay that provides real-time transparency into the application's infrastructure. It displays live system logs, Cloud Run service status, compute resource allocation, and security metadata (Secret Manager integration), serving as an interactive proof-of-deployment for judges.

## 🛡️ Hallucination Prevention & Grounding
Prism News uses a **"Source-to-Brief" Bottleneck**:
- All agents are strictly constrained to a **Neutral Brief** extracted from the source URL.
- The **Jurist** agent acts as an adversarial layer, identifying "Missing Context" and "Verifiable Claims."
- The **Orchestrator** only promotes facts to the "Shared Reality" section if they are independently verified or agreed upon by opposing agents.

## ☁️ Google Cloud Integration
- **Google Gemini API**: Orchestrating `gemini-3-flash`, `gemini-2.5-flash-image`, and `gemini-2.5-flash-preview-tts`.
- **Google Cloud Run**: Serverless hosting for the scraping backend and frontend.
- **Google Cloud Secret Manager**: Secure handling of API keys.
- **Vertex AI / Google GenAI SDK**: Powering the core intelligence pipeline.

## 🎯 Target Categories
- **Best of Creative Storytellers**: For its seamless weaving of text, image, and audio into a professional news narrative.
- **Best Technical Execution & Agent Architecture**: For its sophisticated multi-agent dialectical framework and grounding mechanisms.
- **Best Multimodal Integration & User Experience**: For its premium editorial UI and transparent "Live Agent" activity log.
