export const clientAliases = {
  macretro: "archivomac",
  retromacnia: "archivomac",
};

export const adminAccess = {
  "oliviersteineur@gmail.com": {
    role: "super_admin",
    clients: ["*"],
  },
  "olivier@o7digital.com": {
    role: "super_admin",
    clients: ["*"],
  },
  "admin@o7digital.com": {
    role: "super_admin",
    clients: ["*"],
  },
  "client@infrasegura.com": {
    role: "client_admin",
    clients: ["infrasegura", "archivomac", "securyti"],
  },
};

const clientDomainAccess = [
  {
    domains: ["@infrasegura.com", "@securyti.mx", "@archivomac.mx"],
    access: {
      role: "client_admin",
      clients: ["infrasegura", "archivomac", "securyti"],
    },
  },
];

function normalizeClientList(value) {
  if (Array.isArray(value)) return value.map(normalizeClientCode).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map(normalizeClientCode)
      .filter(Boolean);
  }
  return [];
}

function getMetadataAccess(metadata = {}) {
  const metadataClients = [
    ...normalizeClientList(metadata.clients),
    ...normalizeClientList(metadata.clientCodes),
    ...normalizeClientList(metadata.allowedClients),
    ...normalizeClientList(metadata.clientCode),
  ];
  const clients = [...new Set(metadataClients)];
  const role = String(metadata.role || metadata.adminRole || "").trim().toLowerCase();

  if (role === "super_admin" || role === "platform_admin" || clients.includes("*")) {
    return { role: "super_admin", clients: ["*"] };
  }
  if (clients.length > 0) return { role: role || "client_admin", clients };
  return null;
}

export function normalizeClientCode(clientCode) {
  const code = String(clientCode || "").trim().toLowerCase();
  return clientAliases[code] || code;
}

export function getAdminAccessForUser(userOrEmail) {
  const email =
    typeof userOrEmail === "string"
      ? userOrEmail
      : userOrEmail?.primaryEmailAddress?.emailAddress || userOrEmail?.email || "";
  const metadata =
    typeof userOrEmail === "string"
      ? {}
      : {
          ...(userOrEmail?.publicMetadata || {}),
          ...(userOrEmail?.privateMetadata || {}),
        };
  const metadataAccess = getMetadataAccess(metadata);
  if (metadataAccess) return metadataAccess;

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return { role: "legacy", clients: ["*"] };
  if (normalizedEmail.endsWith("@o7digital.com")) return { role: "super_admin", clients: ["*"] };
  if (adminAccess[normalizedEmail]) return adminAccess[normalizedEmail];
  const domainAccess = clientDomainAccess.find(({ domains }) =>
    domains.some((domain) => normalizedEmail.endsWith(domain))
  );
  if (domainAccess) return domainAccess.access;
  return { role: "legacy", clients: ["*"] };
}

export function getAdminAccessForEmail(email) {
  return getAdminAccessForUser(email);
}

export function getAccessibleClientCodes(userOrEmail, availableClientCodes = []) {
  const access = getAdminAccessForUser(userOrEmail);
  const available = availableClientCodes.map(normalizeClientCode);
  if (access.clients.includes("*")) return [...new Set(available)];
  return [
    ...new Set(
      access.clients
        .map(normalizeClientCode)
        .filter((clientCode) => available.includes(clientCode))
    ),
  ];
}

export function canAccessClient(userOrEmail, clientCode, availableClientCodes = []) {
  const normalizedClientCode = normalizeClientCode(clientCode);
  if (!normalizedClientCode) return true;
  return getAccessibleClientCodes(userOrEmail, availableClientCodes).includes(normalizedClientCode);
}
