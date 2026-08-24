import assert from "node:assert/strict";
import test from "node:test";

process.env.OLIVIA_WIDGET_SIGNING_SECRET = "unit-test-widget-secret";
process.env.OLIVIA_INTERNAL_TOKEN = "unit-test-internal-secret";

const {
  clientCodeForSiteHost,
  issueWidgetIdentity,
  requestSiteHost,
  resolveRequestClient,
  serverApprovedMetadata,
  verifyWidgetIdentity,
} = await import("../lib/client-identity.mjs");

const clientProfiles = {
  vialterna: { clientCode: "vialterna", siteUrl: "vialterna2.vercel.app" },
  zevicapital: { clientCode: "zevicapital", siteUrl: "zevicapital.com" },
  touski: { clientCode: "touski", siteUrl: "touski.online" },
};

function requestFor(origin, identity = "", internalToken = "") {
  const headers = new Map([
    ["origin", origin],
    ["x-olivia-widget-identity", identity],
    ["x-olivia-internal-token", internalToken],
  ]);
  return {
    url: `${origin || "https://internal.o7.test"}/api/olivia/chat`,
    headers: { get: (name) => headers.get(name.toLowerCase()) || "" },
  };
}

test("A: valid Vialterna identity selects Vialterna", () => {
  const origin = "https://vialterna2.vercel.app";
  const identity = issueWidgetIdentity("vialterna", origin, clientProfiles);
  assert.equal(resolveRequestClient(requestFor(origin, identity), "vialterna", clientProfiles), "vialterna");
});

test("B: Vialterna identity ignores a tampered Zevi clientCode", () => {
  const origin = "https://vialterna2.vercel.app";
  const identity = issueWidgetIdentity("vialterna", origin, clientProfiles);
  assert.equal(resolveRequestClient(requestFor(origin, identity), "zevicapital", clientProfiles), "vialterna");
});

test("C: Zevi identity ignores a tampered Vialterna clientCode", () => {
  const origin = "https://zevicapital.com";
  const identity = issueWidgetIdentity("zevicapital", origin, clientProfiles);
  assert.equal(resolveRequestClient(requestFor(origin, identity), "vialterna", clientProfiles), "zevicapital");
});

test("D: unknown sites and forged identities cannot select a known tenant", () => {
  assert.equal(clientCodeForSiteHost("https://unknown.example", clientProfiles), "");
  assert.equal(verifyWidgetIdentity("forged.token", "https://unknown.example", clientProfiles), null);
  assert.throws(
    () => resolveRequestClient(requestFor("https://unknown.example", "forged.token"), "vialterna", clientProfiles),
    /Invalid widget identity/,
  );
});

test("E: the validated tenant remains authoritative for conversation scope", () => {
  const origin = "https://vialterna2.vercel.app";
  const identity = issueWidgetIdentity("vialterna", origin, clientProfiles);
  const validatedClient = resolveRequestClient(requestFor(origin, identity), "zevicapital", clientProfiles);
  assert.deepEqual([validatedClient, "visitor-123"], ["vialterna", "visitor-123"]);
});

test("server callers require the internal token and a known tenant", () => {
  const request = requestFor("", "", "unit-test-internal-secret");
  assert.equal(resolveRequestClient(request, "vialterna", clientProfiles), "vialterna");
  assert.throws(() => resolveRequestClient(request, "unknown", clientProfiles), /Unknown server client/);
});

test("browser metadata cannot override the server-approved tenant profile", () => {
  const metadata = serverApprovedMetadata(
    {
      clientName: "Vialterna",
      industry: "managed-connectivity",
      knowledge: "approved Vialterna knowledge",
      siteUrl: "vialterna2.vercel.app",
    },
    {
      clientName: "ZeVi Capital",
      clientIndustry: "real-estate-investment",
      clientKnowledge: "malicious override",
      clientSiteUrl: "zevicapital.com",
      pageTitle: "Visitor page",
    },
  );

  assert.deepEqual(metadata, {
    clientName: "Vialterna",
    clientIndustry: "managed-connectivity",
    clientKnowledge: "approved Vialterna knowledge",
    clientSiteUrl: "vialterna2.vercel.app",
    pageTitle: "Visitor page",
  });
});

test("cross-origin TOUSKI widget identity is bound to the browser Origin", () => {
  const origin = "https://touski.online";
  const identity = issueWidgetIdentity("touski", origin, clientProfiles);
  const request = {
    url: "https://olivia-ai.o7digital.com/api/olivia/chat",
    headers: { get: (name) => name.toLowerCase() === "origin" ? origin : name.toLowerCase() === "x-olivia-widget-identity" ? identity : "" },
  };

  assert.equal(requestSiteHost(request), "touski.online");
  assert.equal(resolveRequestClient(request, "touski", clientProfiles), "touski");
});
