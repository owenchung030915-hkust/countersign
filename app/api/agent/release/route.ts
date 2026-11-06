import { z } from "zod";
import { releaseHold } from "@/lib/settle";

export const dynamic = "force-dynamic";

const Body = z.object({
  jobId: z.string().min(1),
  deliverable: z.string().min(1).max(8000),
});

export async function POST(request: Request) {
  try {
    const body = Body.parse(await request.json());
    return Response.json(releaseHold(body.jobId, body.deliverable));
  } catch (error) {
    const message = error instanceof Error ? error.message : "The bounty stays held.";
    return Response.json({ error: message }, { status: 403 });
  }
}
