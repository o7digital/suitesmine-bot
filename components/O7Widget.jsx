"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Mic, Paperclip, Send, Sparkles, X } from "lucide-react";
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
      inactive: "Concierge inactif",
      placeholder: "Posez votre question...",
      send: "Envoyer",
      loading: "Un instant...",
      error: "Je rencontre un souci temporaire. Pouvez-vous réessayer dans quelques instants ?",
      consent: "J’ai lu et j’accepte l’avis de confidentialité pour recevoir de l’assistance.",
      privacy: "Voir l’avis",
      privacyTitle: "Avis de confidentialité - Olivia AI",
      privacyBody: "En utilisant ce chat, vous autorisez l’établissement concerné à traiter les données personnelles que vous partagez, notamment messages, coordonnées, langue, page visitée et informations de demande, afin de répondre à votre sollicitation, assurer un suivi et vous contacter par voie électronique. Vous pouvez exercer vos droits d’accès, rectification, annulation et opposition, révoquer votre consentement ou limiter l’utilisation de vos données auprès du responsable indiqué dans l’avis de confidentialité du site.",
      privacyAccept: "J’ai lu et j’accepte",
      open: "Ouvrir le chat",
      close: "Fermer le chat",
      leadPrompt: "Laissez vos coordonnées et les détails de votre demande.",
      leadMissing: "Merci de compléter tous les champs du formulaire.",
      lead: { name: "Nom", company: "Entreprise", email: "Email", phone: "Téléphone", details: "Détails de la demande" },
    },
    es: {
      welcome: "Hola, soy Olivia. Puedo ayudarle con su solicitud.",
      online: "Concierge disponible",
      inactive: "Concierge inactivo",
      placeholder: "Escriba su pregunta...",
      send: "Enviar",
      loading: "Un momento...",
      error: "Tengo un problema temporal. Puede intentarlo de nuevo en unos instantes?",
      consent: "He leído y acepto el Aviso de Privacidad para recibir atención.",
      privacy: "Ver aviso",
      privacyTitle: "Aviso de Privacidad - Olivia AI",
      privacyBody: "Al usar este chat autorizas al establecimiento correspondiente a tratar los datos personales que compartas, incluyendo mensajes, datos de contacto, idioma, página visitada e información de tu solicitud, con la finalidad de atenderte, dar seguimiento y contactarte por medios electrónicos. Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición, revocar tu consentimiento o limitar el uso de tus datos ante el responsable indicado en el aviso de privacidad del sitio.",
      privacyAccept: "He leído y acepto",
      open: "Abrir chat",
      close: "Cerrar chat",
      leadPrompt: "Déjenos sus datos y los detalles de su solicitud.",
      leadMissing: "Complete todos los campos del formulario.",
      lead: { name: "Nombre", company: "Empresa", email: "Email", phone: "Teléfono", details: "Detalles de la solicitud" },
    },
    en: {
      welcome: "Hello, I am Olivia. I can help with your request.",
      online: "Concierge available",
      inactive: "Concierge inactive",
      placeholder: "Ask your question...",
      send: "Send",
      loading: "One moment...",
      error: "I am having a temporary issue. Please try again in a moment.",
      consent: "I have read and accept the Privacy Notice to receive assistance.",
      privacy: "View notice",
      privacyTitle: "Privacy Notice - Olivia AI",
      privacyBody: "By using this chat, you authorize the relevant site owner to process the personal data you provide, including messages, contact details, language, visited page and request information, to answer your request, follow up and contact you by electronic means. You may exercise access, rectification, cancellation and opposition rights, revoke consent or limit data use with the controller identified in the site’s privacy notice.",
      privacyAccept: "I have read and accept",
      open: "Open chat",
      close: "Close chat",
      leadPrompt: "Please leave your contact details and request information.",
      leadMissing: "Please complete all form fields.",
      lead: { name: "Name", company: "Company", email: "Email", phone: "Phone", details: "Request info details" },
    },
    zh: {
      welcome: "您好，我是 Olivia，可以协助您处理咨询。",
      online: "在线服务",
      inactive: "暂时离开",
      placeholder: "请输入您的问题...",
      send: "发送",
      loading: "请稍等...",
      error: "暂时出现问题，请稍后再试。",
      consent: "我已阅读并接受隐私声明，以便获得协助。",
      privacy: "查看声明",
      privacyTitle: "Olivia AI 隐私声明",
      privacyBody: "使用本聊天即表示您授权相关网站负责人处理您提供的个人数据，包括消息、联系方式、语言、访问页面和请求信息，用于回复、跟进并通过电子方式联系您。您可以根据网站隐私声明中列明的负责人行使访问、更正、取消和反对权利，撤回同意或限制数据使用。",
      privacyAccept: "我已阅读并接受",
      open: "打开聊天",
      close: "关闭聊天",
      leadPrompt: "请留下联系方式和需求详情。",
      leadMissing: "请填写表单中的所有字段。",
      lead: { name: "姓名", company: "公司", email: "Email", phone: "电话", details: "需求详情" },
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
  const [attachments, setAttachments] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [leadForm, setLeadForm] = useState(null);
  const [leadData, setLeadData] = useState({ name: "", company: "", email: "", phone: "", details: "" });
  const [hasConsent, setHasConsent] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const visitorId = useRef("");
  const receivedIds = useRef(new Set());
  const copy = getCopy(clientId, language);

  useEffect(() => {
    let timer;
    const markActive = () => {
      setIsActive(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIsActive(false), 45000);
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, markActive, { passive: true }));
    markActive();
    return () => {
      window.clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, markActive));
    };
  }, []);

  useEffect(() => {
    const detectedLanguage = getPageLanguage();
    const savedConsent = window.localStorage.getItem(`oliviaConsent:${clientId}`) === "accepted";
    setHasConsent(savedConsent);
    setLanguage(detectedLanguage);
    setMetadata((prev) => ({
      ...prev,
      language: detectedLanguage,
      pageUrl: window.location.href,
      pageTitle: document.title,
      pageContent: document.body.innerText.replace(/\s+/g, " ").slice(0, 5000),
      dataConsent: savedConsent,
      dataConsentAt: savedConsent ? window.localStorage.getItem(`oliviaConsentAt:${clientId}`) : undefined,
    }));
    setMessages([{ role: "assistant", content: getCopy(clientId, detectedLanguage).welcome }]);
  }, [clientId]);

  useEffect(() => {
    if (!hasConsent) return undefined;
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
            ...incoming.map((message) => ({
              role: "assistant",
              content: message.content,
              attachment: message.metadata?.attachment,
            })),
          ]);
        }
      } catch {}
    };
    const timer = window.setInterval(poll, 4000);
    return () => window.clearInterval(timer);
  }, [clientId, hasConsent]);

  const handleSend = async (overrideMessage = "") => {
    const leadMode = Boolean(leadForm);
    const requiredLeadFields =
      Array.isArray(leadForm?.required) && leadForm.required.length
        ? leadForm.required
        : ["name", "email", "phone", "details"];
    const leadComplete =
      !leadMode ||
      requiredLeadFields.every((key) => String(leadData[key] || "").trim());
    const message = (overrideMessage || input || (leadMode ? leadData.details : "") || (attachments.length ? "Analyse ce fichier." : "")).trim();
    if (!message || isLoading || !hasConsent) return;
    if (!leadComplete) {
      setMessages((prev) => [...prev, { role: "assistant", content: copy.leadMissing || siteCopy.default[language].leadMissing }]);
      return;
    }

    const conversationHistory = messages
      .filter(
        (item) =>
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string" &&
          item.content.trim(),
      )
      .slice(-12)
      .map((item) => ({ role: item.role, content: item.content.trim() }));

    const sentAttachments = attachments;
    if (!overrideMessage) {
      setInput("");
      setAttachments([]);
    }
    setMessages((prev) => [...prev, { role: "user", content: message, attachments: sentAttachments }]);
    setIsLoading(true);

    try {
      const messageMetadata = leadMode
        ? {
            ...metadata,
            lead: {
              ...(metadata.lead || {}),
              name: leadData.name.trim(),
              company: leadData.company.trim(),
              email: leadData.email.trim(),
              phone: leadData.phone.trim(),
              details: leadData.details.trim(),
            },
          }
        : metadata;
      let storedConversation = null;
      try {
        storedConversation = await persistConversationMessage({
          clientCode: clientId,
          visitorId: visitorId.current,
          content: message,
          metadata: messageMetadata,
          source: "website",
          visitorName: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
        });
      } catch {}

      if (storedConversation?.conversation?.status === "manual") {
        return;
      }

      const data = await sendMessage({
        clientId,
        visitorId: visitorId.current,
        message,
        metadata: messageMetadata,
        history: conversationHistory,
        attachments: sentAttachments,
      });
      const assistantContent = getAssistantText(data);

      const returnedBookingState = data?.bookingDraft || data?.collected;
      const bookingIsActive =
        data?.intent === "booking" ||
        data?.mode === "booking" ||
        data?.phase === "booking_intake" ||
        data?.phase === "availability_check";
      if (bookingIsActive && returnedBookingState) {
        const knownBookingFields = Object.fromEntries(
          Object.entries(returnedBookingState).filter(
            ([, value]) => value !== null && value !== undefined && String(value).trim() !== "",
          ),
        );
        setMetadata((prev) => ({
          ...prev,
          bookingDraft: {
            ...(prev.bookingDraft || {}),
            active: true,
            ...knownBookingFields,
          },
        }));
      }

      if (data?.action === "show_lead_form" || data?.leadForm) {
        setLeadForm(data.leadForm || { detailsRows: 3 });
        setLeadData((prev) => ({ ...prev, details: prev.details || data?.leadForm?.initialDetails || message }));
      } else if (leadMode) {
        setLeadForm(null);
      }

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
            className="mb-4 flex h-[min(720px,calc(100vh-7rem))] w-[430px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[28px] border border-white/40 bg-[#fffdf8]/95 shadow-[0_38px_95px_-32px_rgba(20,16,10,0.72),0_16px_34px_-24px_rgba(20,16,10,0.6),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl [transform:perspective(1200px)_rotateX(.5deg)_rotateY(-.6deg)]"
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
                    <p className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs text-white/80">
                      <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.14),0_0_14px_rgba(52,211,153,.8)]" : "bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,.14),0_0_14px_rgba(251,191,36,.75)]"}`} />
                      {isActive ? copy.online : (copy.inactive || "Inactive")}
                    </p>
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
                  {msg.attachment?.dataUrl && (
                    <a
                      href={msg.attachment.dataUrl}
                      download={msg.attachment.name}
                      className="mt-2 block font-semibold underline underline-offset-2"
                    >
                      {msg.attachment.name}
                    </a>
                  )}
                  {msg.attachments?.map((attachment) => (
                    <span key={attachment.name} className="mt-2 block text-xs font-semibold">
                      📎 {attachment.name}
                    </span>
                  ))}
                </MessageBubble>
              ))}
              {copy.actions?.length ? (
                <div className="grid grid-cols-2 gap-2">
                  {copy.actions.map(([label, prompt]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      disabled={!hasConsent || isLoading}
                      className="rounded-lg border border-[#8a754f] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#2b2b2b] transition hover:bg-[#efe4cd] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
              {isLoading && <MessageBubble role="assistant">{copy.loading}</MessageBubble>}
            </div>

            <div className="space-y-3 border-t border-[#ded7c9] bg-[#fffdf8] p-3">
              <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-[#f7f2e9] p-3 text-xs leading-5 text-[#5f5546]">
                <input
                  type="checkbox"
                  checked={hasConsent}
                  onChange={(event) => {
                    const accepted = event.target.checked;
                    const acceptedAt = accepted ? new Date().toISOString() : "";
                    setHasConsent(accepted);
                    setMetadata((prev) => ({
                      ...prev,
                      dataConsent: accepted,
                      dataConsentAt: acceptedAt || undefined,
                      consentVersion: `${clientId}-privacy-chat-2026-07-01`,
                    }));
                    if (accepted) {
                      window.localStorage.setItem(`oliviaConsent:${clientId}`, "accepted");
                      window.localStorage.setItem(`oliviaConsentAt:${clientId}`, acceptedAt);
                    } else {
                      window.localStorage.removeItem(`oliviaConsent:${clientId}`);
                      window.localStorage.removeItem(`oliviaConsentAt:${clientId}`);
                    }
                  }}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#2b2b2b]"
                />
                <span>
                  {copy.consent || siteCopy.default[language].consent}{" "}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      setShowPrivacy(true);
                    }}
                    className="font-semibold text-[#2b2b2b] underline underline-offset-2"
                  >
                    {copy.privacy || siteCopy.default[language].privacy}
                  </button>
                </span>
              </label>
              {leadForm && (
                <div className="rounded-xl border border-[#ded7c9] bg-[#f9f5ee] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-[#786b55]">
                    {copy.leadPrompt || siteCopy.default[language].leadPrompt}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {["name", "company", "email", "phone"].map((key) => (
                      <input
                        key={key}
                        type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                        value={leadData[key] || ""}
                        placeholder={leadForm.labels?.[key] || copy.lead?.[key] || key}
                        onChange={(event) => setLeadData((prev) => ({ ...prev, [key]: event.target.value }))}
                        className="h-10 rounded-lg border border-[#ded7c9] bg-white px-3 text-sm text-[#2b2b2b] outline-none ring-[#c8aa70] placeholder:text-[#9b907d] focus:ring-2"
                      />
                    ))}
                    <textarea
                      value={leadData.details || ""}
                      rows={leadForm.detailsRows || 3}
                      placeholder={leadForm.labels?.details || copy.lead?.details || "Details"}
                      onChange={(event) => setLeadData((prev) => ({ ...prev, details: event.target.value }))}
                      className="min-h-[82px] rounded-lg border border-[#ded7c9] bg-white px-3 py-2 text-sm text-[#2b2b2b] outline-none ring-[#c8aa70] placeholder:text-[#9b907d] focus:ring-2 sm:col-span-2"
                    />
                  </div>
                </div>
              )}
              <DynamicFields metadata={metadata} setMetadata={setMetadata} language={language} />
              <div className="flex items-end gap-2">
                <label className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#ded7c9] bg-white text-[#5f5546] hover:bg-[#f7f2e9]">
                  <Paperclip className="h-4 w-4" />
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                    className="hidden"
                    onChange={async (event) => {
                      const files = Array.from(event.target.files || []).slice(0, 3);
                      const valid = files.filter((file) => file.size <= 8 * 1024 * 1024);
                      const encoded = await Promise.all(valid.map((file) => new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve({ name: file.name, mimeType: file.type, dataUrl: reader.result });
                        reader.readAsDataURL(file);
                      })));
                      setAttachments(encoded);
                      event.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  aria-label="Dicter un message"
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#ded7c9] ${isListening ? "bg-red-100 text-red-700" : "bg-white text-[#5f5546]"}`}
                  onClick={() => {
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    if (!SpeechRecognition) return;
                    const recognition = new SpeechRecognition();
                    recognition.lang = language === "fr" ? "fr-FR" : language === "en" ? "en-US" : "es-MX";
                    recognition.interimResults = false;
                    recognition.onstart = () => setIsListening(true);
                    recognition.onend = () => setIsListening(false);
                    recognition.onerror = () => setIsListening(false);
                    recognition.onresult = (event) => setInput((value) => `${value} ${event.results[0][0].transcript}`.trim());
                    recognition.start();
                  }}
                >
                  <Mic className="h-4 w-4" />
                </button>
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
                  disabled={isLoading || !hasConsent}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2b2b2b] text-white shadow-[0_16px_32px_-22px_rgba(0,0,0,0.75)] transition hover:bg-[#3a352d] disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs text-[#5f5546]">
                  {attachments.map((attachment) => (
                    <button key={attachment.name} type="button" onClick={() => setAttachments((items) => items.filter((item) => item !== attachment))} className="rounded-full bg-[#efe4cd] px-3 py-1">
                      {attachment.name} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={copy.privacyTitle || siteCopy.default[language].privacyTitle}
          >
            <motion.div
              initial={{ y: 12, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: 0.98 }}
              className="relative max-w-xl rounded-2xl border border-[#c8aa70] bg-[#fffdf8] p-6 text-[#2b2b2b] shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setShowPrivacy(false)}
                className="absolute right-3 top-3 rounded-full p-2 text-[#2b2b2b] hover:bg-[#f0eadf]"
                aria-label={copy.close}
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="pr-8 text-lg font-semibold">{copy.privacyTitle || siteCopy.default[language].privacyTitle}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5f5546]">{copy.privacyBody || siteCopy.default[language].privacyBody}</p>
              <button
                type="button"
                onClick={() => {
                  const acceptedAt = new Date().toISOString();
                  setHasConsent(true);
                  setMetadata((prev) => ({
                    ...prev,
                    dataConsent: true,
                    dataConsentAt: acceptedAt,
                    consentVersion: `${clientId}-privacy-chat-2026-07-01`,
                  }));
                  window.localStorage.setItem(`oliviaConsent:${clientId}`, "accepted");
                  window.localStorage.setItem(`oliviaConsentAt:${clientId}`, acceptedAt);
                  setShowPrivacy(false);
                }}
                className="mt-5 rounded-xl bg-[#2b2b2b] px-4 py-2 text-sm font-semibold text-white"
              >
                {copy.privacyAccept || siteCopy.default[language].privacyAccept}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        aria-label={isOpen ? copy.close : copy.open}
        onClick={() => setIsOpen((v) => !v)}
        className="ml-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#3d3932] to-[#171512] text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(255,255,255,.18)] ring-1 ring-[#c8aa70]/45 transition hover:-translate-y-0.5 hover:scale-[1.04]"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
