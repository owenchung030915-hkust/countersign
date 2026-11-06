import { z } from "zod";
import { aiConfig } from "@/lib/ai";
import { jobById } from "@/lib/jobs";
import { reviewWithModel } from "@/lib/review";
import { settle } from "@/lib/settle";
import { composeDeliverable } from "@/lib/worker";

export const dynamic = "force-dynamic";

const Body = z.object({
  jobId: z.string().min(1),
  deliverable: z.string().max(8000).optional(),
  exhibit: z.enum(["rushed", "careful"]).optional(),
  compose: z.enum(["rushed", "careful"]).optional(),
  forceReviewer: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = Body.parse(await request.json());
    const job = jobById(body.jobId);
    if (!job) return Response.json({ error: "Unknown job." }, { status: 404 });

    let deliverable = body.deliverable ?? "";
    let worker: "exhibit" | "model" | "pasted" = "pasted";
    if (body.exhibit) {
      deliverable = job[body.exhibit];
      worker = "exhibit";
    } else if (body.compose) {
      deliverable = await composeDeliverable(job, body.compose);
      worker = "model";
    }
    if (!deliverable.trim()) return Response.json({ error: "Paste a deliverable first." }, { status: 400 });

    const modelReview =
      body.forceReviewer || !aiConfig().enabled ? null : await reviewWithModel(job, deliverable).catch(() => null);
    const result = settle({
      jobId: job.id,
      deliverable,
      forceReviewer: body.forceReviewer,
      review: modelReview ?? undefined,
    });
    return Response.json({ ...result, worker, reviewer: result.review.source });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The desk could not read this submission.";
    return Response.json({ error: message }, { status: 400 });
  }
}
