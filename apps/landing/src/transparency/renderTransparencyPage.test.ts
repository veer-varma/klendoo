import { describe, expect, it } from "vitest";
import { renderTransparencyPage } from "./renderTransparencyPage.js";

describe("renderTransparencyPage", () => {
  it("renders an empty state with no rows", () => {
    const html = renderTransparencyPage([]);
    expect(html).toContain("No settlements yet");
    expect(html).not.toContain("<table>");
  });

  it("renders a table row per settlement, escaped", () => {
    const html = renderTransparencyPage([
      {
        interactionId: "int-1",
        actionType: "reminder",
        amount: "0.15",
        currency: "USDC",
        network: "algorand-testnet",
        txnHash: "0xABC<script>",
        settledAt: "2026-08-17T00:00:00.000Z",
      },
    ]);

    expect(html).toContain("<table>");
    expect(html).toContain("reminder");
    expect(html).toContain("0.15");
    expect(html).toContain("algorand-testnet");
    expect(html).toContain("0xABC&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("1 settlement recorded");
  });

  it("pluralizes the count correctly for multiple rows", () => {
    const row = {
      interactionId: "x",
      actionType: "reminder",
      amount: "0.15",
      currency: "USDC",
      network: "algorand-testnet",
      txnHash: "0x1",
      settledAt: "2026-08-17T00:00:00.000Z",
    };
    const html = renderTransparencyPage([row, { ...row, interactionId: "y", txnHash: "0x2" }]);
    expect(html).toContain("2 settlements recorded");
  });
});
