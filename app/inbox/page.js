"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AtSign,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  Inbox,
  ExternalLink,
  LayoutDashboard,
  Mail,
  MessageCircle,
  MessageSquareText,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag,
  UserRound,
  UsersRound,
  Wand2,
  Zap,
} from "lucide-react";
import { SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import { clients } from "@/config/clients";

const clientSkins = Object.fromEntries(
  Object.entries(clients).map(([clientCode, client]) => [
    clientCode,
    {
      label: client.clientName,
      siteUrl: client.siteUrl,
      ...client.skin,
    },
  ])
);

const translations = {
  fr: {
    nav: ["Boîte de réception", "Automatisations IA", "Clients", "Statistiques", "Copilote IA"],
    settings: "Paramètres et sécurité",
    views: ["Non assigné", "Ouvert", "Résolue"],
    statuses: { manual: "Manuel", ai: "IA", solved: "Résolue" },
    you: "Vous",
    back: "Retour à l’Inbox",
    conversations: "Conversations",
    open: "Ouvertes",
    aiManaged: "Gérées par l’IA",
    manualManaged: "Reprises manuellement",
    visitors: "clients et visiteurs",
    analyticsText: "Reliez la propriété GA4 de chaque site pour comparer trafic, ouvertures du chat et demandes de réservation.",
    connected: "Connecté",
    connect: "À connecter",
    configure: "À configurer",
    openAnalytics: "Ouvrir Google Analytics",
    gaRequired: "Configuration serveur requise : GA4_PROPERTY_ID et compte de service Google.",
    automations: [
      ["Réponse automatique", "L’IA répond aux nouvelles conversations tant qu’un opérateur ne prend pas la main."],
      ["Collecte de réservation", "Dates, nombre de voyageurs, catégorie, nom, email et téléphone."],
      ["Escalade humaine", "Transfert immédiat lorsqu’un visiteur demande explicitement une personne."],
      ["Consentement données", "Le widget bloque l’envoi tant que le visiteur n’a pas accepté le partage."],
    ],
    aiBrief: "Brief opérationnel IA",
    aiBriefText: "Résume les conversations récentes, intentions, urgence et informations manquantes.",
    aiProvider: "Moteur IA",
    aiProviderText: "Copilot utilise Hugging Face pour analyser les conversations de tous les clients Olivia AI.",
    suggestedReply: "Réponse suggérée",
    missingInformation: "Informations manquantes",
    intent: "Intention",
    urgency: "Urgence",
    sentiment: "Sentiment",
    tags: "Étiquettes",
    notConfigured: "Hugging Face n’est pas configuré.",
    analyzing: "Analyse en cours…",
    analyze: "Analyser maintenant",
    accountSecurity: "Compte et sécurité",
    accountText: "Gérez votre email, vos sessions et activez l’authentification à deux facteurs dans votre profil Clerk.",
    openProfile: "Ouvrir mon profil sécurisé",
    primaryNav: "Navigation principale",
    allClients: "tous-les-clients",
    liveAuto: "Actualisation auto",
    syncing: "Synchronisation…",
    liveConversations: "Conversations en direct",
    tickets: "Tickets",
    ticketsText: "Messages de la boîte mail ou du widget hors ligne",
    connectMailbox: "Connecter la boîte mail",
    savedViews: "Vues",
    socialChannels: "Réseaux sociaux",
    socialChannelsText: "Connectez WhatsApp, Facebook Messenger et Instagram pour centraliser les messages dans Olivia AI.",
    connectSocialChannels: "Configuration Meta",
    webhookUrl: "URL webhook",
    metaSetupTitle: "Connexion réelle Meta",
    metaSetupText: "La connexion se fait site par site dans Meta Business/Developers : Olivia reçoit les webhooks Meta, puis route chaque compte vers ce client avec META_CHANNEL_CLIENTS.",
    metaSetupSteps: [
      "Créer ou ouvrir l’app Meta Business.",
      "Ajouter les produits WhatsApp, Messenger et/ou Instagram Messaging.",
      "Coller l’URL webhook Olivia ci-dessous dans la configuration Meta.",
      "Utiliser le verify token stocké dans Vercel, puis s’abonner aux événements messages.",
      "Ajouter les IDs Meta dans META_CHANNEL_CLIENTS pour router vers ce client.",
    ],
    openMetaDevelopers: "Ouvrir Meta Developers",
    openMetaBusiness: "Ouvrir Meta Business",
    requiredVariables: "Variables requises",
    clientMapping: "Mapping client",
    currentClient: "Client actuel",
    search: "Rechercher dans l’Inbox…",
    all: "Toutes",
    emptyView: "La vue choisie est vide. Affichage de toutes les conversations en direct.",
    loading: "Chargement Railway…",
    railwayError: "Erreur Railway. Consultez les logs Vercel.",
    noConversation: "Aucune conversation dans cette vue.",
    noConversationTitle: "Aucune conversation",
    loadConversations: "Chargement des conversations Railway…",
    loadFailed: "Impossible de charger les conversations Railway.",
    sendFirstMessage: "Envoyez un message depuis le widget pour créer la première conversation.",
    client: "Client",
    solve: "Résoudre",
    returnAi: "Rendre à l’IA",
    takeover: "Prendre la main",
    conversationFrom: "Conversation reçue depuis le site",
    manualPaused: "La réponse IA est suspendue en mode manuel.",
    waiting: "Dashboard actif. En attente d’une conversation reçue depuis le widget.",
    liveChat: "Chat en direct",
    writeReply: "Écrire une réponse au client…",
    takeoverToReply: "Prenez la main pour répondre au client",
    reply: "Répondre",
    info: "Informations",
    viewedPages: "Pages consultées",
    notes: "Notes",
    customerData: "Données client",
    addTag: "Ajouter une étiquette client",
    bookingContext: "Contexte",
    lastViewed: "Dernière page consultée",
    seeHistory: "Voir l’historique",
    tools: { suggest: "Suggérer une réponse avec l’IA", greeting: "Insérer un message d’accueil", quick: "Insérer une réponse rapide", focus: "Placer le curseur dans la réponse", attach: "Ajouter une pièce jointe" },
    greetingText: "Bonjour, merci pour votre message. Comment puis-je vous aider ?",
    quickText: "Merci. Je vérifie ces informations et je reviens vers vous rapidement.",
    attachment: "Pièce jointe",
    attachmentTooLarge: "Le fichier dépasse la limite de 2 Mo.",
    logout: "Se déconnecter",
  },
  en: {
    nav: ["Inbox", "AI automations", "Customers", "Analytics", "AI copilot"],
    settings: "Settings and security",
    views: ["Unassigned", "Open", "Solved"],
    statuses: { manual: "Manual", ai: "AI", solved: "Solved" },
    you: "You",
    back: "Back to Inbox",
    conversations: "Conversations", open: "Open", aiManaged: "Handled by AI", manualManaged: "Handled manually",
    visitors: "customers and visitors",
    analyticsText: "Connect each website’s GA4 property to compare traffic, chat opens and booking requests.",
    connected: "Connected", connect: "Connect", configure: "Needs setup", openAnalytics: "Open Google Analytics",
    gaRequired: "Server setup required: GA4_PROPERTY_ID and a Google service account.",
    automations: [["Automatic replies", "AI answers new conversations until an operator takes over."], ["Booking details", "Dates, guests, category, name, email and phone."], ["Human escalation", "Immediate transfer when a visitor explicitly asks for a person."], ["Data consent", "The widget blocks sending until the visitor accepts data sharing."]],
    aiBrief: "AI operational brief", aiBriefText: "Summarizes recent conversations, intent, urgency and missing information.", aiProvider: "AI engine", aiProviderText: "Copilot uses Hugging Face to analyze conversations across all Olivia AI clients.", suggestedReply: "Suggested reply", missingInformation: "Missing information", intent: "Intent", urgency: "Urgency", sentiment: "Sentiment", tags: "Tags", notConfigured: "Hugging Face is not configured.", analyzing: "Analyzing…", analyze: "Analyze now",
    accountSecurity: "Account and security", accountText: "Manage your email and sessions, and enable two-factor authentication in your Clerk profile.", openProfile: "Open secure profile",
    primaryNav: "Main navigation", allClients: "all-clients", liveAuto: "Live auto", syncing: "Syncing…", liveConversations: "Live conversations",
    tickets: "Tickets", ticketsText: "Messages from mailbox or offline chat widget", connectMailbox: "Connect mailbox", savedViews: "Views", socialChannels: "Social channels", socialChannelsText: "Connect WhatsApp, Facebook Messenger and Instagram to centralize messages in Olivia AI.", connectSocialChannels: "Meta setup", webhookUrl: "Webhook URL", metaSetupTitle: "Real Meta connection", metaSetupText: "Connection is done site by site in Meta Business/Developers: Olivia receives Meta webhooks, then routes each account to this client with META_CHANNEL_CLIENTS.", metaSetupSteps: ["Create or open the Meta Business app.", "Add WhatsApp, Messenger and/or Instagram Messaging products.", "Paste the Olivia webhook URL below into Meta configuration.", "Use the verify token stored in Vercel, then subscribe to message events.", "Add Meta IDs to META_CHANNEL_CLIENTS to route to this client."], openMetaDevelopers: "Open Meta Developers", openMetaBusiness: "Open Meta Business", requiredVariables: "Required variables", clientMapping: "Client mapping", currentClient: "Current client",
    search: "Search in Inbox…", all: "All", emptyView: "The selected view is empty. Showing all live conversations.", loading: "Loading Railway…",
    railwayError: "Railway error. Check Vercel logs.", noConversation: "No conversations in this view.", client: "Client", solve: "Solve",
    noConversationTitle: "No conversation", loadConversations: "Loading Railway conversations…", loadFailed: "Unable to load Railway conversations.",
    sendFirstMessage: "Send a message from the widget to create the first conversation.",
    returnAi: "Return to AI", takeover: "Take over", conversationFrom: "Conversation received from", manualPaused: "AI replies are paused in manual mode.",
    waiting: "Dashboard active. Waiting for a conversation from the widget.", liveChat: "Live chat", writeReply: "Write a reply to the customer…",
    takeoverToReply: "Take over to reply to the customer", reply: "Reply", info: "Info", viewedPages: "Viewed pages", notes: "Notes",
    customerData: "Customer data", addTag: "Add customer tag", bookingContext: "Context", lastViewed: "Last viewed page", seeHistory: "See history",
    tools: { suggest: "Suggest an AI reply", greeting: "Insert a greeting", quick: "Insert a quick reply", focus: "Focus the reply field", attach: "Add an attachment" },
    greetingText: "Hello, thank you for your message. How can I help?",
    quickText: "Thank you. I’ll check this information and get back to you shortly.",
    attachment: "Attachment",
    attachmentTooLarge: "The file exceeds the 2 MB limit.",
    logout: "Sign out",
  },
  es: {
    nav: ["Bandeja de entrada", "Automatizaciones IA", "Clientes", "Estadísticas", "Copiloto IA"],
    settings: "Configuración y seguridad",
    views: ["Sin asignar", "Abiertas", "Resueltas"],
    statuses: { manual: "Manual", ai: "IA", solved: "Resuelta" },
    you: "Tú",
    back: "Volver a la bandeja",
    conversations: "Conversaciones", open: "Abiertas", aiManaged: "Gestionadas por IA", manualManaged: "Gestionadas manualmente",
    visitors: "clientes y visitantes",
    analyticsText: "Conecta la propiedad GA4 de cada sitio para comparar tráfico, aperturas del chat y solicitudes de reserva.",
    connected: "Conectado", connect: "Conectar", configure: "Por configurar", openAnalytics: "Abrir Google Analytics",
    gaRequired: "Configuración del servidor requerida: GA4_PROPERTY_ID y cuenta de servicio de Google.",
    automations: [["Respuesta automática", "La IA responde las conversaciones nuevas hasta que interviene un operador."], ["Datos de reserva", "Fechas, huéspedes, categoría, nombre, email y teléfono."], ["Escalación humana", "Transferencia inmediata cuando el visitante solicita hablar con una persona."], ["Consentimiento de datos", "El widget bloquea el envío hasta que el visitante acepta compartir sus datos."]],
    aiBrief: "Resumen operativo IA", aiBriefText: "Resume conversaciones recientes, intenciones, urgencia e información faltante.", aiProvider: "Motor IA", aiProviderText: "Copilot usa Hugging Face para analizar conversaciones de todos los clientes Olivia AI.", suggestedReply: "Respuesta sugerida", missingInformation: "Información faltante", intent: "Intención", urgency: "Urgencia", sentiment: "Sentimiento", tags: "Etiquetas", notConfigured: "Hugging Face no está configurado.", analyzing: "Analizando…", analyze: "Analizar ahora",
    accountSecurity: "Cuenta y seguridad", accountText: "Gestiona tu email y sesiones, y activa la autenticación de dos factores en tu perfil de Clerk.", openProfile: "Abrir perfil seguro",
    primaryNav: "Navegación principal", allClients: "todos-los-clientes", liveAuto: "Actualización automática", syncing: "Sincronizando…", liveConversations: "Conversaciones en vivo",
    tickets: "Tickets", ticketsText: "Mensajes del correo o del widget fuera de línea", connectMailbox: "Conectar correo", savedViews: "Vistas", socialChannels: "Redes sociales", socialChannelsText: "Conecta WhatsApp, Facebook Messenger e Instagram para centralizar los mensajes en Olivia AI.", connectSocialChannels: "Configuración Meta", webhookUrl: "URL webhook", metaSetupTitle: "Conexión real de Meta", metaSetupText: "La conexión se hace sitio por sitio en Meta Business/Developers: Olivia recibe los webhooks de Meta y enruta cada cuenta a este cliente con META_CHANNEL_CLIENTS.", metaSetupSteps: ["Crear o abrir la app Meta Business.", "Añadir los productos WhatsApp, Messenger y/o Instagram Messaging.", "Pegar la URL webhook de Olivia abajo en la configuración de Meta.", "Usar el verify token guardado en Vercel y suscribirse a eventos de mensajes.", "Añadir los IDs de Meta en META_CHANNEL_CLIENTS para enrutar a este cliente."], openMetaDevelopers: "Abrir Meta Developers", openMetaBusiness: "Abrir Meta Business", requiredVariables: "Variables requeridas", clientMapping: "Mapping cliente", currentClient: "Cliente actual",
    search: "Buscar en la bandeja…", all: "Todas", emptyView: "La vista seleccionada está vacía. Mostrando todas las conversaciones en vivo.", loading: "Cargando Railway…",
    railwayError: "Error de Railway. Revisa los logs de Vercel.", noConversation: "No hay conversaciones en esta vista.", client: "Cliente", solve: "Resolver",
    noConversationTitle: "No hay conversaciones", loadConversations: "Cargando conversaciones de Railway…", loadFailed: "No se pudieron cargar las conversaciones de Railway.",
    sendFirstMessage: "Envía un mensaje desde el widget para crear la primera conversación.",
    returnAi: "Devolver a la IA", takeover: "Tomar control", conversationFrom: "Conversación recibida desde", manualPaused: "Las respuestas de IA están pausadas en modo manual.",
    waiting: "Dashboard activo. Esperando una conversación desde el widget.", liveChat: "Chat en vivo", writeReply: "Escribe una respuesta al cliente…",
    takeoverToReply: "Toma el control para responder al cliente", reply: "Responder", info: "Información", viewedPages: "Páginas vistas", notes: "Notas",
    customerData: "Datos del cliente", addTag: "Añadir etiqueta", bookingContext: "Contexto", lastViewed: "Última página vista", seeHistory: "Ver historial",
    tools: { suggest: "Sugerir una respuesta con IA", greeting: "Insertar un saludo", quick: "Insertar una respuesta rápida", focus: "Enfocar el campo de respuesta", attach: "Añadir un archivo" },
    greetingText: "Hola, gracias por tu mensaje. ¿Cómo puedo ayudarte?",
    quickText: "Gracias. Verificaré esta información y te responderé en breve.",
    attachment: "Archivo adjunto",
    attachmentTooLarge: "El archivo supera el límite de 2 MB.",
    logout: "Cerrar sesión",
  },
};

const demoConversations = [
  {
    id: "conv-1024",
    clientCode: "suitesmine",
    guest: "Visiteur site #1024",
    initials: "VS",
    channel: "Site widget",
    view: "my-open",
    status: "manual",
    intent: "Availability",
    lastMessage: "Bonjour, je cherche une suite disponible pour deux nuits.",
    lastSeen: "2m",
    email: "visiteur@example.com",
    phone: "-",
    location: "Website visitor",
    lastViewed: "June 1, 2026, 5:08 PM",
    metadata: {
      clientCode: "suitesmine",
      source: "website",
      page: "/rooms",
      checkIn: "2026-06-12",
      checkOut: "2026-06-14",
      guests: "2",
      roomType: "Suite Deluxe",
    },
    messages: [
      {
        role: "guest",
        content: "Bonjour, je cherche une suite disponible pour deux nuits.",
        time: "5:08 PM",
      },
      {
        role: "system",
        content: "Conversation opened from Suites Mine website widget.",
        time: "5:08 PM",
      },
      {
        role: "system",
        content: "Manual takeover enabled. The AI is paused while an operator replies.",
        time: "5:09 PM",
      },
      {
        role: "operator",
        content: "Bonjour, je reprends la conversation. Je vérifie la disponibilité pour vous.",
        time: "5:09 PM",
      },
    ],
  },
  {
    id: "conv-1023",
    clientCode: "suitesmine",
    guest: "Sheila",
    initials: "S",
    channel: "Live chat",
    view: "my-open",
    status: "ai",
    intent: "Room question",
    lastMessage: "Est-ce que la Suite Deluxe a une terrasse ?",
    lastSeen: "5m",
    email: "sheila@example.com",
    phone: "-",
    location: "Unknown",
    lastViewed: "June 1, 2026, 5:05 PM",
    metadata: {
      clientCode: "suitesmine",
      source: "website",
      page: "/suites",
      checkIn: "-",
      checkOut: "-",
      guests: "1",
      roomType: "-",
    },
    messages: [
      {
        role: "guest",
        content: "Est-ce que la Suite Deluxe a une terrasse ?",
        time: "5:05 PM",
      },
      {
        role: "ai",
        content: "Je peux vérifier cela pour vous. Souhaitez-vous aussi indiquer vos dates ?",
        time: "5:05 PM",
      },
    ],
  },
  {
    id: "conv-1022",
    clientCode: "demo",
    guest: "Veronica Espinosa de los Monteros",
    initials: "VE",
    channel: "Live chat",
    view: "unassigned",
    status: "ai",
    intent: "Réservation",
    lastMessage: "¡Hola! Gracias por su mensaje. El hotel...",
    lastSeen: "13d",
    email: "veronica@example.com",
    phone: "-",
    location: "Mexico",
    lastViewed: "May 19, 2026, 3:25 PM",
    metadata: {
      clientCode: "demo",
      source: "website",
      page: "/booking",
      checkIn: "2026-07-08",
      checkOut: "2026-07-11",
      guests: "2",
      roomType: "Ocean View",
    },
    messages: [
      {
        role: "guest",
        content: "¡Hola! Me interesa reservar una habitación con vista al mar.",
        time: "3:20 PM",
      },
      {
        role: "ai",
        content: "Con gusto. ¿Puede confirmar las fechas y el número de huéspedes?",
        time: "3:21 PM",
      },
    ],
  },
  {
    id: "conv-1021",
    clientCode: "lacaqc",
    guest: "Odette Charabati",
    initials: "OC",
    channel: "Messenger",
    view: "solved",
    status: "solved",
    intent: "Info",
    lastMessage: "Merci, nous avons bien recu votre demande.",
    lastSeen: "16d",
    email: "odette@example.com",
    phone: "-",
    location: "Canada",
    lastViewed: "May 16, 2026, 8:17 AM",
    metadata: {
      clientCode: "lacaqc",
      source: "messenger",
      page: "-",
      checkIn: "2026-08-02",
      checkOut: "2026-08-05",
      guests: "2",
      roomType: "Suite",
    },
    messages: [
      {
        role: "guest",
        content: "Merci, nous avons bien recu votre demande.",
        time: "8:12 AM",
      },
      {
        role: "operator",
        content: "Nous avons bien reçu votre demande.",
        time: "8:13 AM",
      },
    ],
  },
];

function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
}

function formatConversationDate(value, language = "fr") {
  if (!value) return "";
  return new Intl.DateTimeFormat({ fr: "fr-FR", en: "en-US", es: "es-MX" }[language], {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function mapConversation(conversation) {
  const messages = (conversation.messages || []).map((message) => ({
    ...message,
    role: message.role === "visitor" ? "guest" : message.role,
    time: formatTime(message.createdAt),
  }));
  const lastMessage = [...messages].reverse().find((message) => message.role !== "system");
  const guest = conversation.visitor_name || `Visiteur ${conversation.visitor_id.slice(0, 8)}`;
  return {
    id: conversation.id,
    createdAt: conversation.created_at,
    clientCode: conversation.client_code,
    guest,
    initials: guest.slice(0, 2).toUpperCase(),
    channel: conversation.source || "Site widget",
    view: conversation.status === "solved" ? "solved" : "my-open",
    status: conversation.status,
    intent: conversation.metadata?.intent || "-",
    lastMessage: lastMessage?.content || "-",
    lastSeen: formatTime(conversation.updated_at),
    email: conversation.email || "-",
    phone: conversation.phone || "-",
    location: "-",
    lastViewed: conversation.metadata?.page || "-",
    metadata: conversation.metadata || {},
    messages,
  };
}

function formatMetadataValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.map(formatMetadataValue).join(", ");
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, nestedValue]) => `${key}: ${formatMetadataValue(nestedValue)}`)
      .join(" · ");
  }
  return String(value);
}

const getViews = (copy) => [
  { id: "unassigned", label: copy.views[0], icon: "!" },
  { id: "my-open", label: copy.views[1], icon: "[]" },
  { id: "solved", label: copy.views[2], icon: "✓" },
];

function StatusPill({ status, copy }) {
  const config = {
    manual: { label: copy.statuses.manual, className: "bg-[#fff3dc] text-[#8a5200]" },
    ai: { label: copy.statuses.ai, className: "bg-[#e9f8ef] text-[#17623a]" },
    solved: { label: copy.statuses.solved, className: "bg-[#eaf0ff] text-[#3159c9]" },
  }[status] ?? { label: status || "-", className: "bg-[#eef3ff] text-[#536079]" };

  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function MessageBlock({ message, guest, skin, copy }) {
  if (message.role === "system") {
    return (
      <p className="mx-auto max-w-2xl text-center text-sm italic leading-6 text-[#66718a]">
        {message.content}
      </p>
    );
  }

  const isGuest = message.role === "guest";
  const isAi = message.role === "ai";
  const operatorDisplayContent = isGuest ? message.metadata?.operatorDisplayContent : "";
  const hasOperatorTranslation =
    isGuest &&
    operatorDisplayContent &&
    operatorDisplayContent !== message.content;
  const visibleContent = hasOperatorTranslation ? operatorDisplayContent : message.content;

  return (
    <div className={`flex gap-3 ${isGuest ? "justify-start" : "justify-end"}`}>
      {isGuest && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dbe3f4] text-sm font-semibold text-[#60708e]">
          {guest.initials}
        </div>
      )}
      <div className={`max-w-[720px] ${isGuest ? "" : "text-right"}`}>
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#172033]">
          <span>{isGuest ? guest.guest : isAi ? "O7 IA" : copy.you}</span>
          <span className="font-normal text-[#758198]">{message.time}</span>
        </div>
        <div
          className={`whitespace-pre-line rounded-md px-4 py-3 text-sm leading-6 shadow-sm ${
            isGuest
              ? "border border-[#dce3f1] bg-white"
              : isAi
                ? "border border-[#cfe9da] bg-[#f0fbf5] text-[#173d2a]"
                : "text-white"
          }`}
          style={!isGuest && !isAi ? { background: skin.operator } : undefined}
        >
          {visibleContent}
        </div>
        {hasOperatorTranslation && (
          <div className="mt-2 rounded-md border border-dashed border-[#d8e0ef] bg-[#f8fafc] px-3 py-2 text-xs leading-5 text-[#66718a]">
            Original: {message.content}
          </div>
        )}
        {message.metadata?.attachment?.dataUrl && (
          <a
            href={message.metadata.attachment.dataUrl}
            download={message.metadata.attachment.name}
            className="mt-2 inline-flex items-center gap-2 rounded-md border border-[#d8e0ef] bg-white px-3 py-2 text-sm font-medium text-[#3159c9]"
          >
            <Paperclip className="h-4 w-4" />
            {message.metadata.attachment.name}
          </a>
        )}
      </div>
    </div>
  );
}

const getNavigationItems = (copy) => [
  { id: "inbox", label: copy.nav[0], icon: Inbox },
  { id: "automation", label: copy.nav[1], icon: Bot },
  { id: "customers", label: copy.nav[2], icon: UsersRound },
  { id: "analytics", label: copy.nav[3], icon: LayoutDashboard },
  { id: "copilot", label: copy.nav[4], icon: Sparkles },
];

function WorkspacePanel({ section, conversations, integrations, onClose, copy, language, scopedClientCode }) {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const open = conversations.filter((item) => item.status !== "solved");
  const manual = conversations.filter((item) => item.status === "manual");
  const ai = conversations.filter((item) => item.status === "ai");
  const uniqueVisitors = new Map(conversations.map((item) => [item.guest, item]));
  const title = getNavigationItems(copy).find((item) => item.id === section)?.label || copy.settings;
  const copilotConfigured = Boolean(integrations?.huggingFace?.configured);
  const copilotModel = integrations?.huggingFace?.model || "openai/gpt-oss-20b:fastest";
  const currentClientCode = scopedClientCode || "default";
  const currentClientSkin = clientSkins[currentClientCode] || clientSkins.default;
  const metaMappingExample = JSON.stringify(
    {
      [`WHATSAPP_PHONE_NUMBER_ID_${currentClientCode}`]: currentClientCode,
      [`FACEBOOK_PAGE_ID_${currentClientCode}`]: currentClientCode,
      [`INSTAGRAM_ACCOUNT_ID_${currentClientCode}`]: currentClientCode,
    },
    null,
    2
  );

  const runAnalysis = async () => {
    const transcript = conversations
      .slice(0, 20)
      .flatMap((conversation) =>
        conversation.messages.map((message) => `${message.role}: ${message.content}`)
      )
      .join("\n");
    if (!transcript) return;
    setAnalyzing(true);
    try {
      const response = await fetch("/api/dashboard/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, language }),
      });
      const data = await response.json();
      setAnalysis(data.analysis || { summary: data.error || copy.notConfigured });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7f9fd]">
      <header className="flex h-[72px] items-center justify-between border-b border-[#dde4f1] bg-white px-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#66718a]">O7 Console</p>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <button onClick={onClose} className="rounded-md border border-[#d8e0ef] px-3 py-2 text-sm font-medium">
          {copy.back}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-7">
        {section === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[
                [copy.conversations, conversations.length],
                [copy.open, open.length],
                [copy.aiManaged, ai.length],
                [copy.manualManaged, manual.length],
              ].map(([label, value]) => (
                <article key={label} className="rounded-xl border border-[#dde4f1] bg-white p-5">
                  <p className="text-sm text-[#66718a]">{label}</p>
                  <p className="mt-2 text-3xl font-semibold">{value}</p>
                </article>
              ))}
            </div>
            <article className="rounded-xl border border-[#dde4f1] bg-white p-6">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold"><BarChart3 className="h-5 w-5" /> Google Analytics 4</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66718a]">
                    {copy.analyticsText}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${integrations?.analytics?.configured ? "bg-[#e9f8ef] text-[#17623a]" : "bg-[#fff3dc] text-[#8a5200]"}`}>
                  {integrations?.analytics?.configured ? copy.connected : copy.connect}
                </span>
              </div>
              <a href="https://analytics.google.com/" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#3159c9] px-4 py-2 text-sm font-semibold text-white">
                {copy.openAnalytics} <ExternalLink className="h-4 w-4" />
              </a>
              {!integrations?.analytics?.configured && (
                <p className="mt-4 text-xs text-[#66718a]">{copy.gaRequired}</p>
              )}
            </article>
          </div>
        )}

        {section === "customers" && (
          <div className="overflow-hidden rounded-xl border border-[#dde4f1] bg-white">
            <div className="border-b border-[#e8edf5] p-5">
              <h2 className="text-lg font-semibold">{uniqueVisitors.size} {copy.visitors}</h2>
            </div>
            {[...uniqueVisitors.values()].map((visitor) => (
              <div key={visitor.guest} className="grid grid-cols-[1.4fr_1.5fr_1fr_1fr] gap-4 border-b border-[#eef1f6] px-5 py-4 text-sm last:border-0">
                <span className="font-medium">{visitor.guest}</span>
                <span className="truncate text-[#66718a]">{visitor.email}</span>
                <span className="text-[#66718a]">{visitor.phone}</span>
                <StatusPill status={visitor.status} copy={copy} />
              </div>
            ))}
          </div>
        )}

        {section === "automation" && (
          <div className="grid max-w-4xl grid-cols-2 gap-5">
            {copy.automations.map(([name, description]) => (
              <article key={name} className="rounded-xl border border-[#dde4f1] bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{name}</h2>
                  <span className="h-6 w-11 rounded-full bg-[#3159c9] p-1"><span className="block h-4 w-4 translate-x-5 rounded-full bg-white" /></span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#66718a]">{description}</p>
              </article>
            ))}
          </div>
        )}

        {section === "copilot" && (
          <div className="max-w-4xl space-y-5">
            <article className="rounded-xl border border-[#dde4f1] bg-white p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="h-5 w-5 text-[#3159c9]" /> {copy.aiBrief}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#66718a]">{copy.aiBriefText}</p>
                </div>
                <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${copilotConfigured ? "bg-[#e9f8ef] text-[#17623a]" : "bg-[#fff3dc] text-[#8a5200]"}`}>
                  {copilotConfigured ? copy.connected : copy.configure}
                </span>
              </div>
              <div className="mt-5 rounded-lg border border-[#e6ebf4] bg-[#f8faff] p-4">
                <p className="text-sm font-semibold">{copy.aiProvider}: Hugging Face</p>
                <p className="mt-1 text-xs leading-5 text-[#66718a]">{copy.aiProviderText}</p>
                <p className="mt-2 text-xs text-[#66718a]">Model: {copilotModel}</p>
              </div>
              <button disabled={analyzing || !conversations.length || !copilotConfigured} onClick={runAnalysis} className="mt-5 rounded-md bg-[#3159c9] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {analyzing ? copy.analyzing : copy.analyze}
              </button>
              {!copilotConfigured && <p className="mt-3 text-xs text-[#8a5200]">{copy.notConfigured}</p>}
            </article>
            {analysis && (
              <article className="rounded-xl border border-[#dde4f1] bg-white p-6">
                <h3 className="text-base font-semibold">{analysis.summary || copy.aiBrief}</h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    [copy.intent, analysis.intent],
                    [copy.urgency, analysis.urgency],
                    [copy.sentiment, analysis.sentiment],
                  ].map(([label, value]) => value ? (
                    <div key={label} className="rounded-lg bg-[#f4f7fc] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#66718a]">{label}</p>
                      <p className="mt-1 text-sm font-semibold">{value}</p>
                    </div>
                  ) : null)}
                </div>
                {analysis.suggestedReply && (
                  <div className="mt-5 rounded-lg bg-[#edf8f1] p-4 text-sm leading-6 text-[#18452b]">
                    <p className="mb-2 font-semibold">{copy.suggestedReply}</p>
                    {analysis.suggestedReply}
                  </div>
                )}
                {Array.isArray(analysis.missingInformation) && analysis.missingInformation.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-semibold">{copy.missingInformation}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#66718a]">
                      {analysis.missingInformation.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {Array.isArray(analysis.tags) && analysis.tags.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {analysis.tags.map((tag) => <span key={tag} className="rounded-full bg-[#eef3ff] px-3 py-1 text-xs font-semibold text-[#3159c9]">{tag}</span>)}
                  </div>
                )}
              </article>
            )}
          </div>
        )}

        {section === "settings" && (
          <div className="grid min-h-full max-w-4xl grid-cols-2 content-start gap-5">
            <article className="rounded-xl border border-[#dde4f1] bg-white p-6">
              <ShieldCheck className="h-6 w-6 text-[#3159c9]" />
              <h2 className="mt-4 text-lg font-semibold">{copy.accountSecurity}</h2>
              <p className="mt-2 text-sm leading-6 text-[#66718a]">{copy.accountText}</p>
              <div className="mt-5 flex items-center gap-3"><UserButton userProfileMode="modal" showName /><span className="text-sm">{copy.openProfile}</span></div>
            </article>
            <article className="rounded-xl border border-[#dde4f1] bg-white p-6">
              <MessageCircle className="h-6 w-6 text-[#3159c9]" />
              <h2 className="mt-4 text-lg font-semibold">{copy.metaSetupTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-[#66718a]">{copy.metaSetupText}</p>
              <div className="mt-4 rounded-lg border border-[#e6ebf4] bg-white p-3 text-xs leading-5">
                <p className="font-semibold text-[#172033]">{copy.currentClient}</p>
                <p className="mt-1 text-[#66718a]">{currentClientSkin?.label || currentClientCode}</p>
                <p className="text-[#66718a]">{currentClientCode}</p>
                {currentClientSkin?.siteUrl && <p className="text-[#66718a]">{currentClientSkin.siteUrl}</p>}
              </div>
              <div className="mt-4 break-all rounded-lg bg-[#f4f7fc] p-3 text-xs leading-5 text-[#536079]">
                {copy.webhookUrl}: {integrations?.whatsapp?.webhookUrl || "https://olivia-ai.o7digital.com/api/integrations/meta/webhook"}
              </div>
              <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs leading-5 text-[#66718a]">
                {copy.metaSetupSteps.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" className="rounded-md bg-[#3159c9] px-3 py-1.5 text-xs font-semibold text-white">
                  {copy.openMetaDevelopers}
                </a>
                <a href="https://business.facebook.com/settings/" target="_blank" rel="noreferrer" className="rounded-md border border-[#d8e0ef] bg-white px-3 py-1.5 text-xs font-semibold text-[#3159c9]">
                  {copy.openMetaBusiness}
                </a>
              </div>
              <div className="mt-4 grid gap-3 text-xs leading-5 text-[#66718a]">
                <div>
                  <p className="font-semibold text-[#172033]">{copy.requiredVariables}</p>
                  <p className="mt-1 break-all">META_WEBHOOK_VERIFY_TOKEN, META_CHANNEL_CLIENTS, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, META_PAGE_ID, META_PAGE_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID</p>
                </div>
                <div>
                  <p className="font-semibold text-[#172033]">{copy.clientMapping}</p>
                  <pre className="mt-1 overflow-x-auto rounded bg-[#f4f7fc] p-2"><code>{metaMappingExample}</code></pre>
                </div>
              </div>
            </article>
            {["huggingFace", "whatsapp", "facebook", "instagram", "mailbox", "analytics", "database", "clerk", "openai", "cloudbeds"].map((key) => (
              <article key={key} className="rounded-xl border border-[#dde4f1] bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold capitalize">{key === "huggingFace" ? "Hugging Face" : key}</h2>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${integrations?.[key]?.configured ? "bg-[#e9f8ef] text-[#17623a]" : "bg-[#fff3dc] text-[#8a5200]"}`}>
                    {integrations?.[key]?.configured ? copy.connected : copy.configure}
                  </span>
                </div>
                {integrations?.[key]?.model && <p className="mt-2 truncate text-xs text-[#66718a]">{integrations[key].model}</p>}
                {integrations?.[key]?.webhookUrl && (
                  <p className="mt-2 break-all rounded bg-[#f4f7fc] p-2 text-xs leading-5 text-[#66718a]">
                    {copy.webhookUrl}: {integrations[key].webhookUrl}
                  </p>
                )}
              </article>
            ))}
            <div className="col-span-2 mt-auto flex justify-end pt-8">
              <SignOutButton
                redirectUrl={`/sign-in?redirect_url=${encodeURIComponent(
                  scopedClientCode ? `/inbox?client=${scopedClientCode}` : "/inbox"
                )}`}
              >
                <button type="button" className="rounded-md border border-[#d8e0ef] bg-white px-4 py-2 text-sm font-semibold text-[#b42318] hover:bg-[#fff5f4]">
                  {copy.logout}
                </button>
              </SignOutButton>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function InboxPage() {
  const { user } = useUser();
  const role = "admin";
  const appVersionRef = useRef(null);
  const [language, setLanguage] = useState("fr");
  const copy = translations[language];
  const views = useMemo(() => getViews(copy), [copy]);
  const navigationItems = useMemo(() => getNavigationItems(copy), [copy]);
  const [scopedClientCode, setScopedClientCode] = useState(undefined);
  const [conversations, setConversations] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [lastSync, setLastSync] = useState("");
  const [activeSection, setActiveSection] = useState("inbox");
  const [integrations, setIntegrations] = useState(null);
  useEffect(() => {
    setScopedClientCode(new URLSearchParams(window.location.search).get("client")?.trim() || null);
    const savedLanguage = window.localStorage.getItem("oliviaInboxLanguage");
    const browserLanguage = (navigator.language || "fr").slice(0, 2);
    setLanguage(["fr", "en", "es"].includes(savedLanguage) ? savedLanguage : ["fr", "en", "es"].includes(browserLanguage) ? browserLanguage : "fr");
  }, []);
  const loadConversations = useCallback(async () => {
    if (scopedClientCode === undefined) return;
    try {
      const params = new URLSearchParams({ ts: Date.now().toString() });
      if (scopedClientCode) params.set("clientCode", scopedClientCode);
      const response = await fetch(`/api/conversations?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
        headers: {
          "Cache-Control": "no-store",
        },
      });
      console.log("[olivia-inbox] browser load conversations status", response.status);
      if (!response.ok) throw new Error("Unable to load conversations");
      const data = await response.json();
      console.log("[olivia-inbox] browser conversations payload", {
        configured: data.configured,
        count: data.conversations?.length || 0,
      });
      if (!data.configured) throw new Error("Railway is not configured");
      setConversations((data.conversations || []).map(mapConversation));
      setLoadState("ready");
      setLoadError("");
      setLastSync(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (error) {
      setLoadError(error?.message || "Erreur inconnue");
      setLoadState("error");
    }
  }, [scopedClientCode]);

  useEffect(() => {
    loadConversations();
    const timer = window.setInterval(loadConversations, 2000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    let cancelled = false;
    const checkAppVersion = async () => {
      try {
        const response = await fetch(`/api/app-version?ts=${Date.now()}`, {
          cache: "no-store",
          credentials: "include",
          headers: { "Cache-Control": "no-store" },
        });
        if (!response.ok) return;
        const data = await response.json();
        const version = data?.version;
        if (!version || cancelled) return;
        if (!appVersionRef.current) {
          appVersionRef.current = version;
          return;
        }
        if (appVersionRef.current !== version) {
          window.location.reload();
        }
      } catch {
        // Keep the inbox running if the version endpoint is temporarily unavailable.
      }
    };
    checkAppVersion();
    const timer = window.setInterval(checkAppVersion, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (scopedClientCode) params.set("client", scopedClientCode);
    fetch(`/api/integrations/status?${params}`)
      .then((response) => response.json())
      .then(setIntegrations)
      .catch(() => setIntegrations({}));
  }, [scopedClientCode]);

  const visibleConversations = useMemo(
    () =>
      scopedClientCode
        ? conversations.filter((conversation) => conversation.clientCode === scopedClientCode)
        : conversations,
    [conversations, scopedClientCode]
  );
  const initialSelectedId = visibleConversations[0]?.id ?? null;

  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [activeView, setActiveView] = useState("my-open");
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [toolLoading, setToolLoading] = useState(false);
  const replyRef = useRef(null);
  const attachmentRef = useRef(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const activeElement = document.activeElement;
      const isEditing =
        Boolean(draft.trim()) ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "INPUT" ||
        activeElement?.isContentEditable;

      if (!isEditing) {
        window.location.reload();
      }
    }, 60000);

    return () => window.clearInterval(timer);
  }, [draft]);

  const viewCounts = useMemo(
    () =>
      views.reduce((counts, view) => {
        counts[view.id] = visibleConversations.filter(
          (conversation) => conversation.view === view.id
        ).length;
        return counts;
      }, {}),
    [visibleConversations]
  );

  useEffect(() => {
    if (visibleConversations.length === 0) return;
    const activeHasConversations = visibleConversations.some(
      (conversation) => conversation.view === activeView
    );
    if (activeHasConversations) return;
    const nextView =
      views.find((view) =>
        visibleConversations.some((conversation) => conversation.view === view.id)
      )?.id ?? "my-open";
    setActiveView(nextView);
  }, [activeView, visibleConversations]);

  useEffect(() => {
    if (visibleConversations.length === 0) return;
    const selectedStillExists = visibleConversations.some(
      (conversation) => conversation.id === selectedId
    );
    if (!selectedStillExists) setSelectedId(visibleConversations[0].id);
  }, [selectedId, visibleConversations]);

  const selectedCandidate = useMemo(() => {
    if (!selectedId) return visibleConversations[0] ?? null;
    return (
      visibleConversations.find((conversation) => conversation.id === selectedId) ??
      visibleConversations[0] ??
      null
    );
  }, [selectedId, visibleConversations]);
  const hasRealSelection = Boolean(selectedCandidate);
  const selected =
    selectedCandidate ?? {
      id: "empty",
      createdAt: null,
      clientCode: scopedClientCode || "suitesmine",
      guest: copy.noConversationTitle,
      initials: "OC",
      channel: "Railway",
      view: activeView,
      status: "ai",
      intent: "-",
      lastMessage:
        loadState === "loading"
          ? copy.loadConversations
          : loadState === "error"
            ? copy.loadFailed
            : copy.sendFirstMessage,
      lastSeen: "",
      email: "-",
      phone: "-",
      location: "-",
      lastViewed: "-",
      metadata: {
        source: "railway",
        state: loadState,
      },
      messages: [
        {
          role: "system",
          content:
            loadState === "loading"
              ? copy.loadConversations
              : loadState === "error"
                ? copy.loadFailed
                : `${copy.noConversation} ${copy.sendFirstMessage}`,
          time: "",
        },
      ],
    };
  const skin = clientSkins[selected.clientCode] ?? clientSkins.suitesmine;
  const currentStatus = selected.status;
  const isManual = currentStatus === "manual";
  const filteredConversations = visibleConversations.filter(
    (conversation) => conversation.view === activeView
  );
  const displayedConversations =
    filteredConversations.length > 0 ? filteredConversations : visibleConversations;
  const showingFallbackList =
    filteredConversations.length === 0 && visibleConversations.length > 0;

  const suggestReply = async () => {
    if (!hasRealSelection || toolLoading) return;
    setToolLoading(true);
    try {
      const transcript = selected.messages.map((message) => `${message.role}: ${message.content}`).join("\n");
      const response = await fetch("/api/dashboard/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, language }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const suggestion = data.analysis?.suggestedReply || data.analysis?.summary;
      if (suggestion) setDraft(suggestion);
      replyRef.current?.focus();
    } catch {
      setDraft(copy.quickText);
      replyRef.current?.focus();
    } finally {
      setToolLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f6fb] text-[#121827]">
      <div className="flex min-h-screen flex-col lg:h-screen lg:min-h-[760px] lg:flex-row">
        <aside className="flex shrink-0 items-center gap-3 overflow-x-auto border-b border-[#dde4f1] bg-[#f8faff] px-3 py-3 lg:w-16 lg:flex-col lg:border-b-0 lg:border-r lg:px-0 lg:py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white shadow-sm lg:mb-6">
            <MessageCircle className="h-5 w-5 text-[#3159c9]" />
          </div>
          <nav aria-label={copy.primaryNav} className="flex flex-1 gap-2 lg:flex-col">
            {navigationItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                aria-current={activeSection === id ? "page" : undefined}
                onClick={() => setActiveSection(id)}
                className={`flex h-11 w-11 items-center justify-center rounded-md transition ${
                  activeSection === id ? "bg-[#dce8ff] text-[#173b8f]" : "text-[#61708b] hover:bg-white"
                }`}
              >
                <Icon className="h-5 w-5" />
              </button>
            ))}
          </nav>
          <button
            type="button"
            title={copy.settings}
            aria-label={copy.settings}
            onClick={() => setActiveSection("settings")}
            className={`flex h-11 w-11 items-center justify-center rounded-md ${activeSection === "settings" ? "bg-[#dce8ff] text-[#173b8f]" : "text-[#61708b] hover:bg-white"}`}
          >
            <Settings className="h-5 w-5" />
          </button>
        </aside>

        {activeSection !== "inbox" ? (
          <WorkspacePanel
            section={activeSection}
            conversations={visibleConversations}
            integrations={integrations}
            onClose={() => setActiveSection("inbox")}
            copy={copy}
            language={language}
            scopedClientCode={scopedClientCode}
          />
        ) : (
        <>
        <aside className="w-full shrink-0 border-b border-[#dde4f1] bg-[#f4f7fc] px-5 py-5 lg:w-[238px] lg:border-b-0 lg:border-r">
          <h1 className="text-xl font-semibold">{copy.nav[0]}</h1>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#5f6c86]">
            <span className="rounded-full bg-[#e8edf9] px-2 py-1">{user?.firstName || role}</span>
            <span>{scopedClientCode ?? copy.allClients}</span>
          </div>
          <div className="mt-3 rounded-md bg-white px-3 py-2 text-xs leading-5 text-[#5f6c86] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#17623a]">{copy.liveAuto}</span>
              <span>{visibleConversations.length}</span>
            </div>
            <div>{lastSync ? `Sync ${lastSync}` : copy.syncing}</div>
            {loadError && <div className="text-[#b42318]">{loadError}</div>}
          </div>

          <section className="mt-6 lg:mt-8">
            <button className="flex items-center gap-1 text-xs font-semibold uppercase text-[#172033]">
              {copy.liveConversations}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="mt-4 grid grid-cols-3 gap-2 lg:block lg:space-y-1">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => {
                    setActiveView(view.id);
                    const next = visibleConversations.find(
                      (conversation) => conversation.view === view.id
                    );
                    if (next) setSelectedId(next.id);
                  }}
                  className={`flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm transition ${
                    activeView === view.id
                      ? "bg-[#dbe6ff] font-medium text-[#173b8f]"
                      : "text-[#2c3750] hover:bg-white"
                  }`}
                >
                  <span>{view.icon}</span>
                  <span className="flex-1 text-left">{view.label}</span>
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">
                    {viewCounts[view.id] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6 lg:mt-8">
            <button className="flex items-center gap-1 text-xs font-semibold uppercase text-[#172033]">
              {copy.tickets}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="mt-4 rounded-md bg-[#eef3ff] p-3 text-sm leading-5 text-[#536079]">
              {copy.ticketsText}
              <button type="button" onClick={() => { if (!scopedClientCode) return setActiveSection("settings"); window.location.href = `/api/integrations/gmail/connect?client=${encodeURIComponent(scopedClientCode)}`; }} className="mt-3 rounded-md bg-[#dbe6ff] px-3 py-1.5 text-sm font-medium text-[#3159c9]">
                {copy.connectMailbox}
              </button>
            </div>
          </section>

          <section className="mt-6 lg:mt-8">
            <button className="flex items-center gap-1 text-xs font-semibold uppercase text-[#172033]">
              {copy.savedViews}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="mt-4 space-y-3 text-sm text-[#2c3750]">
              {[
                ["whatsapp", MessageCircle, "WhatsApp", "text-[#17623a]"],
                ["facebook", MessageCircle, "Facebook Messenger", "text-[#3159c9]"],
                ["instagram", AtSign, "Instagram", "text-[#d34c86]"],
              ].map(([key, Icon, label, color]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection("settings")}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-white"
                >
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="min-w-0 flex-1">{label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${integrations?.[key]?.configured ? "bg-[#e9f8ef] text-[#17623a]" : "bg-[#fff3dc] text-[#8a5200]"}`}>
                    {integrations?.[key]?.configured ? copy.connected : copy.configure}
                  </span>
                </button>
              ))}
              <div className="rounded-md bg-[#eef3ff] p-3 text-xs leading-5 text-[#536079]">
                {copy.socialChannelsText}
                <button type="button" onClick={() => setActiveSection("settings")} className="mt-3 rounded-md bg-[#dbe6ff] px-3 py-1.5 text-sm font-medium text-[#3159c9]">
                  {copy.connectSocialChannels}
                </button>
              </div>
            </div>
          </section>
        </aside>

        <section className="w-full shrink-0 border-b border-[#dde4f1] bg-white lg:w-[320px] lg:border-b-0 lg:border-r">
          <div className="border-b border-[#e9edf5] px-4 py-4">
            <label className="flex h-10 items-center gap-2 rounded-full bg-[#f1f4f9] px-4">
              <Search className="h-4 w-4 text-[#74819a]" />
              <input
                placeholder={copy.search}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#7d889d]"
              />
            </label>
          </div>
          <div className="px-5 py-5">
            <h2 className="flex items-center gap-3 text-xl font-semibold">
              📬 {showingFallbackList ? copy.all : views.find((view) => view.id === activeView)?.label}
              <span className="rounded-full bg-[#eef3ff] px-2 py-1 text-xs font-medium text-[#5b6b91]">
                {displayedConversations.length}
              </span>
            </h2>
          </div>
          <div className="max-h-[360px] overflow-y-auto px-3 pb-4 lg:h-[calc(100%-138px)] lg:max-h-none">
            {showingFallbackList && (
              <div className="mb-3 rounded-md bg-[#eef3ff] px-3 py-2 text-xs leading-5 text-[#4f5f83]">
                {copy.emptyView}
              </div>
            )}
            {displayedConversations.map((conversation) => {
              const active = conversation.id === selectedId;
              const conversationSkin = clientSkins[conversation.clientCode] ?? clientSkins.suitesmine;
              const status = conversation.status;

              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedId(conversation.id)}
                  className={`mb-2 w-full rounded-lg px-3 py-3 text-left transition ${
                    active ? "bg-[#f0f3f8]" : "hover:bg-[#f7f9fd]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ background: conversationSkin.accent }}
                    >
                      {conversation.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{conversation.guest}</p>
                        <span className="text-xs text-[#66718a]">{conversation.lastSeen}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#66718a]">{conversation.channel}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-5">{conversation.lastMessage}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-[#66718a]">{conversationSkin.label}</span>
                        <StatusPill status={status} copy={copy} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {displayedConversations.length === 0 && (
              <div className="rounded-lg border border-dashed border-[#cfd8ea] bg-[#f8faff] px-4 py-5 text-sm leading-6 text-[#5d6880]">
                {loadState === "loading"
                  ? copy.loading
                  : loadState === "error"
                    ? copy.railwayError
                    : copy.noConversation}
              </div>
            )}
          </div>
        </section>

        <section className="flex min-h-[560px] min-w-0 flex-1 flex-col bg-white lg:min-h-0">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dde4f1] px-4 py-3 lg:h-[72px] lg:flex-nowrap lg:px-6 lg:py-0">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#68748b]">{copy.client}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e1e7f2] text-xs font-semibold">
                {skin.label.slice(0, 2)}
              </div>
              <span className="text-sm font-medium">{skin.label}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={!hasRealSelection}
                onClick={async () => {
                  if (!hasRealSelection) return;
                  await fetch(`/api/conversations/${selected.id}/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "solved" }),
                  });
                  loadConversations();
                }}
                className="flex h-9 items-center gap-2 rounded-md border border-[#d8e0ef] px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4 text-[#17623a]" />
                {copy.solve}
              </button>
              <button
                disabled={!hasRealSelection}
                onClick={async () => {
                  if (!hasRealSelection) return;
                  await fetch(`/api/conversations/${selected.id}/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: isManual ? "ai" : "manual" }),
                  });
                  loadConversations();
                }}
                className="h-9 rounded-md px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: isManual ? "#66718a" : skin.accent }}
              >
                {isManual ? copy.returnAi : copy.takeover}
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-[#f4f6fb]">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <select
              value={language}
              onChange={(event) => {
                const nextLanguage = event.target.value;
                setLanguage(nextLanguage);
                window.localStorage.setItem("oliviaInboxLanguage", nextLanguage);
              }}
              aria-label="Language"
              className="h-9 rounded-md border border-[#d8e0ef] bg-white px-2 text-sm"
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
          </header>

          <div className="flex min-h-9 items-center justify-center px-3 py-2 text-center text-sm" style={{ background: skin.soft, color: skin.accent }}>
            <CircleHelp className="mr-2 h-4 w-4" />
            {hasRealSelection
              ? `${copy.conversationFrom} ${skin.siteUrl}. ${copy.manualPaused}`
              : copy.waiting}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 lg:px-7 lg:py-7">
            <div className="mb-5 flex items-center gap-4 text-sm text-[#172033] lg:mb-7 lg:gap-8">
              <div className="h-px flex-1 bg-[#dfe5f1]" />
              {formatConversationDate(selected.createdAt, language)}
              <div className="h-px flex-1 bg-[#dfe5f1]" />
            </div>
            <div className="space-y-6">
              {selected.messages.map((message, index) => (
                <MessageBlock key={`${message.role}-${index}`} message={message} guest={selected} skin={skin} copy={copy} />
              ))}
            </div>
          </div>

          <footer className="border-t-4 bg-white" style={{ borderColor: skin.accent }}>
            <div className="flex h-12 items-center gap-2 border-b border-[#e8edf5] px-5 text-sm">
              <MessageSquareText className="h-4 w-4 text-[#68748b]" />
              {copy.liveChat}
              <ChevronDown className="h-4 w-4 text-[#68748b]" />
              <StatusPill status={currentStatus} copy={copy} />
            </div>
            <div className="px-3 py-3 lg:px-4">
              <textarea
                ref={replyRef}
                value={draft}
                disabled={!hasRealSelection || !isManual}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={
                  isManual
                    ? copy.writeReply
                    : copy.takeoverToReply
                }
                className="h-16 w-full resize-none text-sm outline-none placeholder:text-[#66718a] disabled:bg-white disabled:text-[#66718a]"
              />
              {attachment && (
                <div className="mb-2 flex items-center justify-between rounded-md bg-[#eef3ff] px-3 py-2 text-xs text-[#3159c9]">
                  <span>{copy.attachment}: {attachment.name}</span>
                  <button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment">×</button>
                </div>
              )}
              {attachmentError && <p className="mb-2 text-xs text-[#b42318]">{attachmentError}</p>}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 text-[#6f7b94]">
                  <button type="button" disabled={!hasRealSelection || toolLoading} onClick={suggestReply} title={copy.tools.suggest} aria-label={copy.tools.suggest} className="rounded p-2 hover:bg-[#eef3ff] disabled:opacity-40"><Bot className="h-4 w-4" /></button>
                  <button type="button" disabled={!hasRealSelection} onClick={() => { setDraft(copy.greetingText); replyRef.current?.focus(); }} title={copy.tools.greeting} aria-label={copy.tools.greeting} className="rounded p-2 hover:bg-[#eef3ff] disabled:opacity-40"><Wand2 className="h-4 w-4" /></button>
                  <button type="button" disabled={!hasRealSelection} onClick={() => { setDraft(copy.quickText); replyRef.current?.focus(); }} title={copy.tools.quick} aria-label={copy.tools.quick} className="rounded p-2 hover:bg-[#eef3ff] disabled:opacity-40"><Zap className="h-4 w-4" /></button>
                  <button type="button" disabled={!hasRealSelection} onClick={() => replyRef.current?.focus()} title={copy.tools.focus} aria-label={copy.tools.focus} className="rounded p-2 hover:bg-[#eef3ff] disabled:opacity-40"><Command className="h-4 w-4" /></button>
                  <button type="button" disabled={!hasRealSelection} onClick={() => attachmentRef.current?.click()} title={copy.tools.attach} aria-label={copy.tools.attach} className="rounded p-2 hover:bg-[#eef3ff] disabled:opacity-40"><Paperclip className="h-4 w-4" /></button>
                  <input
                    ref={attachmentRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setAttachmentError("");
                      if (file && file.size > 2_000_000) {
                        setAttachmentError(copy.attachmentTooLarge);
                      } else if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setAttachment({
                          name: file.name,
                          type: file.type || "application/octet-stream",
                          size: file.size,
                          dataUrl: String(reader.result),
                        });
                        reader.onerror = () => setAttachmentError(copy.attachmentTooLarge);
                        reader.readAsDataURL(file);
                      }
                      event.target.value = "";
                      replyRef.current?.focus();
                    }}
                  />
                </div>
                <button
                  disabled={!hasRealSelection || !isManual || (!draft.trim() && !attachment)}
                  onClick={async () => {
                    if (!hasRealSelection || (!draft.trim() && !attachment)) return;
                    await fetch(`/api/conversations/${selected.id}/messages`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ content: draft, attachment }),
                    });
                    setDraft("");
                    setAttachment(null);
                    loadConversations();
                  }}
                  className="flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#dce2ed]"
                  style={isManual && (draft.trim() || attachment) ? { background: skin.accent } : undefined}
                >
                  <Send className="h-4 w-4" />
                  {copy.reply}
                </button>
              </div>
            </div>
          </footer>
        </section>

        <aside className="w-full shrink-0 border-t border-[#dde4f1] bg-white lg:w-[280px] lg:border-l lg:border-t-0">
          <div className="flex min-h-[56px] items-center gap-5 overflow-x-auto border-b border-[#dde4f1] px-5 py-3 text-sm lg:h-[72px] lg:py-0">
            <button className="border-b-2 pb-5 font-medium" style={{ borderColor: skin.accent, color: skin.accent }}>
              {copy.info}
            </button>
            <button className="pb-5">{copy.viewedPages}</button>
            <button className="pb-5">{copy.notes}</button>
          </div>
          <div className="border-b border-[#e8edf5] p-5">
            <h2 className="text-xs font-semibold uppercase">{copy.customerData}</h2>
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <UserRound className="h-4 w-4 text-[#8792a8]" />
                <span className="truncate">{selected.guest}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#8792a8]" />
                <span className="truncate">{selected.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-[#8792a8]" />
                <span>{selected.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-[#8792a8]" />
                <button className="text-[#66718a]">{copy.addTag}</button>
              </div>
            </div>
          </div>
          <div className="border-b border-[#e8edf5] p-5">
            <h2 className="text-xs font-semibold uppercase">{copy.bookingContext}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {Object.entries(selected.metadata).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-[#66718a]">{key}</dt>
                  <dd className="min-w-0 break-words text-right font-medium">{formatMetadataValue(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="p-5">
            <h2 className="text-xs font-semibold uppercase">{copy.lastViewed}</h2>
            <p className="mt-4 text-sm text-[#66718a]">{selected.lastViewed}</p>
            <button className="mt-4 text-sm font-medium" style={{ color: skin.accent }}>
              {copy.seeHistory}
            </button>
          </div>
        </aside>
        </>
        )}
      </div>
    </main>
  );
}
