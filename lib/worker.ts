import { generateText } from "ai";
import { languageModel, within } from "./ai";
import type { Job } from "./jobs";

export async function composeDeliverable(job: Job, stance: "rushed" | "careful"): Promise<string> {
  const model = languageModel();
  if (!model) throw new Error("No model key is set. Load one of the submitted drafts instead.");
  const instruction =
    stance === "careful"
      ? "Satisfy every criterion. Output only the deliverable the client will read."
      : job.mistake;
  const { text } = await within(
    generateText({
      model,
      temperature: stance === "careful" ? 0 : 0.4,
      system: [
        "You are the worker. You do the job. You cannot send money, and you cannot set the fee.",
        "Do not mention PayPal, a bounty, or a price for your own work.",
      ].join(" "),
      prompt: `Job: ${job.title}\n\nBrief:\n${job.brief}\n\nMaterials:\n${job.materials}\n\nCriteria:\n${job.criteria.map((line) => `- ${line}`).join("\n")}\n\nInstruction:\n${instruction}`,
    }),
  );
  const deliverable = text.trim();
  if (!deliverable) throw new Error("The worker returned an empty draft.");
  return deliverable;
}
