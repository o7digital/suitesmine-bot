"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AtSign,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  Inbox,
  LayoutDashboard,
  Mail,
  MessageCircle,
  MessageSquareText,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  Settings,
  Sparkles,
  Tag,
  UserRound,
  UsersRound,
  Wand2,
  Zap,
} from "lucide-react";
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

export default function InboxPage() {
  const role = "admin";
  const scopedClientCode = null;
  const [conversations, setConversations] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/conversations", { cache: "no-store" });
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
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const timer = window.setInterval(loadConversations, 4000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  const visibleConversations = useMemo(
    () =>
      scopedClientCode
        ? conversations.filter((conversation) => conversation.clientCode === scopedClientCode)
        : conversations,
    [scopedClientCode]
  );
  const initialSelectedId = visibleConversations[0]?.id ?? null;

  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [activeView, setActiveView] = useState("my-open");
  const [draft, setDraft] = useState("");

  const selected = useMemo(() => {
    if (!selectedId) return visibleConversations[0] ?? null;
    return (
      visibleConversations.find((conversation) => conversation.id === selectedId) ??
      visibleConversations[0] ??
      null
    );
  }, [selectedId, visibleConversations]);
  if (!selected) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f6fb] p-6">
        <p className="text-sm text-[#44506b]">
          {loadState === "loading"
            ? "Chargement des conversations..."
            : loadState === "error"
              ? "Impossible de charger les conversations Railway."
              : "Aucune conversation. Envoyez un message depuis le widget de test."}
        </p>
      </main>
    );
  }
  const skin = clientSkins[selected.clientCode] ?? clientSkins.suitesmine;
  const currentStatus = selected.status;
  const isManual = currentStatus === "manual";
  const filteredConversations = visibleConversations.filter(
    (conversation) => conversation.view === activeView
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f6fb] text-[#121827]">
      <div className="flex h-screen min-h-[760px]">
        <aside className="flex w-16 shrink-0 flex-col items-center border-r border-[#dde4f1] bg-[#f8faff] py-4">
          <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-md bg-white shadow-sm">
            <MessageCircle className="h-5 w-5 text-[#3159c9]" />
          </div>
          <nav className="flex flex-1 flex-col gap-2">
            {[Inbox, Bot, UsersRound, LayoutDashboard, Sparkles].map((Icon, index) => (
              <button
                key={index}
                className={`flex h-11 w-11 items-center justify-center rounded-md transition ${
                  index === 0 ? "bg-[#dce8ff] text-[#173b8f]" : "text-[#61708b] hover:bg-white"
                }`}
              >
                <Icon className="h-5 w-5" />
              </button>
            ))}
          </nav>
          <button className="flex h-11 w-11 items-center justify-center rounded-md text-[#61708b] hover:bg-white">
            <Settings className="h-5 w-5" />
          </button>
        </aside>

        <aside className="w-[238px] shrink-0 border-r border-[#dde4f1] bg-[#f4f7fc] px-5 py-5">
          <h1 className="text-xl font-semibold">Inbox</h1>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#5f6c86]">
            <span className="rounded-full bg-[#e8edf9] px-2 py-1">{role}</span>
            <span>{scopedClientCode ?? "all-clients"}</span>
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
                  {view.label}
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
              📬 {views.find((view) => view.id === activeView)?.label}
            </h2>
          </div>
          <div className="h-[calc(100%-138px)] overflow-y-auto px-3 pb-4">
            {filteredConversations.map((conversation) => {
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
                onClick={async () => {
                  await fetch(`/api/conversations/${selected.id}/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "solved" }),
                  });
                  loadConversations();
                }}
                className="flex h-9 items-center gap-2 rounded-md border border-[#d8e0ef] px-3 text-sm font-medium"
              >
                <Check className="h-4 w-4 text-[#17623a]" />
                Solve
              </button>
              <button
                onClick={async () => {
                  await fetch(`/api/conversations/${selected.id}/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: isManual ? "ai" : "manual" }),
                  });
                  loadConversations();
                }}
                className="h-9 rounded-md px-3 text-sm font-medium text-white"
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
            Conversation recue depuis le site {skin.siteUrl}. La reponse IA est suspendue en mode manuel.
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
                disabled={!isManual}
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
                  disabled={!isManual || !draft.trim()}
                  onClick={async () => {
                    if (!draft.trim()) return;
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
      </div>
    </main>
  );
}
