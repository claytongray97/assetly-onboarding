import { connectRequestSchema } from "@/lib/schemas";
import { delay, latency, simulateConnect } from "@/lib/integrations";

/** POST /api/integrations/connect — simulated credential check / OAuth exchange. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = connectRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Missing or malformed credentials." }, { status: 400 });
  }

  await delay(latency());
  const result = simulateConnect(parsed.data);

  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ status: "connected", account: result.account, connectedAt: new Date().toISOString() });
}
