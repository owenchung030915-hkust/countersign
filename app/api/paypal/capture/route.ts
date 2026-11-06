import { z } from "zod";
import { captureSandboxOrder, readOrderWithToolkit } from "@/lib/paypal";

export const dynamic = "force-dynamic";

const Body = z.object({
  orderID: z.string().regex(/^[A-Za-z0-9]+$/),
});

export async function POST(request: Request) {
  try {
    const body = Body.parse(await request.json());
    const capture = await captureSandboxOrder(body.orderID);
    const readback = await readOrderWithToolkit(body.orderID);
    return Response.json({ ...capture, toolkitReadback: Boolean(readback) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal could not capture the payment.";
    return Response.json({ error: message }, { status: 400 });
  }
}
