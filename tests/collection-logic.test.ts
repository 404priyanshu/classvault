import { describe, expect, it } from "vitest";
import { collectionSlugVisibility, collectionSlugWhere } from "@/lib/server/collection-logic";

describe("collectionSlugWhere", () => {
  it("allows anonymous visitors to resolve only public collections by slug", () => {
    expect(collectionSlugWhere("dbms-end-sem-sprint", null)).toEqual({
      slug: "dbms-end-sem-sprint",
      OR: [{ isPublic: true }],
    });
  });

  it("allows signed-in users to resolve public collections or collections they own", () => {
    expect(collectionSlugWhere("dbms-end-sem-sprint", "user-1")).toEqual({
      slug: "dbms-end-sem-sprint",
      OR: [{ isPublic: true }, { ownerId: "user-1" }],
    });
  });
});

describe("collectionSlugVisibility", () => {
  it("does not add an owner branch without a requester id", () => {
    expect(collectionSlugVisibility(null)).toEqual([{ isPublic: true }]);
  });
});
