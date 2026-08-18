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
import { PostmarkClient } from "./postmark.js";
import { buildReminderEmail } from "./reminderEmail.js";
import { contextFromQuery } from "./reminderContextQuery.js";

const PORT = Number(process.env.PORT ?? 4021);

/**
 * Klendoo's own receiving address for this endpoint's x402 payments.
 *
 * Per Veer's wallet model (2026-08-17): Klendoo has one master/manager
 * wallet, separate from every individual person's custodial wallet — this
 * should be that master wallet's address. Defaulting to the Intermezzo
 * manager wallet Manus provisioned is an assumption, not a confirmed
 * decision — flag if wrong.
 */
function requirePayToAddress(): string {
  const address = process.env.KLENDOO_PAYTO_ADDRESS;
  if (!address) {
    throw new Error(
      "KLENDOO_PAYTO_ADDRESS is not set — this is Klendoo's own receiving wallet for x402 " +
        "payments (see Manus's TestNet wallet state: the Intermezzo manager address is the " +
        "current best candidate, pending confirmation).",
    );
  }
  return address;
}

async function main() {
  const app = express();
  app.use(express.json());

  const payToAddress = requirePayToAddress();
  const network = resolveNetwork();
  const price = await resolveDefaultPrice("reminder");
  const server = createResourceServer();

  // GET, not POST: Intermezzo's x402/fetch gateway (the actual payer for
  // this endpoint, per Manus's handoff) only ever issues a plain GET with
  // no body — confirmed against its reference x402-client.service.ts. The
  // booking context travels as query params instead (reminderContextQuery.ts).
  app.use(
    paymentMiddleware(
      {
        "GET /agents/reminder": {
          accepts: {
            scheme: "exact",
            network,
            price: `$${price}`,
            payTo: payToAddress,
            // Read back by payment-core's settlement hooks to know which
            // ClientInteraction.actionType this route's payments are for.
            extra: { actionType: "reminder" },
          },
          description:
            "Send a booking reminder email and settle the action — Agent 3 (Reminder & Follow-up).",
          mimeType: "application/json",
          extensions: {
            ...declareDiscoveryExtension({
              output: { example: { ok: true, emailMessageId: "example" } },
            }),
          },
        },
      },
      server,
    ),
  );

  // Runs only once payment has already settled — the middleware above
  // handles the 402 challenge/verify/settle round trip before Express ever
  // reaches this handler. A failure here (e.g. Postmark down) happens
  // *after* the caller has already paid; there's no clean rollback in x402
  // for that today, so this is a known limitation, not an oversight — see
  // README.
  app.get("/agents/reminder", async (req, res) => {
    try {
      const context = contextFromQuery(req.query as Record<string, unknown>);
      const { messageId } = await new PostmarkClient().sendEmail(buildReminderEmail(context));
      res.json({ ok: true, emailMessageId: messageId });
    } catch (err) {
      console.error("Reminder send failed after settlement:", err);
      res.status(500).json({ ok: false, error: (err as Error).message });
    }
  });

  app.listen(PORT, () => {
    console.log(`Reminder agent (x402-paid) listening on :${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start reminder agent:", err);
  process.exitCode = 1;
});
