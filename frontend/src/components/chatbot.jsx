// frontend/src/components/ChatBot.jsx
// Powered by Groq (Llama 3) — 100% FREE, no rate limit issues
import { useState, useRef, useEffect } from "react";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;

const SYSTEM_PROMPT = `You are UniBot, a helpful AI assistant for UniSlot — a Smart Campus Operations Hub at SLIIT university in Sri Lanka. You help students and staff with:
- Booking labs, lecture halls, meeting rooms, and equipment
- Booking workflows: PENDING=waiting for admin approval, APPROVED=confirmed, REJECTED=denied with reason, CANCELLED=user cancelled
- Resource availability and schedules
- Why bookings get rejected (time conflicts, resource out of service, capacity exceeded)
- General campus facility info at SLIIT
Be concise, friendly, use bullet points for steps. Tell users to check My Bookings page for specific booking data. Never make up booking IDs or dates.`;

export default function ChatBot() {
  const [open,        setOpen]        = useState(false);
  const [messages,    setMessages]    = useState([
    {
      role: "bot",
      text: "Hi! I'm **UniBot**, your Smart Campus Assistant 👋\n\nI can help you with:\n• Booking labs, halls, and rooms\n• Checking resource availability\n• Understanding your booking status\n• Campus facility questions\n\nWhat can I help you with today?",
    },
  ]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [unread,      setUnread]      = useState(0);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const formatText = (text) =>
    text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n•/g, "<br/>•")
      .replace(/\n-/g, "<br/>-")
      .replace(/\n\n/g, "<br/><br/>")
      .replace(/\n/g, "<br/>");

  const getTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendMessage = async (overrideText) => {
    const userText = overrideText || input.trim();
    if (!userText || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);

    historyRef.current.push({ role: "user", content: userText });

    setLoading(true);

    try {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...historyRef.current,
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const reply =
        data.choices?.[0]?.message?.content ||
        "Sorry, I could not process that. Please try again.";

      historyRef.current.push({ role: "assistant", content: reply });

      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
      if (!open) setUnread((n) => n + 1);
    } catch (err) {
      historyRef.current.pop();
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Connection error. Please check your internet and try again." },
      ]);
      console.error("UniBot error:", err.message);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickChips = [
    "How do I book a lab?",
    "What does PENDING mean?",
    "Why was my booking rejected?",
    "How long does approval take?",
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Open UniBot"
        style={{
          position: "fixed", bottom: 100, right: 24,
          width: 56, height: 56, borderRadius: "50%",
          background: open ? "#ea580c" : "#f97316",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(249,115,22,.45)",
          zIndex: 1000, transition: "background .2s, transform .15s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
        onMouseOut={(e)  => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5l10 10M15 5L5 15" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 30 30" fill="none" aria-hidden="true">
  <rect x="6" y="9" width="18" height="14" rx="5" fill="white" fill-opacity="0.15"/>
  <rect x="6" y="9" width="18" height="14" rx="5" stroke="white" stroke-width="1.5"/>
  <circle cx="11" cy="16" r="1.8" fill="white"/>
  <circle cx="19" cy="16" r="1.8" fill="white"/>
  <path d="M13 19.5h4" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M10 9V7a1 1 0 012 0v2" stroke="white" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M18 9V7a1 1 0 012 0v2" stroke="white" stroke-width="1.3" stroke-linecap="round"/>
  <rect x="3" y="13" width="2.5" height="5" rx="1.2" fill="white" fill-opacity="0.7"/>
  <rect x="24.5" y="13" width="2.5" height="5" rx="1.2" fill="white" fill-opacity="0.7"/>
</svg>
        )}
        {unread > 0 && !open && (
          <div style={{
            position: "absolute", top: 0, right: 0,
            width: 20, height: 20, background: "#ef4444",
            borderRadius: "50%", border: "2.5px solid #fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "#fff",
          }}>
            {unread}
          </div>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 24,
          width: 360, height: 520,
          background: "#fff", borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 8px 40px rgba(0,0,0,.14)",
          display: "flex", flexDirection: "column",
          zIndex: 999, overflow: "hidden",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          animation: "slideUp .2s ease",
        }}>

          {/* Header */}
          <div style={{
            padding: "12px 16px", borderBottom: "1px solid #f3f4f6",
            display: "flex", alignItems: "center", gap: 10,
            background: "#fff", flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, background: "#1d4ed8", borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="4" width="14" height="9" rx="2.5" fill="#bfdbfe"/>
                <circle cx="6.5" cy="8.5" r="1.3" fill="#1d4ed8"/>
                <circle cx="11.5" cy="8.5" r="1.3" fill="#1d4ed8"/>
                <path d="M9 2v2" stroke="#bfdbfe" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>UniBot</div>
              <div style={{
                fontSize: 11,
                color: loading ? "#f59e0b" : "#16a34a",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span style={{
                  width: 6, height: 6,
                  background: loading ? "#f59e0b" : "#16a34a",
                  borderRadius: "50%", display: "inline-block",
                  transition: "background .3s",
                }}/>
                {loading ? "Typing…" : "Online · Campus AI Assistant"}
              </div>
            </div>
            <span style={{
              background: "#faf5ff", color: "#6d28d9",
              fontSize: 10, fontWeight: 700,
              padding: "3px 8px", borderRadius: 20,
              border: "1px solid #e9d5ff",
            }}>
              Llama 3 AI
            </span>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "14px 14px 6px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {messages.map((m, i) => {
              const isBot = m.role === "bot";
              return (
                <div key={i} style={{
                  display: "flex", gap: 8,
                  flexDirection: isBot ? "row" : "row-reverse",
                  animation: "fadeUp .2s ease",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    flexShrink: 0, marginTop: 2,
                    background: isBot ? "#1d4ed8" : "#eff6ff",
                    border: isBot ? "none" : "1px solid #bfdbfe",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700,
                    color: isBot ? "#fff" : "#1d4ed8",
                  }}>
                    {isBot ? "UB" : "Me"}
                  </div>
                  <div style={{ maxWidth: "76%" }}>
                    <div
                      style={{
                        padding: "9px 12px",
                        borderRadius: isBot ? "4px 10px 10px 10px" : "10px 4px 10px 10px",
                        fontSize: 13, lineHeight: 1.6,
                        background: isBot ? "#f9fafb" : "#1d4ed8",
                        color: isBot ? "#111827" : "#fff",
                        border: isBot ? "1px solid #e5e7eb" : "none",
                      }}
                      dangerouslySetInnerHTML={{ __html: formatText(m.text) }}
                    />
                    <div style={{
                      fontSize: 10, color: "#9ca3af", marginTop: 3,
                      textAlign: isBot ? "left" : "right",
                    }}>
                      {isBot ? "UniBot" : "You"} · {getTime()}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing dots */}
            {loading && (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, background: "#1d4ed8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>UB</div>
                <div style={{
                  padding: "10px 14px", background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px 10px 10px 10px",
                  display: "flex", gap: 4, alignItems: "center",
                }}>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <div key={i} style={{
                      width: 7, height: 7, background: "#9ca3af",
                      borderRadius: "50%",
                      animation: `bounce 0.9s ${d}s infinite`,
                    }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick chips */}
          {messages.length <= 2 && (
            <div style={{
              padding: "6px 12px", display: "flex",
              gap: 5, flexWrap: "wrap",
              borderTop: "1px solid #f9fafb", flexShrink: 0,
            }}>
              {quickChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  disabled={loading}
                  style={{
                    padding: "5px 10px", background: "#f9fafb",
                    border: "1px solid #e5e7eb", borderRadius: 20,
                    fontSize: 11, fontWeight: 500, color: "#6b7280",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1, transition: "all .12s",
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.target.style.background = "#eff6ff";
                      e.target.style.color = "#1d4ed8";
                      e.target.style.borderColor = "#bfdbfe";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "#f9fafb";
                    e.target.style.color = "#6b7280";
                    e.target.style.borderColor = "#e5e7eb";
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div style={{
            padding: "10px 12px", borderTop: "1px solid #f3f4f6",
            display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              placeholder={loading ? "UniBot is typing…" : "Ask about bookings, resources..."}
              style={{
                flex: 1, padding: "9px 12px",
                border: "1px solid #e5e7eb", borderRadius: 9,
                fontSize: 13, fontFamily: "inherit",
                color: "#111827", background: loading ? "#f9fafb" : "#fff",
                outline: "none", resize: "none",
                maxHeight: 80, lineHeight: 1.5,
                opacity: loading ? 0.7 : 1,
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
              }}
              onFocus={(e) => { e.target.style.borderColor = "#1d4ed8"; }}
              onBlur={(e)  => { e.target.style.borderColor = "#e5e7eb"; }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, background: "#1d4ed8",
                border: "none", borderRadius: 8, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                opacity: !input.trim() || loading ? 0.4 : 1,
                transition: "opacity .15s",
              }}
            >
              {loading ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  style={{ animation: "spin .7s linear infinite" }}>
                  <circle cx="7" cy="7" r="5.5" stroke="#fff" strokeWidth="1.5" strokeDasharray="20 15"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M2 7.5h11M9 3.5l4 4-4 4" stroke="#fff" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: "center", padding: "5px 0 8px",
            fontSize: 10, color: "#9ca3af", flexShrink: 0,
          }}>
            Powered by{" "}
            <span style={{ color: "#7c3aed", fontWeight: 600 }}>Groq · Llama 3</span>
            {" "}· UniSlot Smart Campus
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%,100% { transform: translateY(0); opacity: .4; }
          50%      { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}