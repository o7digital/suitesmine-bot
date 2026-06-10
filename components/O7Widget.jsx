"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Send, X } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import DynamicFields from "@/components/DynamicFields";
import { getVisitorConversation, persistAssistantMessage, persistConversationMessage, sendMessage } from "@/lib/api";

const WELCOME_MESSAGE =
  "Bonjour, je peux vous aider avec les disponibilités, tarifs, réservations et informations sur votre séjour.";
const CONSENT_KEY = "oliviaAiConsent:v1";

const consentCopy = {
  fr: {
    title: "Avis de confidentialité",
    body:
      "Olivia AI peut traiter vos messages et informations de contact afin de répondre à votre demande, qualifier votre besoin, permettre une reprise humaine et produire des statistiques de service. Vos données sont traitées selon les règles applicables à votre région, notamment RGPD, LFPDPPP ou lois locales de protection des données.",
    note: "Avis informatif uniquement. Les conditions finales restent celles du site ou du contrat du client.",
    accept: "J'accepte",
    decline: "Refuser",
    blocked: "Pour utiliser Olivia AI, vous devez accepter l'avis de confidentialité."
  },
  es: {
    title: "Aviso de privacidad",
    body:
      "Olivia AI puede tratar tus mensajes y datos de contacto para responder tu solicitud, calificar tu necesidad, permitir toma de control humana y generar estadisticas de servicio. Tus datos se procesan bajo las reglas de privacidad aplicables a tu region, incluyendo RGPD, LFPDPPP o leyes locales de proteccion de datos.",
    note: "Aviso solo informativo. Los terminos finales siguen siendo los del sitio o contrato del cliente.",
    accept: "Acepto",
    decline: "Rechazar",
    blocked: "Para usar Olivia AI debes aceptar el aviso de privacidad."
  },
  en: {
    title: "Privacy notice",
    body:
      "Olivia AI may process your messages and contact details to answer your request, qualify your need, enable human takeover and produce service statistics. Your data is processed under privacy rules applicable to your region, including GDPR, LFPDPPP or local data protection laws.",
    note: "Informational notice only. Final terms remain those of the client site or contract.",
    accept: "I accept",
    decline: "Decline",
    blocked: "To use Olivia AI, please accept the privacy notice."
  }
};

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
  const [consent, setConsent] = useState("pending");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [messages, setMessages] = useState([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const visitorId = useRef("");
  const receivedIds = useRef(new Set());

  useEffect(() => {
    setConsent(window.localStorage.getItem(CONSENT_KEY) || "pending");
  }, []);

  useEffect(() => {
    if (consent !== "accepted") return undefined;

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
  }, [clientId, consent]);

  const language = metadata.language || "fr";
  const copy = consentCopy[language] || consentCopy.fr;

  const acceptConsent = () => {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    setConsent("accepted");
  };

  const declineConsent = () => {
    window.localStorage.setItem(CONSENT_KEY, "declined");
    setConsent("declined");
  };

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isLoading) return;
    if (consent !== "accepted") {
      setMessages((prev) => [...prev, { role: "assistant", content: copy.blocked }]);
      return;
    }
    if (!visitorId.current) {
      visitorId.current =
        window.localStorage.getItem("oliviaVisitorId") || window.crypto.randomUUID();
      window.localStorage.setItem("oliviaVisitorId", visitorId.current);
    }

    setInput("");
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
              {consent !== "accepted" && (
                <div className="rounded-3xl border border-[#d9e1fa] bg-white p-4 text-sm text-[#202431] shadow-sm">
                  <p className="font-semibold">{copy.title}</p>
                  <p className="mt-2 leading-relaxed text-black/70">{copy.body}</p>
                  <p className="mt-2 text-xs text-black/45">{copy.note}</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={acceptConsent} className="rounded-2xl bg-[#202431] px-4 py-2 text-sm font-semibold text-white">
                      {copy.accept}
                    </button>
                    <button onClick={declineConsent} className="rounded-2xl border border-black/10 px-4 py-2 text-sm text-black/70">
                      {copy.decline}
                    </button>
                  </div>
                </div>
              )}
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
                  disabled={consent !== "accepted"}
                  placeholder="Indiquez vos dates ou posez votre question..."
                  className="h-12 flex-1 rounded-2xl border border-[#e3e8f8] bg-[#f9fbff] px-4 text-sm outline-none placeholder:text-black/35 focus:ring-2 focus:ring-[#8DA2FB]"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || consent !== "accepted"}
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
