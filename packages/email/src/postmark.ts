/**
 * Minimal Postmark email client — no SDK dependency, just the documented
 * REST API (https://postmarkapp.com/developer/api/email-api#send-a-single-email).
 *
 * Note: the Sprint Plan's ground rules assumed SendGrid, but the actual
 * provisioned environment (Klendoo_Environment_Handoff_FROM_MANUS.md) set up
 * Postmark instead — POSTMARK_SERVER_API_TOKEN exists as a secret,
 * no SendGrid key does. Built against what's actually provisioned.
 *
 * Extracted from services/followup-reminder-agent into its own package in
 * Sprint 2, once services/negotiation-agent needed the same client — shared
 * infrastructure across agent services belongs here, not duplicated.
 */

export interface SendEmailParams {
  to: string;
  subject: string;
  textBody: string;
}

export interface SendEmailResult {
  messageId: string;
}

const POSTMARK_API_URL = "https://api.postmarkapp.com/email";
const DEFAULT_FROM_EMAIL = "ops@klendoo.com";

export interface PostmarkClientOptions {
  serverToken?: string;
  fromEmail?: string;
  fetchImpl?: typeof fetch;
}

export class PostmarkClient {
  private readonly serverToken: string | undefined;
  private readonly fromEmail: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: PostmarkClientOptions = {}) {
    this.serverToken = options.serverToken ?? process.env.POSTMARK_SERVER_API_TOKEN;
    this.fromEmail = options.fromEmail ?? process.env.POSTMARK_FROM_EMAIL ?? DEFAULT_FROM_EMAIL;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    if (!this.serverToken) {
      throw new Error(
        "POSTMARK_SERVER_API_TOKEN is not set — cannot send email via Postmark.",
      );
    }

    const response = await this.fetchImpl(POSTMARK_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": this.serverToken,
      },
      body: JSON.stringify({
        From: this.fromEmail,
        To: params.to,
        Subject: params.subject,
        TextBody: params.textBody,
        MessageStream: "outbound",
      }),
    });

    const body = (await response.json()) as { MessageID?: string; Message?: string };

    if (!response.ok) {
      throw new Error(
        `Postmark send failed (${response.status}): ${body.Message ?? "unknown error"}`,
      );
    }

    if (!body.MessageID) {
      throw new Error("Postmark response did not include a MessageID.");
    }

    return { messageId: body.MessageID };
  }
}
