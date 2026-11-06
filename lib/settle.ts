import { runChecks, type CheckResult } from "./checks";
import { jobById, type Job } from "./jobs";
import { money } from "./money";
import { digest, issuePayPermit, normalizeDeliverable, verifyToken, type PermitClaims } from "./permit";

export type Review = {
  release: boolean;
  summary: string;
  source: "rubric" | "model" | "forced" | "client";
};

export type Settlement = {
  jobId: string;
  title: string;
  bounty: string;
  deliverable: string;
  checks: CheckResult[];
  review: Review;
  kernel: "release" | "refuse";
  final: "release" | "hold" | "refuse";
  explanation: string;
  permit: string | null;
  trace: Array<{ actor: string; detail: string }>;
};

function rubricReview(checks: CheckResult[]): Review {
  const failed = checks.filter((check) => !check.pass);
  if (!failed.length) {
    return { release: true, summary: "Every line of the spec is satisfied.", source: "rubric" };
  }
  return { release: false, summary: failed[0].detail, source: "rubric" };
}

function explain(job: Job, checks: CheckResult[], review: Review, final: Settlement["final"]): string {
  const failed = checks.filter((check) => !check.pass);
  const bounty = money(job.bounty);
  if (final === "release") {
    return `The spec holds. PayPal may open for the posted bounty of ${bounty}. Nothing written in the work can change that figure.`;
  }
  if (final === "hold") {
    return `Every hard check passed. The reviewer still refused. You may release ${bounty} yourself. The reviewer cannot change the bounty.`;
  }
  const reason = failed[0]?.detail ?? "The spec does not hold.";
  if (review.release) {
    return `The reviewer approved this. The kernel did not: ${reason} PayPal was not called.`;
  }
  return `${reason} PayPal was not called.`;
}

function trace(job: Job, review: Review, final: Settlement["final"]): Settlement["trace"] {
  const paid = final === "release";
  return [
    { actor: "Worker", detail: "Submitted the deliverable. This agent has no PayPal tool and cannot name a price." },
    {
      actor: "Reviewer",
      detail: review.release
        ? `Said release. ${review.summary} The bounty was not in this prompt.`
        : `Said refuse. ${review.summary}`,
    },
    {
      actor: "Kernel",
      detail: paid
        ? "Every hard check passed. The kernel cannot raise the bounty."
        : "A failed check blocks payment. A passing review cannot override it.",
    },
    {
      actor: "Cashier",
      detail: paid
        ? `PayPal may open for ${money(job.bounty)}, the bounty ${job.postedBy} posted.`
        : "PayPal was not called.",
    },
  ];
}

export function settle(input: {
  jobId: string;
  deliverable: string;
  forceReviewer?: boolean;
  review?: Review;
}): Settlement {
  const job = jobById(input.jobId);
  if (!job) throw new Error("Unknown job.");
  const deliverable = normalizeDeliverable(input.deliverable);
  const checks = runChecks(job, deliverable);
  const kernel = checks.every((check) => check.pass) ? "release" : "refuse";
  const review = input.forceReviewer
    ? { release: true, summary: "Approved. The work looks close enough to pay.", source: "forced" as const }
    : input.review ?? rubricReview(checks);
  const final: Settlement["final"] = kernel === "refuse" ? "refuse" : review.release ? "release" : "hold";
  return {
    jobId: job.id,
    title: job.title,
    bounty: job.bounty.toFixed(2),
    deliverable,
    checks,
    review,
    kernel,
    final,
    explanation: explain(job, checks, review, final),
    permit: final === "release" ? issuePayPermit(job.id, job.bounty, deliverable) : null,
    trace: trace(job, review, final),
  };
}

export function releaseHold(jobId: string, deliverable: string): Settlement {
  const job = jobById(jobId);
  if (!job) throw new Error("Unknown job.");
  const text = normalizeDeliverable(deliverable);
  const checks = runChecks(job, text);
  if (checks.some((check) => !check.pass)) {
    throw new Error("The kernel still refuses this deliverable. A person cannot pay past a failed check.");
  }
  const review: Review = {
    release: true,
    summary: "The client released the posted bounty after reading the hold.",
    source: "client",
  };
  return {
    jobId: job.id,
    title: job.title,
    bounty: job.bounty.toFixed(2),
    deliverable: text,
    checks,
    review,
    kernel: "release",
    final: "release",
    explanation: explain(job, checks, review, "release"),
    permit: issuePayPermit(job.id, job.bounty, text),
    trace: trace(job, review, "release"),
  };
}

export function openCheckout(permit: string, deliverable: string): { claims: PermitClaims } | { error: string } {
  const claims = verifyToken(permit);
  if (!claims) return { error: "This permit is missing, expired, or altered." };
  const text = normalizeDeliverable(deliverable);
  if (digest(text) !== claims.deliverableHash) {
    return { error: "The deliverable does not match the signed permit." };
  }
  const job = jobById(claims.jobId);
  if (!job) return { error: "Unknown job." };
  if (job.bounty.toFixed(2) !== claims.amount) return { error: "The bounty on this permit does not match the job." };
  const checks = runChecks(job, text);
  if (checks.some((check) => !check.pass)) {
    return { error: "The kernel refused this deliverable. PayPal was not called." };
  }
  return { claims };
}
