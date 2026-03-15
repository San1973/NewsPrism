# Prism News 📰

Prism News is an experimental intelligence platform designed to expose the underlying structures of modern media narratives. By using a multi-agent AI system, it deconstructs news articles through different ideological lenses to isolate objective truth and highlight systemic biases.

## 🌟 Features

- **Multi-Lens Analysis**: Every article is processed by three distinct agents:
  - **The Sentinel**: Analyzes through a right-leaning, market-focused perspective.
  - **The Advocate**: Analyzes through a left-leaning, equity-focused perspective.
  - **The Jurist**: A neutral fact-checker that strips away adjectives and identifies missing context.
- **Prism Synthesis**: A final "Orchestrator" agent cross-references all outputs to find the "Shared Reality" and calculates a **Polarization Index**.
- **Multimodal Immersive Experience**: 
  - **Visual Metaphors**: Generates high-contrast editorial illustrations for each analyst's perspective using `gemini-2.5-flash-image`.
  - **Audio Briefing**: Creates a professional broadcast audio summary of the final report using `gemini-2.5-flash-preview-tts`.
- **Live Agent Activity Log**: Watch the agents work in real-time through a terminal-style console.
- **Trending News Portal**: Explore live headlines across Politics, Economy, Tech, Science, Entertainment, and Sports.
- **Editorial Aesthetic**: A premium, high-contrast UI inspired by world-class news outlets like *The Wall Street Journal*.

### 4. The Observability Layer (Transparency)
- **GCP Mirror Dashboard**: A custom UI that reflects the live state of the GCP infrastructure (Cloud Run, Secret Manager).
- **Forensic Logging**: Both the agentic activity and the system health are logged to:
    1. The in-app "Cloud Console" overlay.
    2. The browser's Developer Tools console (F12) with specific `[GCP-PROOF]` prefixes for judge verification.
- **Chrome Console Proof**: Open your browser's console (F12) to see technical metadata and deployment verification logs directly from the running container.

## 🛡️ Hallucination Prevention & Grounding

Prism News uses a **Multi-Layered Grounded Intelligence** strategy to ensure factual integrity:

1. **The Neutral Brief**: The first stage (Extraction Agent) strips all bias and adjectives to create a 300-word factual core. All subsequent agents are strictly constrained to this brief.
2. **Adversarial Fact-Checking**: The **Jurist** agent specifically looks for "Missing Context" and "Verifiable Claims," identifying gaps in the source text to prevent assumptions.
3. **Dialectical Synthesis**: The **Orchestrator** compares the Sentinel (Right) and Advocate (Left) outputs. Only facts that survive this cross-referencing are included in the **Shared Reality** section.
4. **Multimodal Grounding**: Image prompts and Audio scripts are dynamically generated from the *Neutral Brief*, ensuring visuals and sound are 100% consistent with the analyzed facts.

## ☁️ Google Cloud & Gemini Live Agent Integration

This project is built for the **Gemini Live Agent Challenge** and leverages the following:

- **Google Gemini API**:
  - `gemini-3-flash-preview`: For complex reasoning and multi-agent orchestration.
  - `gemini-2.5-flash-image`: For generating interleaved visual content.
  - `gemini-2.5-flash-preview-tts`: For creating the "Live" broadcast audio stream.
- **Google Cloud Run**: Serverless hosting for the entire application and scraping backend.
- **Vertex AI / Google GenAI SDK**: Direct integration with Google's state-of-the-art models.
- **Google Cloud Secret Manager**: Secure management of API keys and credentials.

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Motion (Framer Motion), Lucide React.
- **Backend**: Express.js (Node.js), Axios, Cheerio (for web scraping).
- **AI Engine**: Google Gemini API (`@google/genai`).
- **Infrastructure**: Google Cloud Platform.

## 🚀 Getting Started

1. **Enter a URL**: Paste any news article link into the deconstruction bar.
2. **Watch the Agents**: Monitor the Live Activity Log as the Prism Intelligence Network scrapes and processes the content.
3. **Review the Report**: Read the individual analyst reports and the final Executive Synthesis.

## 📜 License
