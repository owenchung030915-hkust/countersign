import { generateObject } from "ai";
import { z } from "zod";
import { languageModel, within } from "./ai";
import type { Job } from "./jobs";
import type { Review } from "./settle";

const ReviewSchema = z.object({
  release: z.boolean(),
  summary: z.string().min(1).max(400),
});

export async function reviewWithModel(job: Job, deliverable: string): Promise<Review | null> {
  const model = languageModel();
  if (!model) return null;
  const { object } = await within(
    generateObject({
      model,
      schema: ReviewSchema,
      temperature: 0,
      system: [
        "You review a deliverable against a written spec.",
        "You do not know the price, and you must not propose one.",
        "Release only if every criterion is met.",
        "If you refuse, the summary quotes the failing line.",
        "Two sentences at most.",
      ].join(" "),
      prompt: `Spec:\n${job.criteria.map((line) => `- ${line}`).join("\n")}\n\nMaterials:\n${job.materials}\n\nDeliverable:\n${deliverable}`,
    }),
  );
  return { release: object.release, summary: object.summary, source: "model" };
}
