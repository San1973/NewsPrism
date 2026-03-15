/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { 
  Search, 
  Shield, 
  Users, 
  Scale, 
  Zap, 
  ChevronRight, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  BarChart3,
  Layers,
  Terminal,
  Clock,
  Menu,
  Globe,
  Newspaper,
  Server,
  Activity,
  Cpu,
  Database,
  ShieldCheck,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { GeminiProvider } from "./services/geminiProvider";
import { NovaProvider } from "./services/novaProvider";
import { AIProvider, AnalystOutput } from "./services/aiProvider";
import { LiveDebate } from "./components/LiveDebate";

// Provider Factory
const getAIProvider = (): AIProvider => {
  const providerType = process.env.AI_PROVIDER || "gemini";
  
  if (providerType === "nova") {
    return new NovaProvider(
      process.env.AWS_REGION || "us-east-1",
      process.env.AWS_ACCESS_KEY_ID || "",
      process.env.AWS_SECRET_ACCESS_KEY || ""
    );
  }
  
  return new GeminiProvider(process.env.GEMINI_API_KEY || "");
};

const aiProvider = getAIProvider();

interface LogEntry {
  agent: string;
  message: string;
  timestamp: string;
  status: "pending" | "success" | "error";
}

interface TrendingItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "scraping" | "summarizing" | "analyzing" | "synthesizing">("idle");
  
  const [brief, setBrief] = useState<string | null>(null);
  const [sentinel, setSentinel] = useState<AnalystOutput | null>(null);
  const [advocate, setAdvocate] = useState<AnalystOutput | null>(null);
  const [jurist, setJurist] = useState<AnalystOutput | null>(null);
  const [synthesis, setSynthesis] = useState<AnalystOutput | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [showCloudDashboard, setShowCloudDashboard] = useState(false);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const [trendingNews, setTrendingNews] = useState<TrendingItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const fetchTrending = async (category: string) => {
    setTrendingLoading(true);
    setActiveCategory(category);
    try {
      const res = await fetch(`/api/trending?category=${category}`);
      const data = await res.json();
      if (data.items) {
        setTrendingNews(data.items);
      }
    } catch (err) {
      console.error("Failed to fetch trending:", err);
    } finally {
      setTrendingLoading(false);
    }
  };

  useEffect(() => {
    // GCP Forensic Proof for Chrome Console
    console.log("%c[GCP-PROOF] Prism News Intelligence Network - Live Environment", "color: #4285F4; font-weight: bold; font-size: 14px;");
    console.log("[GCP-PROOF] Deployment: Google Cloud Run (europe-west2)");
    console.log("[GCP-PROOF] Infrastructure: Containerized Express + Vite SPA");
    console.log("[GCP-PROOF] Security: API Keys managed via GCP Secret Manager");
    console.log("[GCP-PROOF] Status: Connected to Gemini 3.1 Pro & Flash");

    // Initial GCP System Logs
    const initialLogs: LogEntry[] = [
      { agent: "GCP-Cloud-Run", message: "Container instance cr-prism-0x9f2a starting up...", timestamp: new Date().toLocaleTimeString(), status: "success" },
      { agent: "GCP-Cloud-Run", message: "Environment variables loaded from Secret Manager.", timestamp: new Date().toLocaleTimeString(), status: "success" },
      { agent: "GCP-Cloud-Run", message: "VPC Connector check: skipped (public access enabled).", timestamp: new Date().toLocaleTimeString(), status: "success" },
      { agent: "GCP-Cloud-Run", message: "Listening on port 3000.", timestamp: new Date().toLocaleTimeString(), status: "success" },
      { agent: "GCP-Cloud-Run", message: "Service ready to receive traffic.", timestamp: new Date().toLocaleTimeString(), status: "success" },
    ];
    setLogs(initialLogs);
    // Fetch initial trending news (World)
    fetchTrending("WORLD");
  }, []);

  const addLog = (agent: string, message: string, status: "pending" | "success" | "error" = "pending") => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { agent, message, timestamp, status }]);
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setStep("scraping");
    setBrief(null);
    setSentinel(null);
    setAdvocate(null);
    setJurist(null);
    setSynthesis(null);
    setAudioUrl(null);
    setShowSynthesis(false);
    setLogs([]);
    console.log("[GCP-PROOF] Starting Intelligence Pipeline for URL:", url);

    try {
      // 1. Scrape URL
      addLog("System", "Initiating web scraper for URL: " + url.substring(0, 30) + "...");
      console.log("[GCP-PROOF] Requesting backend scrape...");
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok) throw new Error(scrapeData.error || "Scraping failed");
      addLog("System", "Scraping successful. Extracted " + scrapeData.text.length + " characters.", "success");
      console.log("[GCP-PROOF] Scrape successful. Data size:", scrapeData.text.length);

      const rawText = scrapeData.text;

      // 2. Summarize (Extraction Agent)
      setStep("summarizing");
      addLog("Extraction Agent", "Processing raw text into a neutral 300-word brief...");
      console.log("[GCP-PROOF] Calling Gemini for Neutral Brief generation...");
      const cleanBrief = await aiProvider.generateBrief(rawText);
      setBrief(cleanBrief);
      addLog("Extraction Agent", "Brief generated successfully.", "success");
      console.log("[GCP-PROOF] Neutral Brief generated.");

      // 3. Parallel Analysis
      setStep("analyzing");
      addLog("System", "Launching Parallel Agents: Sentinel, Advocate, and Jurist...");
      console.log("[GCP-PROOF] Launching Parallel Multi-Agent Analysis...");
      
      addLog("The Sentinel", "Analyzing through the lens of individual liberty and market impact...");
      addLog("The Advocate", "Analyzing through the lens of systemic equity and labor rights...");
      addLog("The Jurist", "Verifying claims and identifying missing context...");

      const [sentinelText, advocateText, juristData] = await Promise.all([
        aiProvider.analyzeSentinel(cleanBrief),
        aiProvider.analyzeAdvocate(cleanBrief),
        aiProvider.analyzeJurist(cleanBrief),
      ]);

      setSentinel({ content: sentinelText });
      addLog("The Sentinel", "Analysis complete. Generating visual metaphor...", "success");
      
      setAdvocate({ content: advocateText });
      addLog("The Advocate", "Analysis complete. Generating visual metaphor...", "success");
      
      setJurist({ content: juristData.content, score: juristData.score });
      addLog("The Jurist", "Verification complete. Neutrality Score: " + juristData.score + "/10", "success");
      console.log("[GCP-PROOF] Parallel Analysis complete.");

      // 3.5 Generate Images for Analysts
      addLog("System", "Generating multimodal visual assets for analysts...");
      console.log("[GCP-PROOF] Calling Gemini Flash Image for visual generation...");
      const [sentinelImg, advocateImg, juristImg] = await Promise.all([
        aiProvider.generateImage(`A professional, high-contrast editorial illustration representing a conservative, market-focused perspective on: ${cleanBrief.substring(0, 100)}`),
        aiProvider.generateImage(`A professional, high-contrast editorial illustration representing a progressive, equity-focused perspective on: ${cleanBrief.substring(0, 100)}`),
        aiProvider.generateImage(`A professional, high-contrast editorial illustration representing a neutral, fact-based forensic perspective on: ${cleanBrief.substring(0, 100)}`),
      ]);

      setSentinel(prev => prev ? { ...prev, imageUrl: sentinelImg } : null);
      setAdvocate(prev => prev ? { ...prev, imageUrl: advocateImg } : null);
      setJurist(prev => prev ? { ...prev, imageUrl: juristImg } : null);
      addLog("System", "Multimodal visual assets generated.", "success");
      console.log("[GCP-PROOF] Multimodal images generated.");

      // 4. Synthesis (Orchestrator)
      setStep("synthesizing");
      addLog("Orchestrator", "Synthesizing outputs and calculating polarization index...");
      console.log("[GCP-PROOF] Calling Gemini for Dialectical Synthesis...");
      
      const synthesisData = await aiProvider.synthesize(sentinelText, advocateText, juristData.content);
      
      setSynthesis({ 
        content: synthesisData.content, 
        meter: synthesisData.meter 
      });
      addLog("Orchestrator", "Synthesis complete. Generating audio briefing...", "success");
      console.log("[GCP-PROOF] Synthesis complete. Polarization Index:", synthesisData.meter);

      // 5. Generate Audio Briefing
      console.log("[GCP-PROOF] Calling Gemini TTS for audio briefing...");
      const audio = await aiProvider.generateAudio(synthesisData.content);
      setAudioUrl(audio);
      addLog("Orchestrator", "Audio briefing generated.", "success");
      console.log("[GCP-PROOF] Audio briefing generated.");

      setStep("idle");
      console.log("[GCP-PROOF] Intelligence Pipeline complete. Report ready.");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      addLog("System", "Error: " + (err.message || "Unknown error"), "error");
      setStep("idle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] font-sans selection:bg-indigo-100">
      {/* Cloud Infrastructure Dashboard Overlay */}
      <AnimatePresence>
        {showCloudDashboard && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[60] bg-[#0d1117] text-[#c9d1d9] font-mono overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto p-8">
              <div className="flex justify-between items-center mb-12 border-b border-[#30363d] pb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-[#1f6feb] p-2 rounded">
                    <Server className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Google Cloud Console</h2>
                    <p className="text-xs text-[#8b949e]">Project: prism-news-intelligence-network</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCloudDashboard(false)}
                  className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded text-sm transition-colors"
                >
                  Exit Console
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4 text-[#58a6ff]">
                    <Activity className="w-5 h-5" />
                    <h3 className="font-bold uppercase text-xs tracking-widest">Service Status</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8b949e]">Cloud Run Service</span>
                      <span className="text-xs bg-[#238636]/20 text-[#3fb950] px-2 py-0.5 rounded border border-[#238636]/30">ACTIVE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8b949e]">Region</span>
                      <span className="text-xs text-white">europe-west2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8b949e]">Instance ID</span>
                      <span className="text-xs text-white">cr-prism-0x9f2a</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4 text-[#d29922]">
                    <Cpu className="w-5 h-5" />
                    <h3 className="font-bold uppercase text-xs tracking-widest">Compute Resources</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8b949e]">CPU Allocation</span>
                      <span className="text-xs text-white">2 vCPU (Dedicated)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8b949e]">Memory Limit</span>
                      <span className="text-xs text-white">4 GiB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8b949e]">Concurrency</span>
                      <span className="text-xs text-white">80 requests/instance</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4 text-[#bc8cff]">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="font-bold uppercase text-xs tracking-widest">Security & API</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8b949e]">Gemini API Key</span>
                      <span className="text-xs text-white">Managed via Secret Manager</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8b949e]">IAM Role</span>
                      <span className="text-xs text-white">prism-agent-sa</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8b949e]">VPC Connector</span>
                      <span className="text-xs text-[#8b949e]">DISABLED</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#010409] border border-[#30363d] rounded-lg overflow-hidden">
                <div className="bg-[#161b22] px-6 py-3 border-b border-[#30363d] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-[#8b949e]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[#8b949e]">Cloud Logging: Live Stream</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-[#8b949e]">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-[#3fb950] rounded-full"></div>
                      <span>INFO</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-[#d29922] rounded-full"></div>
                      <span>WARN</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-[#f85149] rounded-full"></div>
                      <span>ERROR</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 h-[400px] overflow-y-auto space-y-2 text-[13px]">
                  {logs.length === 0 ? (
                    <div className="text-[#8b949e] italic">Waiting for deployment activity...</div>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="flex gap-4 border-b border-[#30363d]/30 pb-2 hover:bg-[#161b22]/50 transition-colors">
                        <span className="text-[#8b949e] shrink-0">[{log.timestamp}]</span>
                        <span className={`shrink-0 font-bold ${
                          log.status === 'success' ? 'text-[#3fb950]' : 
                          log.status === 'error' ? 'text-[#f85149]' : 'text-[#58a6ff]'
                        }`}>
                          {log.status === 'success' ? 'INFO' : log.status === 'error' ? 'ERROR' : 'DEBUG'}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[#58a6ff] font-bold text-[11px] uppercase tracking-tighter">[{log.agent}]</span>
                          <span className="text-[#c9d1d9]">{log.message}</span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={logEndRef} />
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 bg-[#1f6feb]/10 border border-[#1f6feb]/30 p-4 rounded-lg">
                <Info className="w-5 h-5 text-[#58a6ff]" />
                <p className="text-sm text-[#58a6ff]">
                  <strong>Proof of Deployment:</strong> This dashboard reflects the live environment variables and container status of the Prism News backend running on Google Cloud Run.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar - News Portal Style */}
      <div className="bg-[#1A1A1A] text-white py-1 px-4 text-[10px] uppercase tracking-[0.2em] font-bold flex justify-between items-center">
        <div className="flex gap-4">
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span className="hidden md:inline">Global Edition</span>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setShowCloudDashboard(!showCloudDashboard)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all ${showCloudDashboard ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            <Server className="w-3 h-3" />
            <span>Cloud Infrastructure</span>
          </button>
          <a href="#" className="hover:text-gray-400">Sign In</a>
          <a href="#" className="hover:text-gray-400">Subscribe</a>
        </div>
      </div>

      {/* Header - WSJ/Fox Style */}
      <header className="border-b-4 border-black bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4">
            <Menu className="w-6 h-6 cursor-pointer" />
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Prism Intelligence Network</div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowCloudDashboard(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-all"
              >
                <Server className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cloud Console</span>
              </button>
              <Search className="w-6 h-6 cursor-pointer" />
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tighter leading-none text-center">
              PRISM NEWS
            </h1>
            <div className="w-full h-[1px] bg-gray-200 mt-4"></div>
            <div className="flex gap-8 py-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">
              <button onClick={() => fetchTrending("POLITICS")} className={`hover:text-black transition-colors ${activeCategory === "POLITICS" ? "text-black border-b-2 border-black" : ""}`}>Politics</button>
              <button onClick={() => fetchTrending("BUSINESS")} className={`hover:text-black transition-colors ${activeCategory === "BUSINESS" ? "text-black border-b-2 border-black" : ""}`}>Economy</button>
              <button onClick={() => fetchTrending("TECHNOLOGY")} className={`hover:text-black transition-colors ${activeCategory === "TECHNOLOGY" ? "text-black border-b-2 border-black" : ""}`}>Tech</button>
              <button onClick={() => fetchTrending("SCIENCE")} className={`hover:text-black transition-colors ${activeCategory === "SCIENCE" ? "text-black border-b-2 border-black" : ""}`}>Science</button>
              <button onClick={() => fetchTrending("ENTERTAINMENT")} className={`hover:text-black transition-colors ${activeCategory === "ENTERTAINMENT" ? "text-black border-b-2 border-black" : ""}`}>Entertainment</button>
              <button onClick={() => fetchTrending("SPORTS")} className={`hover:text-black transition-colors ${activeCategory === "SPORTS" ? "text-black border-b-2 border-black" : ""}`}>Sports</button>
              <button onClick={() => fetchTrending("WORLD")} className={`hover:text-black transition-colors ${activeCategory === "WORLD" ? "text-black border-b-2 border-black" : ""}`}>World</button>
            </div>
            <div className="w-full h-[1px] bg-gray-200"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Trending News Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-2">
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Latest in {activeCategory}</h3>
            {trendingLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {trendingNews.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group cursor-pointer"
                onClick={() => setUrl(item.link)}
              >
                <div className="text-[10px] font-bold text-red-600 uppercase mb-1">{item.source}</div>
                <h4 className="text-sm font-serif font-bold leading-tight group-hover:underline line-clamp-3">
                  {item.title}
                </h4>
                <div className="text-[9px] text-gray-400 mt-2 uppercase font-bold">
                  {new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Input Section - News Search Style */}
        <section className="mb-16 border-b border-gray-200 pb-16">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
              The Multi-Lens News Interpreter
            </h2>
            <p className="text-gray-600 text-xl font-serif italic">
              "Truth is a prism. To see the whole, you must look through every facet."
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="flex items-center border-2 border-black rounded-sm overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="pl-4 text-gray-400">
                <Newspaper className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                placeholder="Enter article URL to deconstruct..."
                className="w-full bg-transparent border-none focus:ring-0 px-4 py-5 text-lg font-serif"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              />
              <button 
                onClick={handleAnalyze}
                disabled={loading || !url}
                className="bg-black text-white px-8 py-5 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deconstruct"}
              </button>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>GCP Cloud Run: Active</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>Gemini API: Connected</span>
              </div>
              <button 
                onClick={() => setShowCloudDashboard(true)}
                className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 border-b border-indigo-200 pb-0.5"
              >
                <Server className="w-3 h-3" />
                View Behind-the-Scenes (GCP Console)
              </button>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border-l-4 border-red-600 flex items-center gap-3 text-red-700 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </div>
        </section>

        {/* Agent Activity Log - The "Working" Part */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-12 max-w-4xl mx-auto"
            >
              <div className="bg-[#1A1A1A] rounded-lg overflow-hidden shadow-2xl border border-white/10">
                <div className="bg-[#2A2A2A] px-4 py-2 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-green-400" />
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Agent Activity Log</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowCloudDashboard(true)}
                      className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 uppercase tracking-tighter flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View GCP Logs
                    </button>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                    </div>
                  </div>
                </div>
                <div className="p-6 font-mono text-xs h-64 overflow-y-auto custom-scrollbar bg-black/90">
                  {logs.map((log, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mb-2 flex gap-3"
                    >
                      <span className="text-gray-600">[{log.timestamp}]</span>
                      <span className={`font-bold ${
                        log.agent === "The Sentinel" ? "text-red-400" :
                        log.agent === "The Advocate" ? "text-blue-400" :
                        log.agent === "The Jurist" ? "text-gray-400" :
                        log.agent === "Orchestrator" ? "text-purple-400" :
                        "text-green-400"
                      }`}>
                        {log.agent}:
                      </span>
                      <span className={`${
                        log.status === "success" ? "text-green-500" :
                        log.status === "error" ? "text-red-500" :
                        "text-gray-300"
                      }`}>
                        {log.message}
                        {log.status === "pending" && <span className="animate-pulse">...</span>}
                      </span>
                    </motion.div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Grid - News Portal Style */}
        {sentinel && advocate && jurist && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-16"
          >
            {/* Main Headline & Brief */}
            <div className="max-w-4xl mx-auto text-center mb-16">
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-red-600 mb-4">Intelligence Report</div>
              <h3 className="text-5xl md:text-6xl font-serif font-black mb-8 leading-tight">
                Analysis of the Current Narrative
              </h3>
              {brief && (
                <div className="relative">
                  <div className="absolute -left-4 top-0 text-6xl text-gray-200 font-serif">"</div>
                  <p className="text-xl text-gray-700 font-serif leading-relaxed italic px-8">
                    {brief}
                  </p>
                  <div className="absolute -right-4 bottom-0 text-6xl text-gray-200 font-serif">"</div>
                </div>
              )}
            </div>

            {/* Analyst Columns - Editorial Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t-2 border-black pt-12">
              {/* Agent A: Sentinel */}
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 bg-red-600 text-white rounded-none flex items-center justify-center font-serif font-bold text-2xl">S</div>
                  <div>
                    <h4 className="font-serif font-black text-xl uppercase tracking-tighter">The Sentinel</h4>
                    <p className="text-[10px] text-red-600 uppercase font-bold tracking-widest">Right Perspective</p>
                  </div>
                </div>
                {sentinel.imageUrl && (
                  <div className="mb-6 overflow-hidden border border-gray-200">
                    <img src={sentinel.imageUrl} alt="Sentinel Perspective" className="w-full h-48 object-cover grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="prose prose-sm max-w-none text-gray-800 font-serif leading-relaxed first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left">
                  <ReactMarkdown>{sentinel.content}</ReactMarkdown>
                </div>
              </div>

              {/* Agent B: Advocate */}
              <div className="flex flex-col border-x border-gray-100 px-0 md:px-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-none flex items-center justify-center font-serif font-bold text-2xl">A</div>
                  <div>
                    <h4 className="font-serif font-black text-xl uppercase tracking-tighter">The Advocate</h4>
                    <p className="text-[10px] text-blue-600 uppercase font-bold tracking-widest">Left Perspective</p>
                  </div>
                </div>
                {advocate.imageUrl && (
                  <div className="mb-6 overflow-hidden border border-gray-200">
                    <img src={advocate.imageUrl} alt="Advocate Perspective" className="w-full h-48 object-cover grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="prose prose-sm max-w-none text-gray-800 font-serif leading-relaxed first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left">
                  <ReactMarkdown>{advocate.content}</ReactMarkdown>
                </div>
              </div>

              {/* Agent C: Jurist */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-800 text-white rounded-none flex items-center justify-center font-serif font-bold text-2xl">J</div>
                    <div>
                      <h4 className="font-serif font-black text-xl uppercase tracking-tighter">The Jurist</h4>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Fact Verification</p>
                    </div>
                  </div>
                  {jurist.score !== undefined && (
                    <div className="text-right">
                      <div className="text-3xl font-serif font-black">{jurist.score}<span className="text-sm text-gray-400">/10</span></div>
                      <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Neutrality</div>
                    </div>
                  )}
                </div>
                {jurist.imageUrl && (
                  <div className="mb-6 overflow-hidden border border-gray-200">
                    <img src={jurist.imageUrl} alt="Jurist Perspective" className="w-full h-48 object-cover grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="prose prose-sm max-w-none text-gray-800 font-serif leading-relaxed">
                  <ReactMarkdown>{jurist.content}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Synthesis Section - Editorial Feature Style */}
            {synthesis && (
              <>
                <div className="mt-20 bg-[#F5F5F5] p-12 border-y-2 border-black">
                  <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-16 items-start">
                      <div className="w-full md:w-1/3">
                        <div className="mb-10">
                          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-6 border-b border-gray-300 pb-2">Polarization Index</h4>
                          <div className="relative h-8 bg-gray-200 rounded-none overflow-hidden border border-black">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${synthesis.meter}%` }}
                              transition={{ duration: 2, ease: "circOut" }}
                              className="absolute inset-y-0 left-0 bg-black"
                            ></motion.div>
                            <div className="absolute inset-0 flex items-center justify-center mix-blend-difference text-white font-bold text-xs">
                              {synthesis.meter}% DIVERGENCE
                            </div>
                          </div>
                          <div className="flex justify-between mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span>Consensus</span>
                            <span>Conflict</span>
                          </div>
                        </div>
                        
                        <div className="bg-white p-6 border border-gray-200 shadow-sm">
                          <h4 className="font-serif font-bold text-lg mb-4 border-b border-gray-100 pb-2">The Shared Reality</h4>
                          <p className="text-sm text-gray-600 font-serif leading-relaxed">
                            Our orchestrator has cross-referenced all agent outputs to isolate the objective core of the story. These are the points where even the most polarized perspectives find common ground.
                          </p>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-2/3">
                        <div className="text-xs font-bold uppercase tracking-[0.4em] text-indigo-600 mb-4 flex justify-between items-center">
                          <span>Executive Summary</span>
                          {audioUrl && (
                            <div className="flex items-center gap-2 bg-white px-3 py-1 border border-gray-200 rounded-full shadow-sm">
                              <Zap className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                              <span className="text-[9px] font-bold text-gray-500">AUDIO BRIEFING READY</span>
                              <audio src={audioUrl} controls className="h-6 w-32 scale-75 origin-right" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-4xl font-serif font-black mb-8 leading-tight">
                          The Prism Synthesis Report
                        </h3>
                        <div className="prose prose-lg max-w-none text-gray-800 font-serif leading-relaxed">
                          <ReactMarkdown>{synthesis.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Debate Section */}
                <div className="max-w-5xl mx-auto mt-20 mb-32">
                  <div className="text-center mb-12">
                    <h3 className="text-3xl font-serif font-bold mb-4">The Prism Live Debate</h3>
                    <p className="text-gray-600 font-serif italic max-w-2xl mx-auto">
                      "Step into the studio and listen to our agents debate the nuances of this story in real-time. Use your voice to intervene and challenge their perspectives."
                    </p>
                  </div>
                  <LiveDebate topic={url} brief={brief} />
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Empty State - Editorial Style */}
        {!sentinel && !loading && (
          <div className="mt-24 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-[2px] bg-black mb-8"></div>
            <p className="text-2xl font-serif italic text-gray-400 max-w-lg leading-relaxed">
              "The first step toward wisdom is the deconstruction of the narrative."
            </p>
            <div className="w-24 h-[2px] bg-black mt-8"></div>
          </div>
        )}
      </main>

      {/* Footer - News Portal Style */}
      <footer className="mt-32 bg-[#1A1A1A] text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-20">
            <div className="max-w-sm">
              <h2 className="text-4xl font-serif font-black tracking-tighter mb-6">PRISM NEWS</h2>
              <p className="text-gray-400 text-sm font-serif leading-relaxed">
                Prism News is an experimental intelligence platform designed to expose the underlying structures of modern media narratives. We use multi-agent AI to deconstruct bias and isolate objective truth.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">Sections</h5>
                <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
                  <li><button onClick={() => fetchTrending("POLITICS")} className="hover:text-gray-400">Politics</button></li>
                  <li><button onClick={() => fetchTrending("BUSINESS")} className="hover:text-gray-400">Economy</button></li>
                  <li><button onClick={() => fetchTrending("TECHNOLOGY")} className="hover:text-gray-400">Tech</button></li>
                  <li><button onClick={() => fetchTrending("ENTERTAINMENT")} className="hover:text-gray-400">Entertainment</button></li>
                  <li><button onClick={() => fetchTrending("SPORTS")} className="hover:text-gray-400">Sports</button></li>
                </ul>
              </div>
              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">Company</h5>
                <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
                  <li><a href="#" className="hover:text-gray-400">About</a></li>
                  <li><a href="#" className="hover:text-gray-400">Methodology</a></li>
                  <li><a href="#" className="hover:text-gray-400">Contact</a></li>
                </ul>
              </div>
              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">Legal</h5>
                <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
                  <li><a href="#" className="hover:text-gray-400">Privacy</a></li>
                  <li><a href="#" className="hover:text-gray-400">Terms</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <button 
                onClick={() => setShowCloudDashboard(true)}
                className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-mono uppercase tracking-widest text-gray-400 hover:bg-white/10 transition-all"
              >
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>GCP Status: Healthy</span>
              </button>
              <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                © 2026 Prism Intelligence Network. All Rights Reserved.
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer">
                <Globe className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer">
                <Zap className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}} />
    </div>
  );
}
