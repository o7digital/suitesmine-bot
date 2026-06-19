"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import DynamicFields from "@/components/DynamicFields";
import { getVisitorConversation, persistAssistantMessage, persistConversationMessage, sendMessage } from "@/lib/api";

const WELCOME_MESSAGE =
  "Bonjour, je suis votre concierge Suites Mine. Je peux vous aider avec les disponibilités, tarifs, réservations et informations sur votre séjour.";

const siteCopy = {
  default: {
    fr: {
      welcome: WELCOME_MESSAGE,
      online: "Concierge disponible",
      placeholder: "Posez votre question...",
      send: "Envoyer",
      loading: "Un instant...",
      error: "Je rencontre un souci temporaire. Pouvez-vous réessayer dans quelques instants ?",
      open: "Ouvrir le chat",
      close: "Fermer le chat",
    },
    es: {
      welcome: "Hola, soy Olivia. Puedo ayudarle con su solicitud.",
      online: "Concierge disponible",
      placeholder: "Escriba su pregunta...",
      send: "Enviar",
      loading: "Un momento...",
      error: "Tengo un problema temporal. Puede intentarlo de nuevo en unos instantes?",
      open: "Abrir chat",
      close: "Cerrar chat",
    },
    en: {
      welcome: "Hello, I am Olivia. I can help with your request.",
      online: "Concierge available",
      placeholder: "Ask your question...",
      send: "Send",
      loading: "One moment...",
      error: "I am having a temporary issue. Please try again in a moment.",
      open: "Open chat",
      close: "Close chat",
    },
    zh: {
      welcome: "您好，我是 Olivia，可以协助您处理咨询。",
      online: "在线服务",
      placeholder: "请输入您的问题...",
      send: "发送",
      loading: "请稍等...",
      error: "暂时出现问题，请稍后再试。",
      open: "打开聊天",
      close: "关闭聊天",
    },
  },
  suitesmine: {
    es: {
      welcome:
        "Buenas tardes, soy Olivia, anfitriona digital de Suites Mine. Puedo revisar fechas, orientar sobre categorias y preparar su solicitud de reserva.",
      online: "Hotesse digitale disponible",
      placeholder: "Pregunte por fechas, tarifas o reserva...",
      send: "Enviar",
      loading: "Un momento...",
      error: "Tengo un problema temporal. Puede intentarlo de nuevo en unos instantes?",
      open: "Abrir Olivia IA Concierge",
      close: "Cerrar Olivia IA Concierge",
      actions: [
        ["Disponibilidad", "Quiero revisar disponibilidad"],
        ["Reservar", "Deseo reservar"],
        ["Habitaciones", "Quiero ver habitaciones"],
        ["Contacto", "Necesito contacto"],
      ],
    },
    en: {
      welcome:
        "Good afternoon, I am Olivia, Suites Mine's digital hostess. I can review dates, guide you through room categories and prepare your booking request.",
      online: "Digital hostess available",
      placeholder: "Ask about dates, rates or booking...",
      send: "Send",
      loading: "One moment...",
      error: "I am having a temporary issue. Please try again in a moment.",
      open: "Open Olivia AI Concierge",
      close: "Close Olivia AI Concierge",
      actions: [
        ["Availability", "I want to check availability"],
        ["Book", "I want to book"],
        ["Rooms", "I want to see rooms"],
        ["Contact", "I need contact information"],
      ],
    },
    zh: {
      welcome: "下午好，我是 Olivia，Suites Mine 的数字礼宾。我可以帮您查询日期、介绍房型并准备预订申请。",
      online: "数字礼宾在线",
      placeholder: "询问日期、价格或预订...",
      send: "发送",
      loading: "请稍等...",
      error: "暂时出现问题，请稍后再试。",
      open: "打开 Olivia AI 礼宾",
      close: "关闭 Olivia AI 礼宾",
      actions: [
        ["查房态", "我想查询可订日期"],
        ["预订", "我想预订"],
        ["房型", "我想查看房型"],
        ["联系", "我需要联系方式"],
      ],
    },
  },
};

function normalizeLanguage(value) {
  return ["es", "en", "fr", "zh"].includes(value) ? value : "fr";
}

function getPageLanguage() {
  if (typeof window === "undefined") return "fr";
  const params = new URLSearchParams(window.location.search);
  const queryLanguage = params.get("lang");
  if (queryLanguage) return normalizeLanguage(queryLanguage);
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith("/en")) return "en";
  if (path.startsWith("/zh")) return "zh";
  if (path.startsWith("/es")) return "es";
  return "es";
}

function getCopy(clientId, language) {
  return siteCopy[clientId]?.[language] || siteCopy[clientId]?.es || siteCopy.default[language] || siteCopy.default.fr;
}

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
  const [language, setLanguage] = useState("es");
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [messages, setMessages] = useState([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const visitorId = useRef("");
  const receivedIds = useRef(new Set());
  const copy = getCopy(clientId, language);

  useEffect(() => {
    const detectedLanguage = getPageLanguage();
    setLanguage(detectedLanguage);
    setMetadata((prev) => ({
      ...prev,
      language: detectedLanguage,
      pageUrl: window.location.href,
    }));
    setMessages([{ role: "assistant", content: getCopy(clientId, detectedLanguage).welcome }]);
  }, [clientId]);

  useEffect(() => {
    visitorId.current =
      window.localStorage.getItem("oliviaVisitorId") || window.crypto.randomUUID();
    window.localStorage.setItem("oliviaVisitorId", visitorId.current);

    const poll = async () => {
      try {
        const data = await getVisitorConversation({ clientCode: clientId, visitorId: visitorId.current });
        const incoming = (data.messages || []).filter(
          (message) => message.role === "operator" && !receivedIds.current.has(message.id)
        );
        incoming.forEach((message) => receivedIds.current.add(message.id));
        if (incoming.length) {
          setMessages((prev) => [
            ...prev,
            ...incoming.map((message) => ({ role: "assistant", content: message.content })),
          ]);
        }
      } catch {}
    };
    const timer = window.setInterval(poll, 4000);
    return () => window.clearInterval(timer);
  }, [clientId]);

  const handleSend = async (overrideMessage = "") => {
    const message = (overrideMessage || input).trim();
    if (!message || isLoading) return;

    if (!overrideMessage) setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setIsLoading(true);

    try {
      let storedConversation = null;
      try {
        storedConversation = await persistConversationMessage({
          clientCode: clientId,
          visitorId: visitorId.current,
          content: message,
          metadata,
          source: "website",
        });
      } catch {}

      if (storedConversation?.conversation?.status === "manual") {
        return;
      }

      const data = await sendMessage({
        clientId,
        message,
        metadata,
      });
      const assistantContent = getAssistantText(data);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantContent },
      ]);
      try {
        await persistAssistantMessage({
          clientCode: clientId,
          visitorId: visitorId.current,
          content: assistantContent,
          model: data.model,
        });
      } catch {}
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: copy.error,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mb-4 flex h-[min(720px,calc(100vh-7rem))] w-[430px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[24px] border border-[#ded7c9] bg-[#fffdf8] shadow-[0_32px_90px_-45px_rgba(43,43,43,0.65)]"
          >
            <header className="relative overflow-hidden border-b border-[#ded7c9] bg-[#2b2b2b] px-5 py-4 text-white">
              <div className="absolute inset-x-0 bottom-0 h-px bg-[#c8aa70]" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10">
                    <Sparkles className="h-4 w-4 text-[#f4d99a]" />
                  </div>
                  <div>
                    <p className="text-base font-semibold tracking-tight">{widgetTitle}</p>
                    <p className="mt-1 text-xs text-white/75">{copy.online}</p>
                  </div>
                </div>
                <button
                  aria-label={copy.close}
                  onClick={() => setIsOpen(false)}
                  className="rounded-full bg-white/10 p-2 transition hover:bg-white/18"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f2e9] px-4 py-4">
              {messages.map((msg, idx) => (
                <MessageBubble key={`${msg.role}-${idx}`} role={msg.role}>
                  {msg.content}
                </MessageBubble>
              ))}
              {copy.actions?.length ? (
                <div className="grid grid-cols-2 gap-2">
                  {copy.actions.map(([label, prompt]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="rounded-lg border border-[#8a754f] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#2b2b2b] transition hover:bg-[#efe4cd]"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
              {isLoading && <MessageBubble role="assistant">{copy.loading}</MessageBubble>}
            </div>

            <div className="space-y-3 border-t border-[#ded7c9] bg-[#fffdf8] p-3">
              <DynamicFields metadata={metadata} setMetadata={setMetadata} language={language} />
              <div className="flex items-end gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={copy.placeholder}
                  className="h-12 flex-1 rounded-xl border border-[#ded7c9] bg-white px-4 text-sm text-[#2b2b2b] outline-none placeholder:text-[#8c806d] focus:ring-2 focus:ring-[#c8aa70]"
                />
                <button
                  aria-label={copy.send}
                  onClick={handleSend}
                  disabled={isLoading}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2b2b2b] text-white shadow-[0_16px_32px_-22px_rgba(0,0,0,0.75)] transition hover:bg-[#3a352d] disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <button
        aria-label={isOpen ? copy.close : copy.open}
        onClick={() => setIsOpen((v) => !v)}
        className="ml-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#2b2b2b] text-white shadow-[0_22px_60px_-24px_rgba(0,0,0,0.75)] ring-1 ring-[#c8aa70]/35 transition hover:scale-[1.02]"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
