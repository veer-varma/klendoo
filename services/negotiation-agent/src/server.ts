#!/usr/bin/env node
import "dotenv/config";
import express from "express";
import { paymentMiddleware } from "@x402/express";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import {
  createResourceServer,
  resolveNetwork,
  resolveDefaultPrice,
} from "@klendoo/payment-core";
import { getDb } from "@klendoo/db";
import { PostmarkClient } from "@klendoo/email";
import { buildPollInvitationEmail } from "./pollEmail.js";
import { renderResponseForm, renderResponseThanks } from "./responseForm.js";

const PORT = Number(process.env.PORT ?? 4022);

/** Same open question as the Reminder agent's server.ts — see that file's comment. */
function requirePayToAddress(): string {
  const address = process.env.KLENDOO_PAYTO_ADDRESS;
  if (!address) {
    throw new Error(
      "KLENDOO_PAYTO_ADDRESS is not set — this is Klendoo's own receiving wallet for x402 payments.",
    );
  }
  return address;
}

/** Used to build the response link that goes out in outreach emails — can't
 * be derived from a request context, since that context doesn't exist yet
 * when the email is sent. */
function requirePublicBaseUrl(): string {
  const url = process.env.PUBLIC_BASE_URL;
  if (!url) {
    throw new Error(
      "PUBLIC_BASE_URL is not set — needed to build the poll response links sent in outreach email.",
    );
  }
  return url.replace(/\/$/, "");
}

async function main() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const payToAddress = requirePayToAddress();
  const publicBaseUrl = requirePublicBaseUrl();
  const network = resolveNetwork();
  const price = await resolveDefaultPrice("negotiation");
  const server = createResourceServer();

  // Same reasoning as the Reminder agent: GET only, no body — Intermezzo's
  // x402/fetch gateway can't carry one. contextRef (the poll id) travels as
  // a query param, same convention as the Reminder agent.
  app.use(
    paymentMiddleware(
      {
        "GET /agents/negotiate": {
          accepts: {
            scheme: "exact",
            network,
            price: `$${price}`,
            payTo: payToAddress,
            extra: { actionType: "negotiation" },
          },
          description:
            "Activate a scheduling poll and notify invitees — Agent 2 (Negotiation).",
          mimeType: "application/json",
          extensions: {
            ...declareDiscoveryExtension({
              output: { example: { ok: true, invitees: 1 } },
            }),
          },
        },
      },
      server,
    ),
  );

  // Runs only once payment has settled — see the Reminder agent's server.ts
  // for the same known limitation (payment already happened if this fails).
  app.get("/agents/negotiate", async (req, res) => {
    try {
      const pollId = req.query.contextRef;
      if (typeof pollId !== "string") {
        res.status(400).json({ ok: false, error: "Missing contextRef (poll id)." });
        return;
      }

      const poll = await getDb().schedulingPoll.findUnique({
        where: { id: pollId },
        include: { slots: true, invitees: true },
      });

      if (!poll) {
        res.status(404).json({ ok: false, error: "Poll not found." });
        return;
      }
      if (poll.status !== "DRAFT") {
        res.status(409).json({ ok: false, error: `Poll is already ${poll.status}, not DRAFT.` });
        return;
      }

      await getDb().schedulingPoll.update({
        where: { id: poll.id },
        data: { status: "OPEN", openedAt: new Date() },
      });

      const postmark = new PostmarkClient();
      for (const invitee of poll.invitees) {
        const email = buildPollInvitationEmail({
          hostName: poll.hostName,
          title: poll.title,
          deadline: poll.deadline.toISOString(),
          inviteeName: invitee.name,
          inviteeEmail: invitee.email,
          responseUrl: `${publicBaseUrl}/polls/${invitee.token}`,
          slots: poll.slots.map((s) => ({
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
          })),
        });
        await postmark.sendEmail(email);
      }

      res.json({ ok: true, invitees: poll.invitees.length });
    } catch (err) {
      console.error("Poll activation failed after settlement:", err);
      res.status(500).json({ ok: false, error: (err as Error).message });
    }
  });

  // Not paid — invitees don't pay to respond.
  app.get("/polls/:token", async (req, res) => {
    const invitee = await getDb().pollInvitee.findUnique({
      where: { token: req.params.token },
      include: { poll: { include: { slots: true } }, responses: true },
    });

    if (!invitee) {
      res.status(404).send("Not found.");
      return;
    }

    const existingAvailable = invitee.responses.filter((r) => r.available).map((r) => r.slotId);

    res.type("html").send(
      renderResponseForm({
        pollTitle: invitee.poll.title,
        hostName: invitee.poll.hostName,
        deadline: invitee.poll.deadline.toISOString(),
        inviteeName: invitee.name,
        slots: invitee.poll.slots.map((s) => ({
          id: s.id,
          startTime: s.startTime.toISOString(),
          endTime: s.endTime.toISOString(),
        })),
        existingAvailable,
      }),
    );
  });

  app.post("/polls/:token", async (req, res) => {
    const invitee = await getDb().pollInvitee.findUnique({
      where: { token: req.params.token },
      include: { poll: { include: { slots: true } } },
    });

    if (!invitee) {
      res.status(404).send("Not found.");
      return;
    }

    const body = req.body as Record<string, string | undefined>;
    for (const slot of invitee.poll.slots) {
      const available = body[`slot_${slot.id}`] !== undefined;
      await getDb().pollResponse.upsert({
        where: { slotId_inviteeId: { slotId: slot.id, inviteeId: invitee.id } },
        create: { pollId: invitee.pollId, slotId: slot.id, inviteeId: invitee.id, available },
        update: { available },
      });
    }
    await getDb().pollInvitee.update({
      where: { id: invitee.id },
      data: { respondedAt: new Date() },
    });

    res.type("html").send(renderResponseThanks(invitee.poll.title));
  });

  app.listen(PORT, () => {
    console.log(`Negotiation agent (x402-paid) listening on :${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start negotiation agent:", err);
  process.exitCode = 1;
});
