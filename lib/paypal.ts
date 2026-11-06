import { createHash } from "crypto";
import { PayPalAgentToolkit } from "@paypal/agent-toolkit/ai-sdk";

const API = "https://api-m.sandbox.paypal.com";

type CachedToken = { value: string; exp: number };
let cached: CachedToken | null = null;

export function paypalCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET || "";
  return {
    clientId,
    clientSecret,
    configured: Boolean(clientId && clientSecret),
  };
}

async function accessToken(): Promise<string> {
  const { clientId, clientSecret, configured } = paypalCredentials();
  if (!configured) throw new Error("PayPal sandbox credentials are not configured.");
  if (cached && cached.exp > Date.now() + 30_000) return cached.value;
  const response = await fetch(`${API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.message || "PayPal rejected the sandbox credentials.");
  }
  cached = { value: data.access_token, exp: Date.now() + Number(data.expires_in ?? 300) * 1000 };
  return cached.value;
}

function paypalError(data: { message?: string; details?: Array<{ description?: string }> }, fallback: string): string {
  return data.details?.[0]?.description || data.message || fallback;
}

export async function createSandboxOrder(input: {
  sku: string;
  name: string;
  description: string;
  amount: string;
  mandateTitle: string;
  permit: string;
}) {
  const token = await accessToken();
  const requestId = createHash("sha256").update(input.permit).digest("hex").slice(0, 36);
  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: input.sku.slice(0, 256),
        description: `${input.name} · ${input.mandateTitle}`.slice(0, 127),
        custom_id: input.sku.slice(0, 127),
        invoice_id: `md-${requestId}`.slice(0, 127),
        amount: {
          currency_code: "USD",
          value: input.amount,
          breakdown: { item_total: { currency_code: "USD", value: input.amount } },
        },
        items: [
          {
            name: input.name.slice(0, 127),
            description: input.description.slice(0, 127),
            sku: input.sku.slice(0, 127),
            quantity: "1",
            category: "DIGITAL_GOODS",
            unit_amount: { currency_code: "USD", value: input.amount },
          },
        ],
      },
    ],
    application_context: {
      brand_name: "Countersign",
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
    },
  };
  const response = await fetch(`${API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": requestId,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(paypalError(data, "PayPal could not create the order."));
  let value = data?.purchase_units?.[0]?.amount?.value as string | undefined;
  let customId = data?.purchase_units?.[0]?.custom_id as string | undefined;
  if (!value || !customId) {
    const read = await fetch(`${API}/v2/checkout/orders/${data.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const full = await read.json();
    if (!read.ok) throw new Error(paypalError(full, "PayPal created an order that could not be read back."));
    value = full?.purchase_units?.[0]?.amount?.value;
    customId = full?.purchase_units?.[0]?.custom_id;
  }
  if (Number(value) !== Number(input.amount) || customId !== input.sku.slice(0, 127)) {
    throw new Error("PayPal returned an unexpected amount. Checkout was refused.");
  }
  return { id: data.id as string, status: data.status as string };
}

export async function captureSandboxOrder(orderId: string) {
  const token = await accessToken();
  const response = await fetch(`${API}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `cap-${orderId}`.slice(0, 38),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(paypalError(data, "PayPal could not capture the payment."));
  const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    id: data.id as string,
    status: data.status as string,
    captureId: (capture?.id as string | undefined) ?? null,
    amount: (capture?.amount?.value as string | undefined) ?? null,
    currency: (capture?.amount?.currency_code as string | undefined) ?? "USD",
    payerEmail: (data?.payer?.email_address as string | undefined) ?? null,
    payerName:
      [data?.payer?.name?.given_name, data?.payer?.name?.surname].filter(Boolean).join(" ") || null,
  };
}

export async function readOrderWithToolkit(orderId: string): Promise<unknown | null> {
  const { clientId, clientSecret, configured } = paypalCredentials();
  if (!configured) return null;
  try {
    const toolkit = new PayPalAgentToolkit({
      clientId,
      clientSecret,
      configuration: {
        actions: { orders: { get: true } },
        context: { sandbox: true },
      },
    });
    const tool = toolkit.getTools().get_order;
    if (!tool?.execute) return null;
    return await tool.execute({ id: orderId }, { toolCallId: "countersign-readback", messages: [] });
  } catch {
    return null;
  }
}
