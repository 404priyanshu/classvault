import { describe, expect, it } from "vitest";
import {
  collegeVerificationStartSchema,
  collegeVerificationVerifySchema,
  createNoteSchema,
  notesQuerySchema,
  profileUpdateSchema,
  ratingSchema,
  reportSchema,
} from "@/lib/server/validation";

describe("notesQuerySchema", () => {
  it("defaults sort to recent and limit to 50", () => {
    const parsed = notesQuerySchema.parse({});
    expect(parsed.sort).toBe("recent");
    expect(parsed.limit).toBe(50);
  });

  it("coerces limit from a string and rejects out-of-range values", () => {
    expect(notesQuerySchema.parse({ limit: "10" }).limit).toBe(10);
    expect(() => notesQuerySchema.parse({ limit: "0" })).toThrow();
    expect(() => notesQuerySchema.parse({ limit: "500" })).toThrow();
  });

  it("only accepts known sort modes", () => {
    expect(notesQuerySchema.parse({ sort: "trending" }).sort).toBe("trending");
    expect(() => notesQuerySchema.parse({ sort: "popular" })).toThrow();
  });
});

describe("createNoteSchema", () => {
  const base = {
    title: "DBMS Unit 3",
    subject: "Database Systems",
    semester: "5",
    courseCode: "CS302",
    storageKey: "notes/u/abc.pdf",
  };

  it("accepts a valid payload and applies defaults", () => {
    const parsed = createNoteSchema.parse(base);
    expect(parsed.tags).toEqual([]);
    expect(parsed.description).toBe("");
  });

  it("rejects short titles and non-enum semesters", () => {
    expect(() => createNoteSchema.parse({ ...base, title: "ab" })).toThrow();
    expect(() => createNoteSchema.parse({ ...base, semester: "9" })).toThrow();
  });

  it("caps tags at 12", () => {
    const tags = Array.from({ length: 13 }, (_, i) => `t${i}`);
    expect(() => createNoteSchema.parse({ ...base, tags })).toThrow();
  });

  it("requires a storage key", () => {
    expect(() => createNoteSchema.parse({ ...base, storageKey: "" })).toThrow();
  });
});

describe("ratingSchema", () => {
  it("accepts integers 1 through 5", () => {
    expect(ratingSchema.parse({ value: 1 }).value).toBe(1);
    expect(ratingSchema.parse({ value: 5 }).value).toBe(5);
  });

  it("rejects out-of-range and non-integer values", () => {
    expect(() => ratingSchema.parse({ value: 0 })).toThrow();
    expect(() => ratingSchema.parse({ value: 6 })).toThrow();
    expect(() => ratingSchema.parse({ value: 3.5 })).toThrow();
  });
});

describe("profileUpdateSchema", () => {
  it("requires onboarding essentials when completing signup", () => {
    const parsed = profileUpdateSchema.parse({
      name: "Arjun Mehta",
      semester: "5",
      age: "19",
      subjectPreferences: ["DBMS", "Operating Systems"],
      completeOnboarding: true,
    });

    expect(parsed.age).toBe(19);
    expect(parsed.subjectPreferences).toEqual(["DBMS", "Operating Systems"]);
    expect(() =>
      profileUpdateSchema.parse({
        name: "Arjun Mehta",
        age: "19",
        subjectPreferences: [],
        completeOnboarding: true,
      }),
    ).toThrow();
  });
});

describe("college verification schemas", () => {
  it("accepts college name, email, and six-digit code", () => {
    expect(
      collegeVerificationStartSchema.parse({
        collegeName: "ClassVault University",
        collegeEmail: "Student@ClassVault.edu ",
      }),
    ).toMatchObject({
      collegeName: "ClassVault University",
      collegeEmail: "Student@ClassVault.edu",
    });

    expect(
      collegeVerificationVerifySchema.parse({
        collegeEmail: "student@classvault.edu",
        code: "123456",
      }),
    ).toMatchObject({
      collegeEmail: "student@classvault.edu",
      code: "123456",
    });
  });

  it("rejects invalid college verification inputs", () => {
    expect(() =>
      collegeVerificationStartSchema.parse({
        collegeName: "C",
        collegeEmail: "not-an-email",
      }),
    ).toThrow();
    expect(() =>
      collegeVerificationVerifySchema.parse({
        collegeEmail: "student@classvault.edu",
        code: "12345",
      }),
    ).toThrow();
    expect(() =>
      collegeVerificationVerifySchema.parse({
        collegeEmail: "student@classvault.edu",
        code: "abcdef",
      }),
    ).toThrow();
  });
});

describe("reportSchema", () => {
  it("requires a note id and a reason", () => {
    expect(reportSchema.parse({ noteId: "n1", reason: "Spam" })).toMatchObject({
      noteId: "n1",
      reason: "Spam",
    });
    expect(() => reportSchema.parse({ noteId: "", reason: "Spam" })).toThrow();
    expect(() => reportSchema.parse({ noteId: "n1", reason: "x" })).toThrow();
  });
});
