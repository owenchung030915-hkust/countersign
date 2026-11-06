import { aiConfig } from "@/lib/ai";
import { paypalCredentials } from "@/lib/paypal";

export const dynamic = "force-dynamic";

export function GET() {
  const paypal = paypalCredentials();
  const ai = aiConfig();
  return Response.json({
    paypal: paypal.configured,
    clientId: paypal.clientId || null,
    ai: ai.enabled,
    model: ai.enabled ? ai.modelName : null,
    sandbox: true,
  });
}
