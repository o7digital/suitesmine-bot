"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { ArrowRight, Globe2, ShieldCheck } from "lucide-react";
import { clients } from "@/config/clients";
import { getAccessibleClientCodes, getAdminAccessForUser } from "@/config/adminAccess";

const hiddenClientCodes = new Set(["default", "demo"]);

export default function AdminSitesPage() {
  const { user, isLoaded } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const availableClientCodes = useMemo(
    () => Object.keys(clients).filter((clientCode) => !hiddenClientCodes.has(clientCode)),
    []
  );
  const fallbackAccess = getAdminAccessForUser(user);
  const fallbackClientCodes = getAccessibleClientCodes(user, availableClientCodes);
  const [serverAccess, setServerAccess] = useState(null);
  const access = serverAccess ?? fallbackAccess;
  const accessibleClientCodes = serverAccess?.clients ?? fallbackClientCodes;
  const visibleClients = accessibleClientCodes
    .map((clientCode) => clients[clientCode])
    .filter(Boolean)
    .sort((a, b) => a.clientName.localeCompare(b.clientName));

  useEffect(() => {
    if (!isLoaded) return;
    fetch("/api/admin/access", { cache: "no-store", credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.clients) setServerAccess(data);
      })
      .catch(() => {});
  }, [isLoaded]);

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-6 py-8 text-[#121827]">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-[#dde4f1] pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#3159c9]">Olivia AI Console</p>
            <h1 className="mt-2 text-3xl font-bold">Sites et Channel Managers</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61708b]">
              Choisissez le site à gérer. Les accès sont filtrés par votre compte Clerk.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/inbox" className="rounded-lg border border-[#d8e0ef] bg-white px-4 py-2 text-sm font-semibold text-[#3159c9]">
              Inbox globale
            </Link>
            <UserButton userProfileMode="modal" showName />
          </div>
        </header>

        <section className="mt-6 grid gap-4 rounded-2xl border border-[#dde4f1] bg-white p-5 shadow-sm md:grid-cols-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-[#17623a]" />
            <div>
              <p className="font-semibold">Compte</p>
              <p className="mt-1 text-sm text-[#61708b]">{isLoaded ? email || "Session Clerk active" : "Chargement Clerk…"}</p>
            </div>
          </div>
          <div>
            <p className="font-semibold">Rôle</p>
            <p className="mt-1 text-sm text-[#61708b]">{access.role}</p>
          </div>
          <div>
            <p className="font-semibold">Sites accessibles</p>
            <p className="mt-1 text-sm text-[#61708b]">{visibleClients.length}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleClients.map((client) => (
            <Link
              key={client.clientCode}
              href={`/inbox?client=${encodeURIComponent(client.clientCode)}`}
              className="group rounded-2xl border border-[#dde4f1] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#3159c9] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold">{client.clientName}</p>
                  <p className="mt-1 text-sm text-[#61708b]">{client.siteUrl || client.clientCode}</p>
                </div>
                <span className="rounded-full bg-[#eef3ff] p-2 text-[#3159c9]">
                  <Globe2 className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-6 flex items-center justify-between text-sm font-semibold text-[#3159c9]">
                <span>Ouvrir le Channel Manager</span>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </section>

        {visibleClients.length === 0 && (
          <div className="mt-8 rounded-2xl border border-[#f3d1d1] bg-[#fff8f8] p-5 text-sm text-[#b42318]">
            Aucun site n’est configuré pour ce compte. Ajoutez l’email dans <code>config/adminAccess.js</code>.
          </div>
        )}
      </div>
    </main>
  );
}
