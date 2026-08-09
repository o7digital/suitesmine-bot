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

export function normalizeClientCode(clientCode) {
  const code = String(clientCode || "").trim().toLowerCase();
  return clientAliases[code] || code;
}

export function getAdminAccessForEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return { role: "legacy", clients: ["*"] };
  if (normalizedEmail.endsWith("@o7digital.com")) return { role: "super_admin", clients: ["*"] };
  return adminAccess[normalizedEmail] || { role: "legacy", clients: ["*"] };
}

export function getAccessibleClientCodes(email, availableClientCodes = []) {
  const access = getAdminAccessForEmail(email);
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

export function canAccessClient(email, clientCode, availableClientCodes = []) {
  const normalizedClientCode = normalizeClientCode(clientCode);
  if (!normalizedClientCode) return true;
  return getAccessibleClientCodes(email, availableClientCodes).includes(normalizedClientCode);
}
