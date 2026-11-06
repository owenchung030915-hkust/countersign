import { createHash, createHmac, timingSafeEqual } from "crypto";

export type PermitClaims = {
  v: 1;
  kind: "pay";
  jobId: string;
  amount: string;
  deliverableHash: string;
  exp: number;
};

const FIFTEEN_MINUTES = 15 * 60 * 1000;

function secret(): string {
  return process.env.MANDATE_SECRET || process.env.COUNTERSIGN_SECRET || "mandate-hackathon-dev-secret";
}

export function normalizeDeliverable(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

export function digest(text: string): string {
  return createHash("sha256").update(normalizeDeliverable(text)).digest("hex");
}

function sign(claims: PermitClaims): string {
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyToken(token: string): PermitClaims | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PermitClaims;
    if (claims.v !== 1 || claims.kind !== "pay" || claims.exp < Date.now()) return null;
    if (!claims.jobId || !claims.amount || !claims.deliverableHash) return null;
    return claims;
  } catch {
    return null;
  }
}

export function issuePayPermit(jobId: string, amount: number, deliverable: string): string {
  return sign({
    v: 1,
    kind: "pay",
    jobId,
    amount: amount.toFixed(2),
    deliverableHash: digest(deliverable),
    exp: Date.now() + FIFTEEN_MINUTES,
  });
}
