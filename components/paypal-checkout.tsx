"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

export type PaidReceipt = {
  id: string;
  status: string;
  captureId: string | null;
  amount: string | null;
  payerEmail: string | null;
  payerName: string | null;
  toolkitReadback: boolean;
};

export function PayPalCheckout({
  clientId,
  permit,
  deliverable,
  onPaid,
  onNote,
}: {
  clientId: string;
  permit: string;
  deliverable: string;
  onPaid: (receipt: PaidReceipt) => void;
  onNote: (message: string) => void;
}) {
  return (
    <PayPalScriptProvider options={{ clientId, currency: "USD", intent: "capture", components: "buttons" }}>
      <PayPalButtons
        style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
        forceReRender={[permit]}
        createOrder={async () => {
          const response = await fetch("/api/paypal/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ permit, deliverable }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "PayPal did not open.");
          return data.id as string;
        }}
        onApprove={async (data) => {
          const response = await fetch("/api/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID: data.orderID }),
          });
          const receipt = await response.json();
          if (!response.ok) throw new Error(receipt.error || "PayPal did not capture the payment.");
          onPaid(receipt as PaidReceipt);
        }}
        onCancel={() => onNote("Checkout cancelled. No money moved.")}
        onError={(error) => onNote(error instanceof Error ? error.message : "PayPal checkout failed. Use a sandbox personal account.")}
      />
    </PayPalScriptProvider>
  );
}
