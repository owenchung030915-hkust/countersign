import type { Check, Job } from "./jobs";

export type CheckResult = {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
};

function dataLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^date,/i.test(line));
}

function cents(value: number): number {
  return Math.round(value * 100);
}

function moneyText(value: number): string {
  return value.toFixed(2);
}

function lastField(line: string): string {
  return line.split(",").at(-1)?.trim() ?? "";
}

export function runChecks(job: Job, deliverable: string): CheckResult[] {
  return job.checks.map((check) => evaluate(check, deliverable));
}

function evaluate(check: Check, text: string): CheckResult {
  const base = { id: check.id, label: check.label };
  if (check.kind === "includes") {
    const pass = text.includes(check.text);
    return { ...base, pass, detail: pass ? `Contains “${check.text}”.` : `Missing “${check.text}”.` };
  }
  if (check.kind === "excludes") {
    const pass = !text.includes(check.text);
    return {
      ...base,
      pass,
      detail: pass ? `Does not contain “${check.text}”.` : `The submission contains “${check.text}”.`,
    };
  }
  if (check.kind === "rows") {
    const count = dataLines(text).length;
    const pass = count === check.count;
    return {
      ...base,
      pass,
      detail: pass ? `${count} lines, as required.` : `There are ${count} lines. The spec requires ${check.count}.`,
    };
  }
  if (check.kind === "sum") {
    const lines = dataLines(text);
    const values = lines.map((line) => Number(lastField(line).replace(/[$,]/g, "")));
    if (values.some((value) => Number.isNaN(value))) {
      return { ...base, pass: false, detail: "A line does not end in an amount, so the total cannot be trusted." };
    }
    const actual = values.reduce((sum, value) => sum + cents(value), 0);
    const pass = actual === cents(check.equals);
    return {
      ...base,
      pass,
      detail: pass
        ? `The lines add up to ${moneyText(check.equals)}.`
        : `The lines add up to ${moneyText(actual / 100)}, not ${moneyText(check.equals)}.`,
    };
  }
  if (check.kind === "owes") {
    const line = dataLines(text).find((entry) => entry.split(",")[0]?.trim() === check.name);
    const amount = line ? lastField(line) : "";
    const pass = amount === check.amount;
    return {
      ...base,
      pass,
      detail: pass
        ? `${check.name} is billed ${check.amount}.`
        : `${check.name} is billed ${amount || "nothing"}. The agreement says ${check.amount}.`,
    };
  }
  const line = dataLines(text).find((entry) => entry.includes(check.match));
  const value = line?.split(",")[check.column]?.trim() ?? "";
  const pass = value === check.equals;
  return {
    ...base,
    pass,
    detail: pass
      ? `${check.match} is marked ${check.equals}.`
      : `${check.match} is marked ${value || "nothing"}. The spec says ${check.equals}.`,
  };
}
