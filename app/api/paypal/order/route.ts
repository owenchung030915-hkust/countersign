import { z } from "zod";
import { jobById } from "@/lib/jobs";
import { createSandboxOrder, paypalCredentials } from "@/lib/paypal";
import { openCheckout } from "@/lib/settle";

export const dynamic = "force-dynamic";

const ordersByPermit = new Map<string, string>();

const Body = z.object({
  permit: z.string().min(10),
  deliverable: z.string().min(1).max(8000),
});

export async function POST(request: Request) {
  if (!paypalCredentials().configured) {
    return Response.json({ error: "PayPal sandbox credentials are not configured." }, { status: 412 });
  }
  try {
    const body = Body.parse(await request.json());
    const gate = openCheckout(body.permit, body.deliverable);
    if ("error" in gate) return Response.json({ error: gate.error }, { status: 403 });
    const existing = ordersByPermit.get(body.permit);
    if (existing) return Response.json({ id: existing });
    const job = jobById(gate.claims.jobId);
    if (!job) return Response.json({ error: "Unknown job." }, { status: 404 });
    const order = await createSandboxOrder({
      sku: job.id,
      name: job.title.slice(0, 127),
      description: `Bounty posted by ${job.postedBy}`.slice(0, 127),
      amount: job.bounty.toFixed(2),
      mandateTitle: "Countersign",
      permit: body.permit,
    });
    ordersByPermit.set(body.permit, order.id);
    return Response.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal could not open checkout.";
    return Response.json({ error: message }, { status: 400 });
  }
}
