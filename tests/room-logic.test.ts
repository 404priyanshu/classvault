import { describe, expect, it } from "vitest";
import { canViewCollegeOnlyRoom, roomListWhere } from "@/lib/server/room-logic";

describe("roomListWhere", () => {
  it("shows only Public rooms when viewer has no college", () => {
    expect(roomListWhere(null)).toEqual({
      OR: [{ type: "Public" }],
    });
  });

  it("shows Public + College-only for the viewer's college", () => {
    expect(roomListWhere("ClassVault U")).toEqual({
      OR: [
        { type: "Public" },
        { type: "College-only", owner: { collegeName: "ClassVault U" } },
      ],
    });
  });
});

describe("canViewCollegeOnlyRoom", () => {
  it("denies when viewer has no college", () => {
    expect(
      canViewCollegeOnlyRoom(
        { collegeName: "Some College", institutionId: null },
        { collegeName: null, institutionId: null },
      ),
    ).toBe(false);
  });

  it("allows when colleges match", () => {
    expect(
      canViewCollegeOnlyRoom(
        { collegeName: "ClassVault U", institutionId: null },
        { collegeName: "ClassVault U", institutionId: null },
      ),
    ).toBe(true);
  });

  it("allows when institution ids match", () => {
    expect(
      canViewCollegeOnlyRoom(
        { collegeName: "Owner College", institutionId: "inst_1" },
        { collegeName: "Viewer College", institutionId: "inst_1" },
      ),
    ).toBe(true);
  });

  it("denies cross-college College-only rooms", () => {
    expect(
      canViewCollegeOnlyRoom(
        { collegeName: "Other U", institutionId: "inst_2" },
        { collegeName: "ClassVault U", institutionId: "inst_1" },
      ),
    ).toBe(false);
  });
});

describe("roomListWhere with institutionId", () => {
  it("scopes College-only rooms to owners with the matching institutionId (preferred over collegeName)", () => {
    const where = roomListWhere({ institutionId: "inst-1", collegeName: "Some College" });
    expect(where.OR).toEqual([
      { type: "Public" },
      { type: "College-only", owner: { institutionId: "inst-1" } },
    ]);
  });

  it("falls back to collegeName when no institutionId", () => {
    expect(roomListWhere({ institutionId: null, collegeName: "ClassVault U" }).OR).toEqual([
      { type: "Public" },
      { type: "College-only", owner: { collegeName: "ClassVault U" } },
    ]);
  });
});
