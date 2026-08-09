import { currentUser } from "@clerk/nextjs/server";
import { getAccessibleClientCodes, getAdminAccessForUser } from "@/config/adminAccess";
import { clients } from "@/config/clients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hiddenClientCodes = new Set(["default", "demo"]);

export async function GET() {
  const user = await currentUser().catch(() => null);
  const availableClientCodes = Object.keys(clients).filter((clientCode) => !hiddenClientCodes.has(clientCode));
  const access = getAdminAccessForUser(user);
  const accessibleClientCodes = getAccessibleClientCodes(user, availableClientCodes);

  return Response.json({
    role: access.role,
    allClients: access.clients.includes("*"),
    clients: accessibleClientCodes,
  });
}
