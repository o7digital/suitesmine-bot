"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { UserButton, useUser } from "@clerk/nextjs";
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

const views = [
  { id: "unassigned", label: "Non assigne", icon: "!" },
  { id: "my-open", label: "Ouvert", icon: "[]" },
  { id: "solved", label: "Resolue", icon: "✓" },
];

function StatusPill({ status }) {
  const config = {
    manual: { label: "Manual", className: "bg-[#fff3dc] text-[#8a5200]" },
    ai: { label: "AI", className: "bg-[#e9f8ef] text-[#17623a]" },
    solved: { label: "Solved", className: "bg-[#eaf0ff] text-[#3159c9]" },
  }[status];

  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function MessageBlock({ message, guest, skin }) {
  if (message.role === "system") {
    return (
      <p className="mx-auto max-w-2xl text-center text-sm italic leading-6 text-[#66718a]">
        {message.content}
      </p>
    );
  }

  const isGuest = message.role === "guest";
  const isAi = message.role === "ai";

  return (
    <div className={`flex gap-3 ${isGuest ? "justify-start" : "justify-end"}`}>
      {isGuest && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dbe3f4] text-sm font-semibold text-[#60708e]">
          {guest.initials}
        </div>
      )}
      <div className={`max-w-[720px] ${isGuest ? "" : "text-right"}`}>
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#172033]">
          <span>{isGuest ? guest.guest : isAi ? "O7 IA" : "You"}</span>
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
          {message.content}
        </div>
      </div>
    </div>
  );
}

const navigationItems = [
  { id: "inbox", label: "Boîte de réception", icon: Inbox },
  { id: "automation", label: "Automatisations IA", icon: Bot },
  { id: "customers", label: "Clients", icon: UsersRound },
  { id: "analytics", label: "Statistiques", icon: LayoutDashboard },
  { id: "copilot", label: "Copilote IA", icon: Sparkles },
];

function WorkspacePanel({ section, conversations, integrations, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const open = conversations.filter((item) => item.status !== "solved");
  const manual = conversations.filter((item) => item.status === "manual");
  const ai = conversations.filter((item) => item.status === "ai");
  const uniqueVisitors = new Map(conversations.map((item) => [item.guest, item]));
  const title = navigationItems.find((item) => item.id === section)?.label || "Paramètres";

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
        body: JSON.stringify({ transcript, language: "fr" }),
      });
      const data = await response.json();
      setAnalysis(data.analysis || { summary: data.error || "Analyse indisponible." });
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
          Retour à l’Inbox
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-7">
        {section === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[
                ["Conversations", conversations.length],
                ["Ouvertes", open.length],
                ["Gérées par l’IA", ai.length],
                ["Reprises manuellement", manual.length],
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
                    Reliez la propriété GA4 de chaque site pour comparer trafic, ouvertures du chat et demandes de réservation.
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${integrations?.analytics?.configured ? "bg-[#e9f8ef] text-[#17623a]" : "bg-[#fff3dc] text-[#8a5200]"}`}>
                  {integrations?.analytics?.configured ? "Connecté" : "À connecter"}
                </span>
              </div>
              <a href="https://analytics.google.com/" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#3159c9] px-4 py-2 text-sm font-semibold text-white">
                Ouvrir Google Analytics <ExternalLink className="h-4 w-4" />
              </a>
              {!integrations?.analytics?.configured && (
                <p className="mt-4 text-xs text-[#66718a]">Configuration serveur requise : GA4_PROPERTY_ID et compte de service Google.</p>
              )}
            </article>
          </div>
        )}

        {section === "customers" && (
          <div className="overflow-hidden rounded-xl border border-[#dde4f1] bg-white">
            <div className="border-b border-[#e8edf5] p-5">
              <h2 className="text-lg font-semibold">{uniqueVisitors.size} clients et visiteurs</h2>
            </div>
            {[...uniqueVisitors.values()].map((visitor) => (
              <div key={visitor.guest} className="grid grid-cols-[1.4fr_1.5fr_1fr_1fr] gap-4 border-b border-[#eef1f6] px-5 py-4 text-sm last:border-0">
                <span className="font-medium">{visitor.guest}</span>
                <span className="truncate text-[#66718a]">{visitor.email}</span>
                <span className="text-[#66718a]">{visitor.phone}</span>
                <StatusPill status={visitor.status} />
              </div>
            ))}
          </div>
        )}

        {section === "automation" && (
          <div className="grid max-w-4xl grid-cols-2 gap-5">
            {[
              ["Réponse automatique", "L’IA répond aux nouvelles conversations tant qu’un opérateur ne prend pas la main.", true],
              ["Collecte de réservation", "Dates, nombre de voyageurs, catégorie, nom, email et téléphone.", true],
              ["Escalade humaine", "Transfert immédiat lorsqu’un visiteur demande explicitement une personne.", true],
              ["Consentement données", "Le widget bloque l’envoi tant que le visiteur n’a pas accepté le partage.", true],
            ].map(([name, description, enabled]) => (
              <article key={name} className="rounded-xl border border-[#dde4f1] bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{name}</h2>
                  <span className={`h-6 w-11 rounded-full p-1 ${enabled ? "bg-[#3159c9]" : "bg-[#cfd6e4]"}`}><span className="block h-4 w-4 translate-x-5 rounded-full bg-white" /></span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#66718a]">{description}</p>
              </article>
            ))}
          </div>
        )}

        {section === "copilot" && (
          <article className="max-w-4xl rounded-xl border border-[#dde4f1] bg-white p-6">
            <h2 className="text-lg font-semibold">Brief opérationnel IA</h2>
            <p className="mt-2 text-sm text-[#66718a]">Résume les conversations récentes, intentions, urgence et informations manquantes.</p>
            <button disabled={analyzing || !conversations.length} onClick={runAnalysis} className="mt-5 rounded-md bg-[#3159c9] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {analyzing ? "Analyse en cours…" : "Analyser maintenant"}
            </button>
            {analysis && <pre className="mt-5 whitespace-pre-wrap rounded-lg bg-[#f4f7fc] p-5 text-sm leading-6">{JSON.stringify(analysis, null, 2)}</pre>}
          </article>
        )}

        {section === "settings" && (
          <div className="grid max-w-4xl grid-cols-2 gap-5">
            <article className="rounded-xl border border-[#dde4f1] bg-white p-6">
              <ShieldCheck className="h-6 w-6 text-[#3159c9]" />
              <h2 className="mt-4 text-lg font-semibold">Compte et sécurité</h2>
              <p className="mt-2 text-sm leading-6 text-[#66718a]">Gérez votre email, vos sessions et activez l’authentification à deux facteurs dans votre profil Clerk.</p>
              <div className="mt-5 flex items-center gap-3"><UserButton userProfileMode="modal" showName /><span className="text-sm">Ouvrir mon profil sécurisé</span></div>
            </article>
            {["mailbox", "analytics", "database", "clerk", "openai", "cloudbeds"].map((key) => (
              <article key={key} className="rounded-xl border border-[#dde4f1] bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold capitalize">{key}</h2>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${integrations?.[key]?.configured ? "bg-[#e9f8ef] text-[#17623a]" : "bg-[#fff3dc] text-[#8a5200]"}`}>
                    {integrations?.[key]?.configured ? "Connecté" : "À configurer"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function InboxPage() {
  const { user } = useUser();
  const role = "admin";
  const [scopedClientCode, setScopedClientCode] = useState(undefined);
  const [conversations, setConversations] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [lastSync, setLastSync] = useState("");
  const [activeSection, setActiveSection] = useState("inbox");
  const [integrations, setIntegrations] = useState(null);
  useEffect(() => {
    setScopedClientCode(new URLSearchParams(window.location.search).get("client")?.trim() || null);
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
    fetch("/api/integrations/status")
      .then((response) => response.json())
      .then(setIntegrations)
      .catch(() => setIntegrations({}));
  }, []);

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
      clientCode: "suitesmine",
      guest: "Aucune conversation",
      initials: "OC",
      channel: "Railway",
      view: activeView,
      status: "ai",
      intent: "-",
      lastMessage:
        loadState === "loading"
          ? "Chargement des conversations Railway..."
          : loadState === "error"
            ? "Erreur de chargement Railway."
            : "Envoyez un message depuis le widget de test.",
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
              ? "Chargement des conversations Railway..."
              : loadState === "error"
                ? "Impossible de charger les conversations Railway. Les logs serveur sont actifs pour diagnostiquer."
                : "Aucune conversation dans cette vue. Envoyez un message depuis le widget Suites Mine pour créer la première conversation.",
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

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f6fb] text-[#121827]">
      <div className="flex h-screen min-h-[760px]">
        <aside className="flex w-16 shrink-0 flex-col items-center border-r border-[#dde4f1] bg-[#f8faff] py-4">
          <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-md bg-white shadow-sm">
            <MessageCircle className="h-5 w-5 text-[#3159c9]" />
          </div>
          <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-2">
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
            title="Paramètres et sécurité"
            aria-label="Paramètres et sécurité"
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
          />
        ) : (
        <>
        <aside className="w-[238px] shrink-0 border-r border-[#dde4f1] bg-[#f4f7fc] px-5 py-5">
          <h1 className="text-xl font-semibold">Inbox</h1>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#5f6c86]">
            <span className="rounded-full bg-[#e8edf9] px-2 py-1">{user?.firstName || role}</span>
            <span>{scopedClientCode ?? "all-clients"}</span>
          </div>
          <div className="mt-3 rounded-md bg-white px-3 py-2 text-xs leading-5 text-[#5f6c86] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#17623a]">Live auto</span>
              <span>{visibleConversations.length}</span>
            </div>
            <div>{lastSync ? `Sync ${lastSync}` : "Synchronisation..."}</div>
            {loadError && <div className="text-[#b42318]">{loadError}</div>}
          </div>

          <section className="mt-8">
            <button className="flex items-center gap-1 text-xs font-semibold uppercase text-[#172033]">
              Live conversations
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="mt-4 space-y-1">
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

          <section className="mt-8">
            <button className="flex items-center gap-1 text-xs font-semibold uppercase text-[#172033]">
              Tickets
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="mt-4 rounded-md bg-[#eef3ff] p-3 text-sm leading-5 text-[#536079]">
              Messages from mailbox or offline chat widget
              <button className="mt-3 rounded-md bg-[#dbe6ff] px-3 py-1.5 text-sm font-medium text-[#3159c9]">
                Connect mailbox
              </button>
            </div>
          </section>

          <section className="mt-8">
            <button className="flex items-center gap-1 text-xs font-semibold uppercase text-[#172033]">
              Views
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="mt-4 space-y-3 text-sm text-[#2c3750]">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-[#3159c9]" />
                Messenger
              </div>
              <div className="flex items-center gap-3">
                <AtSign className="h-4 w-4 text-[#d34c86]" />
                Instagram
              </div>
            </div>
          </section>
        </aside>

        <section className="w-[320px] shrink-0 border-r border-[#dde4f1] bg-white">
          <div className="border-b border-[#e9edf5] px-4 py-4">
            <label className="flex h-10 items-center gap-2 rounded-full bg-[#f1f4f9] px-4">
              <Search className="h-4 w-4 text-[#74819a]" />
              <input
                placeholder="Search in Inbox..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#7d889d]"
              />
            </label>
          </div>
          <div className="px-5 py-5">
            <h2 className="flex items-center gap-3 text-xl font-semibold">
              📬 {showingFallbackList ? "Toutes" : views.find((view) => view.id === activeView)?.label}
              <span className="rounded-full bg-[#eef3ff] px-2 py-1 text-xs font-medium text-[#5b6b91]">
                {displayedConversations.length}
              </span>
            </h2>
          </div>
          <div className="h-[calc(100%-138px)] overflow-y-auto px-3 pb-4">
            {showingFallbackList && (
              <div className="mb-3 rounded-md bg-[#eef3ff] px-3 py-2 text-xs leading-5 text-[#4f5f83]">
                La vue choisie est vide. Affichage de toutes les conversations live.
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
                        <StatusPill status={status} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {displayedConversations.length === 0 && (
              <div className="rounded-lg border border-dashed border-[#cfd8ea] bg-[#f8faff] px-4 py-5 text-sm leading-6 text-[#5d6880]">
                {loadState === "loading"
                  ? "Chargement Railway..."
                  : loadState === "error"
                    ? "Erreur Railway. Consulte les logs Vercel."
                    : "Aucune conversation dans cette vue. Le dashboard reste ouvert."}
              </div>
            )}
          </div>
        </section>

        <section className="flex min-w-0 flex-1 flex-col bg-white">
          <header className="flex h-[72px] items-center justify-between border-b border-[#dde4f1] px-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#68748b]">Client</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e1e7f2] text-xs font-semibold">
                {skin.label.slice(0, 2)}
              </div>
              <span className="text-sm font-medium">{skin.label}</span>
            </div>
            <div className="flex items-center gap-2">
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
                Solve
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
                {isManual ? "Rendre a l'IA" : "Prendre la main"}
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-[#f4f6fb]">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="flex h-9 items-center justify-center text-sm" style={{ background: skin.soft, color: skin.accent }}>
            <CircleHelp className="mr-2 h-4 w-4" />
            {hasRealSelection
              ? `Conversation recue depuis le site ${skin.siteUrl}. La reponse IA est suspendue en mode manuel.`
              : "Dashboard actif. En attente d'une conversation recue depuis le widget."}
          </div>

          <div className="flex-1 overflow-y-auto px-7 py-7">
            <div className="mb-7 flex items-center gap-8 text-sm text-[#172033]">
              <div className="h-px flex-1 bg-[#dfe5f1]" />
              May 25, 2026
              <div className="h-px flex-1 bg-[#dfe5f1]" />
            </div>
            <div className="space-y-6">
              {selected.messages.map((message, index) => (
                <MessageBlock key={`${message.role}-${index}`} message={message} guest={selected} skin={skin} />
              ))}
            </div>
          </div>

          <footer className="border-t-4 bg-white" style={{ borderColor: skin.accent }}>
            <div className="flex h-12 items-center gap-2 border-b border-[#e8edf5] px-5 text-sm">
              <MessageSquareText className="h-4 w-4 text-[#68748b]" />
              Live chat
              <ChevronDown className="h-4 w-4 text-[#68748b]" />
              <StatusPill status={currentStatus} />
            </div>
            <div className="px-4 py-3">
              <textarea
                value={draft}
                disabled={!hasRealSelection || !isManual}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={
                  isManual
                    ? "Ecrire une reponse au client..."
                    : "Prendre la main pour repondre au client"
                }
                className="h-16 w-full resize-none text-sm outline-none placeholder:text-[#66718a] disabled:bg-white disabled:text-[#66718a]"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-[#6f7b94]">
                  <Bot className="h-4 w-4" />
                  <Wand2 className="h-4 w-4" />
                  <Zap className="h-4 w-4" />
                  <Command className="h-4 w-4" />
                  <Paperclip className="h-4 w-4" />
                </div>
                <button
                  disabled={!hasRealSelection || !isManual || !draft.trim()}
                  onClick={async () => {
                    if (!hasRealSelection || !draft.trim()) return;
                    await fetch(`/api/conversations/${selected.id}/messages`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ content: draft }),
                    });
                    setDraft("");
                    loadConversations();
                  }}
                  className="flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#dce2ed]"
                  style={isManual && draft.trim() ? { background: skin.accent } : undefined}
                >
                  <Send className="h-4 w-4" />
                  Repondre
                </button>
              </div>
            </div>
          </footer>
        </section>

        <aside className="w-[280px] shrink-0 border-l border-[#dde4f1] bg-white">
          <div className="flex h-[72px] items-center gap-5 border-b border-[#dde4f1] px-5 text-sm">
            <button className="border-b-2 pb-5 font-medium" style={{ borderColor: skin.accent, color: skin.accent }}>
              Info
            </button>
            <button className="pb-5">Viewed pages</button>
            <button className="pb-5">Notes</button>
          </div>
          <div className="border-b border-[#e8edf5] p-5">
            <h2 className="text-xs font-semibold uppercase">Customer data</h2>
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
                <button className="text-[#66718a]">Add customer tag</button>
              </div>
            </div>
          </div>
          <div className="border-b border-[#e8edf5] p-5">
            <h2 className="text-xs font-semibold uppercase">Booking context</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {Object.entries(selected.metadata).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <dt className="text-[#66718a]">{key}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="p-5">
            <h2 className="text-xs font-semibold uppercase">Last viewed page</h2>
            <p className="mt-4 text-sm text-[#66718a]">{selected.lastViewed}</p>
            <button className="mt-4 text-sm font-medium" style={{ color: skin.accent }}>
              See the history
            </button>
          </div>
        </aside>
        </>
        )}
      </div>
    </main>
  );
}
