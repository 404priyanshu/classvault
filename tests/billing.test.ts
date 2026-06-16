import { describe, expect, it } from "vitest";
import { createCheckoutSessionSchema } from "@/lib/server/validation";

describe("createCheckoutSessionSchema", () => {
  it("accepts a valid institutionId and defaults plan to starter", () => {
    const parsed = createCheckoutSessionSchema.parse({ institutionId: "inst_123" });
    expect(parsed).toMatchObject({ institutionId: "inst_123", plan: "starter" });
  });

  it("accepts explicit plan values", () => {
    expect(createCheckoutSessionSchema.parse({ institutionId: "i1", plan: "pro" }).plan).toBe("pro");
    expect(createCheckoutSessionSchema.parse({ institutionId: "i1", plan: "enterprise" }).plan).toBe("enterprise");
  });

  it("rejects missing or invalid inputs", () => {
    expect(() => createCheckoutSessionSchema.parse({ institutionId: "" })).toThrow();
    expect(() => createCheckoutSessionSchema.parse({ institutionId: "i1", plan: "invalid" })).toThrow();
    expect(() => createCheckoutSessionSchema.parse({})).toThrow();
  });
});
