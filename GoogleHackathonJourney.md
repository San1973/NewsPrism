# Building NewsPrism: Redefining News with Google Gemini and Google Cloud

*This piece of content was created for the purposes of entering the Google AI Studio Build Hackathon.*

In an era of deep polarization and "echo chambers," understanding the full story behind a headline is harder than ever. That’s why we built **NewsPrism**—an AI-powered news analysis platform designed to break down complex narratives into multiple, distinct perspectives. 

In this post, we’ll dive into how we leveraged **Google’s cutting-edge AI models** and **Google Cloud** to build a real-time, multimodal experience that turns static news into a dynamic debate.

---

### The Vision: Beyond the Headline
NewsPrism doesn't just summarize an article; it analyzes it through the eyes of different personas:
- **Elias Thorne**: The data-driven skeptic.
- **Marcus Vane**: The pragmatic realist.
- **Sarah Jenkins**: The empathetic humanist.

By presenting these conflicting viewpoints, we empower users to form their own conclusions rather than being fed a single narrative.

### The Engine: Google Gemini & Multimodal Live API
The heart of NewsPrism is **Google Gemini**. We utilized a multi-model approach to balance speed and depth:

1.  **Deep Analysis with Gemini 3.1 Pro**: When a user submits a URL, we use Gemini 3.1 Pro to perform a comprehensive analysis of the text. It identifies core arguments, detects bias, and generates the detailed "perspectives" for our AI agents.
2.  **Real-Time Interaction with Gemini Multimodal Live API**: This is the "magic" of the project. In our **Live Debate** mode, we use the Gemini Live API to facilitate a real-time, voice-enabled discussion between our agents. 
    -   **Low Latency**: The Live API allows for near-instantaneous voice responses.
    -   **Multimodal Input**: Users can interrupt the debate using their own voice, acting as the "Jury" to guide the conversation.
    -   **Turn-Taking Logic**: We implemented custom system instructions to ensure agents respect a structured debate format, calling on each other and waiting for user input.

### The Infrastructure: Google Cloud
To ensure NewsPrism is production-ready and scalable, we turned to **Google Cloud**:

-   **Cloud Run**: The entire application is containerized and deployed on Google Cloud Run. This allows us to scale automatically based on traffic while keeping latency low for our global users.
-   **Security & Environment Management**: Using Google Cloud’s secret management, we securely handle API keys for Gemini and other services, ensuring that our integration is both powerful and safe.

### Building the Experience: React & Tailwind CSS
On the frontend, we wanted a "Technical Dashboard" aesthetic—precise, clean, and information-dense.
-   **Tailwind CSS**: Used for the sleek, dark-mode interface and responsive layouts.
-   **Framer Motion**: Powering the smooth transitions and the "Speaking" animations for our AI agents.
-   **Web Audio API**: We built a custom audio queueing system to handle the streaming PCM data from Gemini, ensuring gapless, glitch-free playback during the live sessions.

### Conclusion: The Future of Informed Citizens
NewsPrism is more than just a tool; it’s an experiment in using AI to promote critical thinking. By combining the reasoning power of **Gemini 3.1 Pro** with the immersive capabilities of the **Multimodal Live API**, we’ve created a platform that doesn't just tell you the news—it talks it through with you.

We are incredibly excited to showcase this project for the **Google AI Studio Build Hackathon** and look forward to seeing how these tools continue to evolve.

---

**Try NewsPrism today and see the news from every angle.**
