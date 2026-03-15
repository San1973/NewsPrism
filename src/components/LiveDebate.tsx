import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Play, Square, Volume2, Users, MessageSquare, Radio, Shield, AlertCircle, Loader2, FileText } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

interface LiveDebateProps {
  topic: string;
  brief: string;
}

export const LiveDebate: React.FC<LiveDebateProps> = ({ topic, brief }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [transcription, setTranscription] = useState<{ role: string; text: string }[]>([]);
  const [activeAgent, setActiveAgent] = useState<'ADVOCATE' | 'SENTINEL' | 'JURIST' | null>(null);
  const [audioContextState, setAudioContextState] = useState<AudioContextState>('suspended');
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const stopSession = () => {
    if (sessionRef.current) {
      // Handle both promise and resolved session object
      const session = sessionRef.current;
      if (session instanceof Promise) {
        session.then(s => {
          if (s && typeof s.close === 'function') s.close();
        }).catch(err => console.error("Error closing session promise:", err));
      } else if (session && typeof session.close === 'function') {
        session.close();
      }
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    nextStartTimeRef.current = 0;
    setIsConnected(false);
    setIsMicrophoneActive(false);
    setMicPermissionDenied(false);
    setActiveAgent(null);
  };

  const testAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    const osc = audioContextRef.current.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
    osc.connect(audioContextRef.current.destination);
    osc.start();
    osc.stop(audioContextRef.current.currentTime + 0.1);
    console.log("[GCP-PROOF] Test audio beep triggered");
  };

  const jumpstartDebate = () => {
    if (sessionRef.current) {
      console.log("[GCP-PROOF] Sending jumpstart signal...");
      const silence = new Int16Array(16000).fill(0);
      const base64 = btoa(String.fromCharCode(...new Uint8Array(silence.buffer)));
      
      const sendInput = (s: any) => {
        if (s && typeof s.sendRealtimeInput === 'function') {
          s.sendRealtimeInput({
            media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      };

      if (sessionRef.current instanceof Promise) {
        sessionRef.current.then(sendInput).catch(err => console.error("Error sending jumpstart via promise:", err));
      } else {
        sendInput(sessionRef.current);
      }
    }
  };

  const startSession = async () => {
    console.log("[GCP-PROOF] Attempting to start Live Debate session...");
    setIsConnecting(true);
    
    // Initialize AudioContext on user gesture
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current.onstatechange = () => {
        setAudioContextState(audioContextRef.current?.state || 'suspended');
      };
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    setAudioContextState(audioContextRef.current.state);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing in the environment.");
      }
      
      console.log("[GCP-PROOF] Initializing GoogleGenAI with API Key (length:", apiKey.length, ")...");
      const ai = new GoogleGenAI({ apiKey });
      
      const modelName = "gemini-2.5-flash-native-audio-preview-09-2025";
      console.log("[GCP-PROOF] Connecting to Live API with model:", modelName);
      
      const sessionPromise = ai.live.connect({
        model: modelName,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction: `
            You are a real-time news debate panel for the Prism Intelligence Network. 
            You manage three distinct human-like personas and must create a seamless, dynamic debate.
            Since you are using a single voice, you MUST use your acting skills to change your tone, pitch, and delivery style for each persona:
            
            1. [ADVOCATE] (Left-Leaning): Progressive, empathetic, focuses on social equity. Tone: Warm, passionate, uses conversational fillers like "Look," or "I really feel...". 
            2. [SENTINEL] (Right-Leaning): Conservative, skeptical, focuses on individual liberty and tradition. Tone: Measured, authoritative, uses phrases like "Wait a minute," or "Let's be realistic here...".
            3. [JURIST] (Neutral Moderator): The ultimate fact-checker. Calm, objective. Tone: Steady, professional. MANDATE: You MUST interrupt to verify facts or call out logical fallacies immediately when they occur.
            
            THE DEBATE TOPIC: ${topic}
            THE FACTUAL BRIEF: ${brief}
            
            URGENT: START THE DEBATE IMMEDIATELY.
            
            DEBATE FLOW RULES:
            - SEAMLESS INTERACTION: Agents must directly respond to the previous speaker's points. Use phrases like "I hear you, Advocate, but..." or "Sentinel makes a fair point about...".
            - PASS THE MIC: Every turn MUST end by inviting another agent (or the user) to respond. E.g., "Advocate, how do you reconcile that with the data?" or "What's your take on this, [User Name]?"
            - HUMAN-LIKE SPEECH: Use natural pauses, slight hesitations, and varied sentence lengths. Avoid sounding like a list of bullet points.
            - JURIST VERIFICATION: The JURIST must act as the "Source of Truth." If an agent makes a bold claim, the JURIST should say "Let's look at the facts provided in the brief..."
            - IDENTIFICATION: You MUST start every turn with [ADVOCATE], [SENTINEL], or [JURIST].
            - USER INVOLVEMENT: Treat the user as a fourth panelist. Ask them direct questions and wait for their input.
          `,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            console.log("[GCP-PROOF] Live Debate Session Opened Successfully");
            
            // Send a bit of audio energy (white noise) to wake up the model
            // Some environments need more than just silence to trigger the VAD
            // We use a slightly more aggressive trigger here
            setTimeout(() => {
              sessionPromise.then((session: any) => {
                console.log("[GCP-PROOF] Sending wake-up signal...");
                // Create a small burst of low-level noise
                const buffer = new Int16Array(16000);
                for (let i = 0; i < buffer.length; i++) {
                  // Slightly louder noise to ensure VAD trigger
                  buffer[i] = (Math.random() * 2 - 1) * 300; 
                }
                const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer.buffer)));
                session.sendRealtimeInput({
                  media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                });
              }).catch(err => console.error("[GCP-PROOF] Wake-up signal failed:", err));
            }, 1000);
            
            console.log("[GCP-PROOF] Waiting for agents to begin the broadcast...");
          },
          onmessage: async (message: LiveServerMessage) => {
            // Log a summary instead of full JSON to avoid potential issues with large messages
            const msgType = message.serverContent ? (message.serverContent.modelTurn ? 'modelTurn' : (message.serverContent.turnComplete ? 'turnComplete' : 'other')) : 'system';
            console.log(`[GCP-PROOF] Live API Message Received: type=${msgType}`);
            
            // Handle Turn Complete
            if (message.serverContent?.turnComplete) {
              console.log("[GCP-PROOF] Turn Complete");
              // We don't clear activeAgent immediately as audio might still be playing
            }

            // Handle Model Turn
            if (message.serverContent?.modelTurn) {
              const parts = message.serverContent.modelTurn.parts;
              
              // 1. Handle Audio Data
              const audioPart = parts.find(p => p.inlineData);
              if (audioPart?.inlineData?.data) {
                console.log("[GCP-PROOF] Audio data received from model");
                playAudioChunk(audioPart.inlineData.data);
              }

              // 2. Handle Transcription/Text
              const textPart = parts.find(p => p.text);
              if (textPart?.text) {
                const text = textPart.text.toUpperCase();
                console.log("[GCP-PROOF] Agent Text:", text);
                
                if (text.includes("ADVOCATE")) setActiveAgent('ADVOCATE');
                else if (text.includes("SENTINEL")) setActiveAgent('SENTINEL');
                else if (text.includes("JURIST")) setActiveAgent('JURIST');
                else if (text.includes("MODERATOR")) setActiveAgent('JURIST');
                
                setTranscription(prev => {
                  const last = prev[prev.length - 1];
                  if (last && !last.text.endsWith(".") && !text.startsWith("[")) {
                    return [...prev.slice(0, -1), { ...last, text: last.text + " " + text }];
                  }
                  return [...prev, { role: 'Model', text }];
                });
              }
            }

            if (message.serverContent?.interrupted) {
              console.log("[GCP-PROOF] Live API Interrupted");
              nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
            }
          },
          onclose: (event: any) => {
            console.log("[GCP-PROOF] Live API Session Closed. Code:", event?.code, "Reason:", event?.reason);
            stopSession();
          },
          onerror: (err: any) => {
            console.error("[GCP-PROOF] Live API Error Details:", err);
            if (err?.message) console.error("[GCP-PROOF] Error Message:", err.message);
            stopSession();
            setIsConnecting(false);
          }
        }
      });

      sessionRef.current = sessionPromise;
      sessionPromise.then(s => {
        console.log("[GCP-PROOF] Session promise resolved successfully");
        sessionRef.current = s;
      }).catch(err => {
        console.error("[GCP-PROOF] Session connection promise failed:", err);
        setIsConnecting(false);
        setIsConnected(false);
        if (err?.message?.includes("Network error")) {
          alert("Network error: The Live API connection was blocked or failed. Please check your internet connection and ensure your API key has access to the Gemini 2.5 Live models.");
        }
      });
    } catch (err) {
      console.error("[GCP-PROOF] Failed to connect to Live API:", err);
      setIsConnecting(false);
    }
  };

  const playAudioChunk = async (base64Data: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    // Force resume on every chunk to combat browser auto-suspend
    if (audioContextRef.current.state !== 'running') {
      await audioContextRef.current.resume();
    }

    setIsModelSpeaking(true);

    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to Float32
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const buffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);

      const now = audioContextRef.current.currentTime;
      const startTime = Math.max(nextStartTimeRef.current, now);
      
      console.log(`[GCP-PROOF] Scheduling audio chunk: now=${now.toFixed(3)}, start=${startTime.toFixed(3)}, duration=${buffer.duration.toFixed(3)}`);
      
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;
      
      // Clear model speaking state when audio finishes
      setTimeout(() => {
        if (audioContextRef.current && nextStartTimeRef.current <= audioContextRef.current.currentTime + 0.1) {
          setIsModelSpeaking(false);
          setActiveAgent(null);
        }
      }, buffer.duration * 1000);
    } catch (err) {
      console.error("[GCP-PROOF] Error playing audio chunk:", err);
    }
  };

  const toggleMicrophone = async () => {
    if (isMicrophoneActive) {
      if (processorRef.current) processorRef.current.disconnect();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      setIsMicrophoneActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      // Ensure context is running
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      // Use 24000 for context, but we need to resample to 16000 for Gemini
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Simple downsampling from 24000 to 16000 (3:2 ratio)
        const targetLength = Math.floor(inputData.length * (16000 / 24000));
        const pcm16 = new Int16Array(targetLength);
        
        for (let i = 0; i < targetLength; i++) {
          const sourceIdx = Math.floor(i * (24000 / 16000));
          const sample = inputData[sourceIdx];
          pcm16[i] = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
        }
        
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
        if (sessionRef.current) {
          const session = sessionRef.current;
          const sendInput = (s: any) => {
            if (s && typeof s.sendRealtimeInput === 'function') {
              s.sendRealtimeInput({
                media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
              });
            }
          };

          if (session instanceof Promise) {
            session.then(sendInput).catch(err => console.error("Error sending audio via promise:", err));
          } else {
            sendInput(session);
          }
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      processorRef.current = processor;
      setIsMicrophoneActive(true);
    } catch (err: any) {
      console.error("[GCP-PROOF] Microphone access failed:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionDenied(true);
        console.warn("[GCP-PROOF] Microphone access denied. Switching to listen-only mode.");
      } else {
        alert("Could not access microphone: " + err.message);
      }
      setIsMicrophoneActive(false);
    }
  };

  return (
    <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      <div className="bg-black text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className={`w-5 h-5 ${isConnected ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
          <h3 className="text-sm font-bold uppercase tracking-widest">Live Debate Studio</h3>
        </div>
        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">On Air</span>
            </div>
          )}
          <button 
            onClick={isConnected ? stopSession : startSession}
            disabled={isConnecting}
            className={`px-4 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
              isConnected ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse'
            }`}
          >
            {isConnecting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : isConnected ? 'End Session' : 'Start Debate'}
          </button>
          {audioContextState === 'suspended' && isConnected && (
            <button 
              onClick={() => audioContextRef.current?.resume()}
              className="px-4 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white"
            >
              Resume Audio
            </button>
          )}
          <button 
            onClick={testAudio}
            className="px-4 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-gray-200 hover:bg-gray-300 text-black"
          >
            Test Audio
          </button>
          {isConnected && (
            <button 
              onClick={jumpstartDebate}
              className="px-4 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-green-600 hover:bg-green-700 text-white"
            >
              Jumpstart
            </button>
          )}
        </div>
      </div>

      {micPermissionDenied && isConnected && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-[11px] text-amber-800 font-medium leading-tight">
            <span className="font-bold uppercase mr-1">Listen-Only Mode:</span> 
            Microphone access was denied. You can hear the debate, but you cannot participate. 
            Check your browser settings to enable microphone access.
          </p>
        </div>
      )}

      {isConnected && audioContextState === 'suspended' && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="bg-white p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md text-center">
            <Volume2 className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
            <h4 className="text-xl font-black uppercase mb-2">Audio is Muted</h4>
            <p className="text-sm text-gray-600 mb-6">
              Your browser has blocked the audio broadcast. Click the button below to enable the live debate sound.
            </p>
            <button 
              onClick={() => audioContextRef.current?.resume()}
              className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Enable Sound
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[600px] lg:h-[600px]">
        {/* Visualizer / Agents Section */}
        <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-gray-100 p-4 lg:p-8 flex flex-col bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12 flex-1 items-center">
            {[
              { id: 'ADVOCATE', name: 'The Advocate', role: 'Left-Leaning', color: 'bg-blue-600', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', desc: 'Progressive Voice' },
              { id: 'JURIST', name: 'The Jurist', role: 'Moderator', color: 'bg-gray-800', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', desc: 'Fact Verifier' },
              { id: 'SENTINEL', name: 'The Sentinel', role: 'Right-Leaning', color: 'bg-red-600', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack', desc: 'Conservative Voice' },
            ].map((agent) => (
              <div key={agent.id} className="flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  {activeAgent === agent.id && (
                    <motion.div
                      layoutId="halo"
                      className="absolute -inset-8 rounded-full bg-indigo-500/40 blur-3xl"
                      animate={{ 
                        scale: [1, 1.4, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  <motion.div 
                    className={`w-24 h-24 lg:w-32 lg:h-32 rounded-full border-4 overflow-hidden flex items-center justify-center relative z-10 transition-all duration-500 ${
                      activeAgent === agent.id ? 'border-black shadow-2xl scale-110' : 'border-gray-200 opacity-60 grayscale-[50%]'
                    } ${agent.color} text-white`}
                    animate={{
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: agent.id === 'ADVOCATE' ? 0 : agent.id === 'JURIST' ? 1 : 2
                    }}
                  >
                    <img 
                      src={agent.avatar} 
                      alt={agent.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    
                    {activeAgent === agent.id && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                        {[1, 2, 3].map(i => (
                          <motion.div
                            key={i}
                            animate={{ height: [4, 12, 4] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}
                            className="w-1 bg-white rounded-full"
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
                <div className="text-center">
                  <div className={`text-xs lg:text-sm font-bold uppercase tracking-widest transition-all duration-500 ${activeAgent === agent.id ? 'text-black scale-110' : 'text-gray-400'}`}>
                    {agent.name}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{agent.role}</div>
                  <div className="text-[9px] text-gray-300 uppercase font-medium mt-1">{agent.desc}</div>
                  
                  {activeAgent === 'JURIST' && agent.id === 'JURIST' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 px-2 py-0.5 bg-amber-100 border border-amber-200 rounded text-[8px] font-black text-amber-700 uppercase tracking-widest animate-pulse"
                    >
                      Fact Verifying...
                    </motion.div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-6 w-full">
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={toggleMicrophone}
                  disabled={!isConnected}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isMicrophoneActive ? 'bg-red-100 text-red-600 border-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {isMicrophoneActive ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  {isMicrophoneActive ? 'Mic On' : 'Mic Off'}
                </span>
              </div>
              <div className="flex-1 max-w-xs h-1 bg-gray-200 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ width: isConnected ? '100%' : '0%' }}
                  transition={{ duration: 1 }}
                  className="h-full bg-indigo-600"
                />
              </div>
              <Volume2 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-1 h-4">
              {isModelSpeaking && Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [4, Math.random() * 16 + 4, 4] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                  className="w-1 bg-indigo-500 rounded-full"
                />
              ))}
            </div>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
              {isMicrophoneActive ? 'The panel is listening to you...' : isModelSpeaking ? 'Panel is speaking...' : 'Click the mic to join the debate'}
            </p>
          </div>
        </div>

        {/* Fact Board / Transcription Section */}
        <div className="flex flex-col bg-white overflow-hidden">
          <div className="border-b border-gray-100 p-4 flex items-center justify-between bg-gray-50/30">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Fact Board & Live Feed</h3>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-tighter">Live Verification</span>
            </div>
          </div>
          
          <div className="p-4 bg-indigo-50/30 border-b border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-3 h-3 text-indigo-400" />
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Debate Brief</span>
            </div>
            <p className="text-[10px] text-indigo-900 font-medium leading-relaxed italic">
              "{brief.length > 200 ? brief.substring(0, 200) + '...' : brief}"
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {transcription.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                <Radio className="w-8 h-8 opacity-20" />
                <p className="text-[10px] uppercase font-bold tracking-widest">Waiting for broadcast...</p>
              </div>
            ) : (
              transcription.map((t, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs leading-relaxed"
                >
                  <span className={`font-bold uppercase text-[10px] block mb-1 ${
                    t.text.includes("ADVOCATE") ? "text-blue-600" : 
                    t.text.includes("SENTINEL") ? "text-red-600" : 
                    t.text.includes("JURIST") ? "text-gray-900" : "text-gray-400"
                  }`}>
                    {t.text.includes("ADVOCATE") ? "The Advocate" : 
                     t.text.includes("SENTINEL") ? "The Sentinel" : 
                     t.text.includes("JURIST") ? "The Jurist" : "Panel"}
                  </span>
                  <p className="text-gray-700 font-serif italic">
                    {t.text.replace(/\[(ADVOCATE|SENTINEL|JURIST)\]/g, "").replace(/ADVOCATE|SENTINEL|JURIST/g, "")}
                  </p>
                </motion.div>
              ))
            )}
          </div>
          {!isConnected && (
            <div className="p-4 bg-indigo-50 border-t border-indigo-100 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
              <p className="text-[10px] text-indigo-700 leading-relaxed">
                <strong>Pro Tip:</strong> Start the debate to hear the agents discuss the news in real-time. You can use your microphone to ask questions or challenge their perspectives.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
