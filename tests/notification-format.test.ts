import { describe, expect, it } from "vitest";
import { describeNotification } from "@/lib/notification-format";

describe("describeNotification", () => {
  it("describes an approved note", () => {
    expect(describeNotification({ type: "NOTE_APPROVED", payload: { noteTitle: "DBMS" } })).toEqual({
      title: "Note approved",
      detail: '"DBMS" is now published.',
    });
  });

  it("includes the rejection reason when present", () => {
    expect(
      describeNotification({ type: "NOTE_REJECTED", payload: { noteTitle: "DBMS", reason: "blurry scan" } }),
    ).toEqual({ title: "Note rejected", detail: '"DBMS": blurry scan' });
  });

  it("falls back to a generic rejection detail without a reason", () => {
    expect(describeNotification({ type: "NOTE_REJECTED", payload: { noteTitle: "DBMS" } })).toEqual({
      title: "Note rejected",
      detail: '"DBMS" was rejected.',
    });
  });

  it("describes a new comment with the commenter name", () => {
    expect(
      describeNotification({ type: "COMMENT_NEW", payload: { noteTitle: "DBMS", byName: "Ann" } }),
    ).toEqual({ title: "New comment", detail: 'Ann commented on "DBMS".' });
  });

  it("describes a reply with the snippet when present", () => {
    expect(
      describeNotification({ type: "COMMENT_REPLY", payload: { byName: "Ann", snippet: "thanks!" } }),
    ).toEqual({ title: "New reply", detail: "Ann: thanks!" });
  });

  it("falls back to a generic reply detail without a snippet", () => {
    expect(describeNotification({ type: "COMMENT_REPLY", payload: { byName: "Ann" } })).toEqual({
      title: "New reply",
      detail: "Ann replied to you.",
    });
  });

  it("uses 'Someone' when the commenter name is missing", () => {
    expect(describeNotification({ type: "COMMENT_NEW", payload: { noteTitle: "DBMS" } }).detail).toBe(
      'Someone commented on "DBMS".',
    );
  });

  it("uses 'your note' when noteTitle is missing", () => {
    expect(describeNotification({ type: "NOTE_APPROVED", payload: {} }).detail).toBe(
      '"your note" is now published.',
    );
  });

  it("falls back for an unknown type", () => {
    expect(describeNotification({ type: "MYSTERY", payload: { noteTitle: "DBMS" } })).toEqual({
      title: "Notification",
      detail: "DBMS",
    });
  });
});
