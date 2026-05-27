import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, SendHorizontal, RefreshCw, Minimize2, ArrowUpRight } from "lucide-react";
import { ChatMessage, Language } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AiBeniDashModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export default function AiBeniDashModal({ isOpen, onClose, language }: AiBeniDashModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompts depending on selected language
  const suggestions = language === "en" ? [
    "Tell me about Baniya Empire's vision",
    "How can I earn NPR 400-700/day as a rider?",
    "What is BeniJobs Nepal?",
    "How do I use BeniDash Gurukul?"
  ] : [
    "बानियाँ साम्राज्यको लक्ष्य के हो?",
    "चालक बनेर दिनको ४००-७०० कसरी कमाउने?",
    "बेनीजब्स नेपाल भनेको के हो?",
    "बेनीडेश गुरुकुल कसरी चलाउने?"
  ];

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Set initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text: language === "en" 
            ? "Namaste! 🙏 I am AI BeniDash, your digital companion for the Baniya Empire and Myagdi district. Our core developers and team built me to connect you with opportunities here at home. Ask me anything about our rides & delivery app, jobs board, gurukul programs, or how you can participate!"
            : "नमस्ते! 🙏 म एआई बेनीडेश हुँ, बानियाँ साम्राज्य र म्याग्दी जिल्लाको लागि डिजिटल मित्र। हाम्रो प्रविधि टोली र विकासकर्ताहरूले तपाईंलाई घरमै अवसरहरूसँग जोड्न मलाई तयार पारेका हुन्। मलाई हाम्रो डेलिभरी सेवा, रोजगार मञ्च, वा म्याग्दीको विकासका बारे जे पनि सोध्नुहोस्!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [language]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    try {
      // Gather current message history to send for context
      const chatHistory = messages.slice(-6).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/ai-benidash/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory
        })
      });

      const data = await res.json();
      
      const assistantMsg: ChatMessage = {
        role: "assistant",
        text: data.text || "Namaste! I had a connection ripple down here in the mountains of Myagdi. Please let me try again in a bit!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const assistantMsg: ChatMessage = {
        role: "assistant",
        text: language === "en"
          ? "I had a bit of trouble reaching our servers in Beni. Let's try once more!"
          : "बेनीका हाम्रा सर्भरहरूसँग सम्पर्क हुन सकेन। पुन: प्रयास गरौं!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        text: language === "en"
          ? "Namaste! The ledger is cleared. What can I explore for you in Myagdi today?"
          : "नमस्ते! च्याट इतिहास मेटाईयो। आज म्याग्दीका बारेमा के कुरा बुझ्न चाहनुहुन्छ?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#080604]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3 }}
        className="bg-[#100C08] border border-[#D4A017]/30 rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-[#D4A017] to-cyan-500" />
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#D4A017]/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-cyan-600/10 blur-3xl rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#D4A017]/15 flex justify-between items-center bg-[#15100B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#D4A017]/15 flex items-center justify-center text-[#F5C842]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-serif font-black text-white flex items-center gap-2">
                <span>AI BeniDash</span>
                <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-sans tracking-wide uppercase">
                  {language === "en" ? "Live GenAI" : "लाइभ सहायक"}
                </span>
              </div>
              <p className="text-xs text-[#9A8A6A]">
                {language === "en" ? "Nepal's mountain-savvy chatbot assistant" : "नेपालको आफ्नै पहाडी एआई सहायक"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={clearChat}
              title="Reset Chat"
              className="p-2 text-[#9A8A6A] hover:text-[#F5C842] hover:bg-[#D4A017]/5 rounded-lg cursor-pointer transition-all duration-250"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-[#9A8A6A] hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-all duration-250"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conversation Box */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex flex-col max-w-[85%] ${
                  m.role === "user" ? "self-end items-end" : "self-start items-start"
                }`}
              >
                {/* Message bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-[13.5px] leading-relaxed select-text ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-[#D4A017] to-amber-600 text-black font-medium rounded-tr-none"
                      : "bg-[#1A130D] border border-[#D4A017]/10 text-[#F9F3E3] rounded-tl-none font-light"
                  }`}
                >
                  <div className="markdown-body whitespace-pre-line">{m.text}</div>
                </div>
                {/* Meta details */}
                <span className="text-[10px] text-[#9A8A6A] mt-1 px-1">
                  {m.role === "assistant" ? "AI BeniDash" : "You"} · {m.timestamp}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Assistant Typing Status */}
          {isTyping && (
            <div className="self-start flex flex-col items-start max-w-[85%]">
              <div className="bg-[#1A130D] border border-[#D4A017]/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-bounce delay-75" />
                <span className="w-2 h-2 rounded-full bg-[#F5C842] animate-bounce delay-150" />
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce delay-225" />
              </div>
              <span className="text-[9px] text-[#9A8A6A] mt-1">
                {language === "en" ? "Translating thoughts..." : "विचार संकलन गर्दै..."}
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions & Prompt Inputs */}
        <div className="p-4 border-t border-[#D4A017]/15 bg-[#15100B] flex flex-col gap-3">
          {/* Preset Prompts Chips */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((p, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => {
                    setInputVal(p);
                    handleSend(p);
                  }}
                  className="text-xs bg-[#1A130D] hover:bg-[#D4A017]/10 border border-[#D4A017]/15 hover:border-[#D4A017]/40 text-[#F5C842] px-3 py-1.5 rounded-full text-left transition-all duration-200 cursor-pointer flex items-center gap-1"
                >
                  <span>{p}</span>
                  <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                language === "en"
                  ? "Ask AI BeniDash in English or नेपाली..."
                  : "एआई बेनीडेशलाई अंग्रेजी वा नेपालीमा सोध्नुहोस्..."
              }
              className="flex-1 bg-[#080604] border border-[#D4A017]/25 rounded-xl px-4 py-3 text-sm text-[#F9F3E3] placeholder-[#9A8A6A] font-sans"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isTyping}
              className="w-11 h-11 rounded-xl bg-[#D4A017] hover:bg-[#F5C842] text-black hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 flex items-center justify-center transition-all duration-200 cursor-pointer"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
