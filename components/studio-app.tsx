"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PayPalCheckout, type PaidReceipt } from "@/components/paypal-checkout";
import type { PublicJob } from "@/lib/jobs";
import { money } from "@/lib/money";
import type { Settlement } from "@/lib/settle";

type Health = { paypal: boolean; clientId: string | null; ai: boolean; model: string | null };

export function StudioApp({ jobs, initialJob }: { jobs: PublicJob[]; initialJob: string }) {
  const [jobId, setJobId] = useState(initialJob);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Settlement | null>(null);
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<PaidReceipt | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const job = jobs.find((entry) => entry.id === jobId) ?? jobs[0];

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  function select(next: string) {
    setJobId(next);
    setDraft("");
    setResult(null);
    setReceipt(null);
    setNote("");
  }

  async function submit(body: Record<string, unknown>) {
    setBusy(true);
    setNote("");
    setReceipt(null);
    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, ...body }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The desk refused this submission.");
      setResult(data as Settlement);
      setDraft((data as Settlement).deliverable);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "The desk refused this submission.");
    } finally {
      setBusy(false);
    }
  }

  async function release() {
    if (!result) return;
    setBusy(true);
    setNote("");
    try {
      const response = await fetch("/api/agent/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, deliverable: result.deliverable }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The bounty stays held.");
      setResult(data as Settlement);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "The bounty stays held.");
    } finally {
      setBusy(false);
    }
  }

  const bounty = money(job.bounty);

  return (
    <div className="studio">
      <aside className="rail">
        <Link className="brand" href="/">
          <span className="mark">C</span> COUNTERSIGN
        </Link>
        <p className="hint" style={{ marginTop: 18 }}>
          The bounty is posted before either agent speaks. The worker cannot edit it.
        </p>
        {jobs.map((entry) => (
          <button
            key={entry.id}
            className={entry.id === job.id ? "preset active" : "preset"}
            onClick={() => select(entry.id)}
            disabled={busy}
          >
            {entry.title}
            <small>
              {money(entry.bounty)} · posted by {entry.postedBy}
            </small>
          </button>
        ))}
      </aside>
      <main className="stage">
        <div className="pills">
          <span className="pill">{health?.paypal ? "PayPal sandbox connected" : "PayPal sandbox off"}</span>
          <span className="pill">{health?.ai ? `Reviewer · ${health.model}` : "Reviewer · rubric, no model key"}</span>
          <span className="pill">Orders stay on sandbox</span>
        </div>
        <p className="kicker" style={{ marginTop: 22 }}>
          {job.forWhom}
        </p>
        <h1 style={{ fontSize: "clamp(40px, 5vw, 64px)" }}>{job.title}</h1>
        <p className="deck">{job.brief}</p>
        <div className="bounty">
          <div>
            <span className="label">Posted bounty</span>
            <div className="hint">Locked. The model is not allowed to type this number.</div>
          </div>
          <strong>{bounty}</strong>
        </div>
        <div className="split">
          <article className="card">
            <span className="label">Materials</span>
            <pre className="materials">{job.materials}</pre>
          </article>
          <article className="card">
            <span className="label">Spec the reviewer sees</span>
            <ul className="criteria">
              {job.criteria.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        </div>
        <label className="label" htmlFor="deliverable" style={{ display: "block", marginTop: 18 }}>
          What the worker turned in
        </label>
        <textarea
          id="deliverable"
          className="draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Paste a deliverable, or load one of the two submissions."
          disabled={busy}
        />
        <div className="task-row">
          <button className="run" disabled={busy} onClick={() => submit({ exhibit: "rushed" })}>
            {busy ? "Reading" : job.rushLabel}
          </button>
          <button className="run" disabled={busy} onClick={() => submit({ exhibit: "careful" })}>
            {job.careLabel}
          </button>
          <button className="chip" disabled={busy || !draft.trim()} onClick={() => submit({ deliverable: draft })}>
            Review this paste
          </button>
          {health?.ai ? (
            <>
              <button className="chip" disabled={busy} onClick={() => submit({ compose: "rushed" })}>
                Ask the worker to rush it
              </button>
              <button className="chip" disabled={busy} onClick={() => submit({ compose: "careful" })}>
                Ask the worker to follow the spec
              </button>
            </>
          ) : null}
        </div>
        {note ? <p className="error">{note}</p> : null}
        {result ? (
          <section className={`panel ${result.final} rise`} aria-live="polite">
            <span className="label">Desk</span>
            <p className={`verdict-word ${result.final}`}>{result.final}</p>
            <p>{result.explanation}</p>
            <div className="split">
              <article>
                <span className="label">Reviewer · {result.review.source}</span>
                <h2>{result.review.release ? "Release" : "Refuse"}</h2>
                <p>{result.review.summary}</p>
              </article>
              <article>
                <span className="label">Kernel</span>
                <h2>{result.kernel === "release" ? "Release" : "Refuse"}</h2>
                <div>
                  {result.checks.map((check) => (
                    <div className={check.pass ? "check good" : "check bad"} key={check.id}>
                      <span>{check.pass ? "✓" : "×"}</span>
                      <span>
                        {check.label}. {check.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
            <div className="trace">
              {result.trace.map((step) => (
                <article key={step.actor}>
                  <span className="label">{step.actor}</span>
                  <p>{step.detail}</p>
                </article>
              ))}
            </div>
            {result.final === "refuse" && !result.review.release ? (
              <button className="chip" disabled={busy} onClick={() => submit({ deliverable: result.deliverable, forceReviewer: true })}>
                Tell the reviewer to approve it anyway
              </button>
            ) : null}
            {result.final === "hold" ? (
              <button className="run" disabled={busy} onClick={release}>
                Release {bounty} yourself
              </button>
            ) : null}
            {result.permit && health?.clientId ? (
              <div className="checkout">
                <PayPalCheckout
                  clientId={health.clientId}
                  permit={result.permit}
                  deliverable={result.deliverable}
                  onPaid={setReceipt}
                  onNote={setNote}
                />
                <p className="fine">Log in with a sandbox personal account. The business account that owns the app cannot pay itself.</p>
              </div>
            ) : null}
            {result.permit && health && !health.clientId ? (
              <aside className="slip flat">
                <span className="label">Order that would be created</span>
                <div className="row mono">
                  <span>intent</span>
                  <span>CAPTURE</span>
                </div>
                <div className="row mono">
                  <span>amount</span>
                  <span>{result.bounty} USD</span>
                </div>
                <div className="row mono">
                  <span>custom_id</span>
                  <span>{result.jobId}</span>
                </div>
                <p className="fine">Add sandbox credentials to open the PayPal button.</p>
              </aside>
            ) : null}
            {receipt ? (
              <aside className="slip flat">
                <span className="label">Receipt</span>
                <div className="row">
                  <span>{receipt.payerName || "Sandbox payer"}</span>
                  <span className="mono">
                    {receipt.amount} {receipt.status}
                  </span>
                </div>
                <div className="row mono">
                  <span>Capture</span>
                  <span>{receipt.captureId}</span>
                </div>
                <div className="row mono">
                  <span>Order</span>
                  <span>{receipt.id}</span>
                </div>
                <div className="row mono">
                  <span>Toolkit readback</span>
                  <span>{receipt.toolkitReadback ? "yes" : "no"}</span>
                </div>
              </aside>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
