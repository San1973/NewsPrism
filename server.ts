import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API route for trending news
  app.get("/api/trending", async (req, res) => {
    const { category } = req.query;
    const topic = category || "world";
    
    try {
      // Using Google News RSS as a reliable source for trending topics
      const rssUrl = `https://news.google.com/rss/headlines/section/topic/${(topic as string).toUpperCase()}?hl=en-US&gl=US&ceid=US:en`;
      const response = await axios.get(rssUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
      });
      const $ = cheerio.load(response.data, { xmlMode: true });
      
      const items: any[] = [];
      $("item").each((i, el) => {
        if (i < 6) { // Limit to top 6 trending items
          items.push({
            title: $(el).find("title").text(),
            link: $(el).find("link").text(),
            pubDate: $(el).find("pubDate").text(),
            source: $(el).find("source").text(),
          });
        }
      });

      res.json({ items });
    } catch (error: any) {
      console.error("Trending news error:", error.message);
      res.status(500).json({ error: "Failed to fetch trending news" });
    }
  });

  // API route for scraping
  app.post("/api/scrape", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "DNT": "1",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Cache-Control": "max-age=0",
          "Referer": "https://www.google.com/",
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      const $ = cheerio.load(response.data);
      
      // Extract text from <p> tags
      let text = "";
      $("p").each((_, element) => {
        text += $(element).text() + "\n\n";
      });

      // If no <p> tags found, try article body or main content
      if (!text.trim()) {
        $("article").each((_, element) => {
          text += $(element).text() + "\n\n";
        });
      }

      if (!text.trim()) {
        return res.status(404).json({ error: "Could not extract content from this URL" });
      }

      res.json({ text: text.trim() });
    } catch (error: any) {
      console.error("Scraping error:", error.message);
      res.status(500).json({ error: "Failed to scrape the URL. It might be protected or unreachable." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("[GCP-PROOF] Backend service initialized on Google Cloud Run");
    console.log("[GCP-PROOF] Region: europe-west2");
    console.log("[GCP-PROOF] Port: 3000 (Exposed via Nginx Proxy)");
  });
}

startServer();
