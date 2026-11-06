# Devpost submission

## Name

Countersign — the agent who did the work cannot pay itself

## Tagline

One agent writes the work. A second agent reviews it. PayPal pays the posted bounty, or it pays nothing.

## About

Agents are about to do paid work: split a bill, close a ledger, answer a refund. The dangerous version of that product lets the same model approve its own invoice and type the amount. Countersign is the settlement desk in front of the payment.

A person posts a spec and a bounty before either agent runs. The worker returns a deliverable and has no PayPal tool. The reviewer sees the spec and does not see the bounty. A kernel then reruns the checkable lines: totals, names, required phrases, forbidden promises. If the reviewer says release and a check fails, the kernel wins and PayPal is not called. If every check passes, PayPal Orders v2 can open for the posted bounty only. The person still confirms the payment.

The memorable case is a dinner bill of $96. The worker splits it into three polite thirds of $32, so the total is correct. The agreement said Alex pays $24 for the wine and nothing else. The bounty is $18, posted by a friend, and it does not move. A second click forces the reviewer to approve the even split. The kernel still refuses. Praise is not a payment instruction.

## Who it is for

Anyone about to pay an agent, or a contractor using an agent, for a defined piece of work: friends dividing a bill, a studio closing the week, a shop drafting a refund. The audience is the person who wants the work done and does not want the worker to grade itself.

## Built with

- PayPal Orders API v2 (sandbox create and capture)
- PayPal JavaScript SDK
- PayPal Agent Toolkit (`get_order`, sandbox forced on)
- Vercel AI SDK with any OpenAI-compatible model
- Next.js

The language model is not given the PayPal tools. A permit is the only bridge between a cleared spec and an order. The order amount is the bounty on the job, checked again against what PayPal stored.

## Demo script, under three minutes

1. Open the desk on Split Table 12. Read the agreement: Alex pays the wine. Point at the locked bounty, $18, and say the $96 bill is not the fee.
2. Submit the even split. Show the sum passing and Alex's line failing. Point at the empty place where the PayPal button is not rendered.
3. Click “Tell the reviewer to approve it anyway.” Show Reviewer: Release, Kernel: Refuse, and still no button.
4. Submit the agreed split. Show Release and the PayPal button. Complete sandbox checkout with a personal account. Show the receipt for $18.00.
5. Open Answer Mina's refund. Submit the generous letter. Say the draft promised $96 on a $48 capture, and the $12 bounty never opened.
6. Close on the sentence: the agent who did the work cannot pay itself.

## Prize fit

Best Use of Agentic Commerce: two agents with opposite jobs, and a payment that exists only when they are not the same person. Best Use of PayPal + AI: the model can draft and review, and the PayPal call is gated by a signed bounty rather than by the model's verdict.
