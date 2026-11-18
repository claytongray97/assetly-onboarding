import { importRequestSchema } from "@/lib/schemas";
import { delay, latency, simulateImport } from "@/lib/integrations";

/** POST /api/integrations/import — simulated initial sync; returns record counts and sample rows per data type. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = importRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid import request." }, { status: 400 });
  }

  const result = simulateImport(parsed.data);
  if (!result) return Response.json({ error: "Unknown integration." }, { status: 404 });

  await delay(latency() + 800);
  return Response.json({ systemId: parsed.data.systemId, ...result });
}
