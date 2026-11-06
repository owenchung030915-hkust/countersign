import Link from "next/link";

const jobs = [
  {
    href: "/studio?job=trip-split",
    kicker: "The total is right",
    title: "An even split of a $96 dinner",
    body: "The lines add up. Alex still gets billed for wine they didn't agree to share. The $18 bounty stays closed.",
  },
  {
    href: "/studio?job=expense-close",
    kicker: "A category, not a price",
    title: "A subscription filed as travel",
    body: "The worker drops a lamp and relabels a $29 subscription. Payroll does not open for the $24 bounty.",
  },
  {
    href: "/studio?job=refund-letter",
    kicker: "The letter is not the refund",
    title: "A draft that doubles a capture",
    body: "The agent promises $96 on a $48 capture. The shop pays $12 for a correct letter, or it pays nothing.",
  },
];

const steps = [
  { n: "01", title: "Post", body: "A person writes the spec and a bounty. That number is locked before either agent runs." },
  { n: "02", title: "Work", body: "The worker returns a deliverable. It has no PayPal tool, and it never sees the bounty." },
  { n: "03", title: "Review", body: "A second agent reads the spec. It can refuse a clean draft. It cannot raise the price." },
  { n: "04", title: "Veto", body: "A kernel reruns the amounts and the required lines. A glowing review cannot outvote a failed check." },
  { n: "05", title: "Pay", body: "PayPal opens for the posted bounty only. The person still confirms the payment." },
];

export default function HomePage() {
  return (
    <>
      <header className="nav">
        <Link className="brand" href="/">
          <span className="mark">C</span> COUNTERSIGN
        </Link>
        <nav className="nav-links">
          <a href="#how">How a bounty clears</a>
          <Link href="/studio">Open the desk</Link>
        </nav>
      </header>
      <main>
        <section className="wrap hero">
          <div>
            <p className="kicker">Agentic commerce</p>
            <h1>The agent who did the work cannot pay itself.</h1>
            <p className="deck">
              Countersign is a settlement desk for paid agent work. One agent writes the deliverable. A second agent says
              whether it matches a spec. A hard check can veto that review. PayPal opens only for a bounty a person posted
              first — never for a number the worker typed into the page.
            </p>
            <div className="actions">
              <Link className="btn" href="/studio?job=trip-split">
                Watch an even split get refused
              </Link>
              <Link className="ghost" href="/studio?job=refund-letter">
                Open a refund letter
              </Link>
            </div>
            <p className="fine">Sandbox only. Neither agent receives a PayPal secret.</p>
          </div>
          <aside className="slip" aria-label="A review that does not get paid">
            <header>
              <span className="label">Table 12</span>
              <span className="mono">Bounty $18.00</span>
            </header>
            <hr className="rule-line" />
            <div className="row">
              <span>Reviewer</span>
              <strong>Release</strong>
            </div>
            <div className="row">
              <span>Kernel</span>
              <strong className="outcome block">Refuse</strong>
            </div>
            <p>Alex is billed 32.00. The agreement says 24.00.</p>
            <p className="verdict-word deny">Refuse</p>
            <hr className="rule-line" />
            <div className="row mono">
              <span>PayPal order</span>
              <span>not created</span>
            </div>
          </aside>
        </section>
        <section className="wrap section">
          <h2>Three jobs. The fee never comes from the document.</h2>
          <p className="deck">The dinner is $96, the ledger sums to $186.40, the capture was $48. None of those numbers is the PayPal amount.</p>
          <div className="grid-3">
            {jobs.map((job) => (
              <Link className="card" key={job.href} href={job.href}>
                <span className="kicker">{job.kicker}</span>
                <h3>{job.title}</h3>
                <p>{job.body}</p>
              </Link>
            ))}
          </div>
        </section>
        <section className="wrap section" id="how">
          <h2>Praise is not a payment instruction.</h2>
          <div className="grid-5">
            {steps.map((step) => (
              <article className="step" key={step.n}>
                <span>{step.n}</span>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="wrap site-foot">
        <span>Built for the PayPal AI Hackathon. Orders stay on the sandbox.</span>
        <span>MIT</span>
      </footer>
    </>
  );
}
