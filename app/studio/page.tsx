import { StudioApp } from "@/components/studio-app";
import { jobById, publicJobs } from "@/lib/jobs";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const params = await searchParams;
  const jobs = publicJobs();
  const initial = jobById(params.job ?? "")?.id ?? jobs[0].id;
  return <StudioApp jobs={jobs} initialJob={initial} />;
}
