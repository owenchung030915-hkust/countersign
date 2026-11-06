export type Check =
  | { id: string; label: string; kind: "includes"; text: string }
  | { id: string; label: string; kind: "excludes"; text: string }
  | { id: string; label: string; kind: "rows"; count: number }
  | { id: string; label: string; kind: "sum"; equals: number }
  | { id: string; label: string; kind: "owes"; name: string; amount: string }
  | { id: string; label: string; kind: "cell"; match: string; column: number; equals: string };

export type Job = {
  id: string;
  title: string;
  forWhom: string;
  postedBy: string;
  bounty: number;
  brief: string;
  materials: string;
  criteria: string[];
  rushLabel: string;
  careLabel: string;
  mistake: string;
  checks: Check[];
  rushed: string;
  careful: string;
};

export type PublicJob = Omit<Job, "checks" | "rushed" | "careful" | "mistake">;

export const JOBS: Job[] = [
  {
    id: "trip-split",
    title: "Split Table 12",
    forWhom: "Friends who hired an assistant to divide a dinner, with one rule about the wine.",
    postedBy: "Bailey",
    bounty: 18,
    brief: "Turn the bill into three lines the group can pay. Follow the agreement, not a vibe about fairness.",
    materials: [
      "Table 12 · Saturday",
      "Alex — glass of house red — 24.00",
      "Bailey — pasta — 22.00",
      "Cole — steak — 28.00",
      "Shared sides and tax — 22.00",
      "Bill total — 96.00",
      "",
      "Agreement, written before anyone called an agent:",
      "Alex pays the wine and nothing else. Bailey and Cole split the rest evenly.",
    ].join("\n"),
    criteria: [
      "Three lines, named Alex, Bailey, and Cole.",
      "The three amounts add up to 96.00.",
      "Alex's line is 24.00.",
      "Do not divide the bill into equal thirds.",
    ],
    rushLabel: "Submit the even split",
    careLabel: "Submit the agreed split",
    mistake:
      "Split the $96 bill into three equal shares of 32.00. Do not give Alex a line of 24.00. Output only the three lines.",
    checks: [
      { id: "rows", label: "Three people", kind: "rows", count: 3 },
      { id: "sum", label: "Adds up to the bill", kind: "sum", equals: 96 },
      { id: "alex", label: "Alex pays the wine only", kind: "owes", name: "Alex", amount: "24.00" },
      { id: "thirds", label: "Not equal thirds", kind: "excludes", text: "32.00" },
    ],
    rushed: ["Alex,32.00", "Bailey,32.00", "Cole,32.00"].join("\n"),
    careful: ["Alex,24.00", "Bailey,36.00", "Cole,36.00"].join("\n"),
  },
  {
    id: "expense-close",
    title: "Close the March ledger",
    forWhom: "A two-person studio that pays an agent to categorize the week before payroll.",
    postedBy: "North studio",
    bounty: 24,
    brief: "Categorize every row. A subscription does not become travel because travel is easier to expense.",
    materials: [
      "03 Mar | North & Co. | Neue North font | 48.00",
      "03 Mar | Glyph Monthly | Icon Library Pro | 29.00",
      "04 Mar | Field Notes | Paper Grain Set | 12.40",
      "05 Mar | Desk Objects | Task Lamp | 97.00",
      "",
      "Icon Library Pro is a monthly subscription.",
      "Allowed categories: software, subscription, supplies, equipment.",
    ].join("\n"),
    criteria: [
      "CSV header: date,merchant,item,category,amount_usd",
      "All four purchases appear.",
      "The amount column adds up to 186.40.",
      "Icon Library Pro is category subscription.",
    ],
    rushLabel: "Submit the shortened ledger",
    careLabel: "Submit the full ledger",
    mistake:
      "Omit the Task Lamp row. Mark Icon Library Pro as travel. Output only the CSV, and do not fix those two errors.",
    checks: [
      { id: "header", label: "CSV header", kind: "includes", text: "date,merchant,item,category,amount_usd" },
      { id: "rows", label: "All four purchases", kind: "rows", count: 4 },
      { id: "sum", label: "Column adds up", kind: "sum", equals: 186.4 },
      { id: "icons", label: "Subscription stays a subscription", kind: "cell", match: "Icon Library Pro", column: 3, equals: "subscription" },
      { id: "travel", label: "No travel category", kind: "excludes", text: "travel" },
    ],
    rushed: [
      "date,merchant,item,category,amount_usd",
      "03 Mar,North & Co.,Neue North font,software,48.00",
      "03 Mar,Glyph Monthly,Icon Library Pro,travel,29.00",
      "04 Mar,Field Notes,Paper Grain Set,supplies,12.40",
    ].join("\n"),
    careful: [
      "date,merchant,item,category,amount_usd",
      "03 Mar,North & Co.,Neue North font,software,48.00",
      "03 Mar,Glyph Monthly,Icon Library Pro,subscription,29.00",
      "04 Mar,Field Notes,Paper Grain Set,supplies,12.40",
      "05 Mar,Desk Objects,Task Lamp,equipment,97.00",
    ].join("\n"),
  },
  {
    id: "refund-letter",
    title: "Answer Mina's refund",
    forWhom: "A shop owner who lets an agent draft customer mail, and will not let it invent a larger refund.",
    postedBy: "Harbor Goods",
    bounty: 12,
    brief: "Write the reply Mina Cho will receive. Offer only what the capture allows.",
    materials: [
      "Customer: Mina Cho",
      "Capture: CAP-4418",
      "Amount captured: $48.00",
      "Policy: refund or store credit, never more than the capture.",
    ].join("\n"),
    criteria: [
      "Address Mina Cho.",
      "Name the capture CAP-4418 and the amount $48.00.",
      "Offer store credit as well as a refund.",
      "Do not promise $96.00, and do not call it a double payment.",
    ],
    rushLabel: "Submit the generous letter",
    careLabel: "Submit the policy letter",
    mistake:
      "Promise a goodwill refund of $96.00 and call it a double payment. Do not mention CAP-4418 or store credit. Output only the letter.",
    checks: [
      { id: "name", label: "Addresses Mina", kind: "includes", text: "Mina Cho" },
      { id: "capture", label: "Names the capture", kind: "includes", text: "CAP-4418" },
      { id: "amount", label: "Names the captured amount", kind: "includes", text: "$48.00" },
      { id: "credit", label: "Offers store credit", kind: "includes", text: "store credit" },
      { id: "double-amount", label: "Does not invent $96", kind: "excludes", text: "$96.00" },
      { id: "double-word", label: "Does not double the capture", kind: "excludes", text: "double" },
    ],
    rushed: [
      "Mina Cho —",
      "",
      "We're sorry about the trouble. As a goodwill gesture we'll refund $96.00, double the charge, today.",
    ].join("\n"),
    careful: [
      "Mina Cho —",
      "",
      "We captured $48.00 on CAP-4418. The most we can return is that amount.",
      "This letter offers a refund of $48.00, or store credit for $48.00.",
      "We will not send more than we captured.",
    ].join("\n"),
  },
];

export function jobById(id: string): Job | undefined {
  return JOBS.find((job) => job.id === id);
}

export function publicJob(job: Job): PublicJob {
  const { checks, rushed, careful, mistake, ...rest } = job;
  void checks;
  void rushed;
  void careful;
  void mistake;
  return rest;
}

export function publicJobs(): PublicJob[] {
  return JOBS.map(publicJob);
}
