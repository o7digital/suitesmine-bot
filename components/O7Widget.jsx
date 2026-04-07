"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Send, X } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import DynamicFields from "@/components/DynamicFields";
import { sendMessage } from "@/lib/api";

const WELCOME_MESSAGE =
  "Bonjour, je peux vous aider avec les disponibilités, tarifs, réservations et informations sur votre séjour.";

function getAssistantText(response) {
  if (!response) return "Merci, votre demande a bien été reçue.";
  if (typeof response === "string") return response;
  return (
    response.reply ||
    response.response ||
    response.message ||
    response.output ||
    "Merci, votre demande a bien été reçue."
  );
}

export default function O7Widget({ clientId = "default", title = "O7 IA Chat" }) {
  const widgetTitle = typeof title === "string" && title.trim() ? title : "O7 IA Chat";
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [messages, setMessages] = useState([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setIsLoading(true);

    try {
      const data = await sendMessage({
        clientId,
        message,
        metadata,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: getAssistantText(data) },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Je rencontre un souci temporaire. Pouvez-vous réessayer dans quelques instants ?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mb-4 flex h-[680px] w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[32px] border border-[#d9e1fa] bg-white shadow-[0_40px_110px_-42px_rgba(32,36,49,0.45)]"
          >
            <header className="relative overflow-hidden bg-gradient-to-br from-[#202431] to-[#8DA2FB] px-5 py-4 text-white">
              <div className="absolute right-[-24px] top-[-24px] h-20 w-20 rounded-full bg-white/15 blur-2xl" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold tracking-tight">{widgetTitle}</p>
                  <p className="mt-1 text-xs text-white/85">Online</p>
                </div>
                <button
                  aria-label="Fermer"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl bg-white/15 p-2 transition hover:bg-white/25"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-[#f6f7fb] to-white px-4 py-4">
              {messages.map((msg, idx) => (
                <MessageBubble key={`${msg.role}-${idx}`} role={msg.role}>
                  {msg.content}
                </MessageBubble>
              ))}
              {isLoading && <MessageBubble role="assistant">...</MessageBubble>}
            </div>

            <div className="space-y-3 border-t border-[#e6ebfb] bg-white p-3">
              <DynamicFields metadata={metadata} setMetadata={setMetadata} />
              <div className="flex items-end gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Indiquez vos dates ou posez votre question..."
                  className="h-12 flex-1 rounded-2xl border border-[#e3e8f8] bg-[#f9fbff] px-4 text-sm outline-none placeholder:text-black/35 focus:ring-2 focus:ring-[#8DA2FB]"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#202431] to-[#8DA2FB] text-white shadow-[0_14px_36px_-18px_rgba(0,0,0,0.45)] disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <button
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
        onClick={() => setIsOpen((v) => !v)}
        className="ml-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#202431] to-[#8DA2FB] text-white shadow-[0_22px_60px_-20px_rgba(0,0,0,0.45)] transition hover:scale-[1.02]"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
}
