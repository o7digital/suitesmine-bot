import { currentUser } from "@clerk/nextjs/server";
import { getAccessibleClientCodes, getAdminAccessForUser } from "@/config/adminAccess";
import { clients } from "@/config/clients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hiddenClientCodes = new Set(["default", "demo"]);

const clientAccessPreviews = {
  infrasegura: ["infrasegura", "archivomac", "securyti"],
};

export async function GET(request) {
  const user = await currentUser().catch(() => null);
  const availableClientCodes = Object.keys(clients).filter((clientCode) => !hiddenClientCodes.has(clientCode));
  const access = getAdminAccessForUser(user);
  const preview = new URL(request.url).searchParams.get("preview")?.trim().toLowerCase() || "";
  const previewClientCodes = access.clients.includes("*") ? clientAccessPreviews[preview] : null;
  const accessibleClientCodes = previewClientCodes?.filter((clientCode) => availableClientCodes.includes(clientCode))
    ?? getAccessibleClientCodes(user, availableClientCodes);

  return Response.json({
    role: previewClientCodes ? "client_admin_preview" : access.role,
    allClients: previewClientCodes ? false : access.clients.includes("*"),
    preview: previewClientCodes ? preview : "",
    clients: accessibleClientCodes,
  });
}
