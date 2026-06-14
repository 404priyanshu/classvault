import type { ApiUser, UserRole } from "@/lib/api-types";
import { roleLabelOf } from "@/lib/server/notes";

type SerializableUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  semester: string | null;
  age: number | null;
  subjectPreferences: string[];
  collegeName: string | null;
  collegeEmail: string | null;
  collegeVerifiedAt: Date | null;
  onboardingCompletedAt: Date | null;
};

export function hasCompletedOnboarding(user: { onboardingCompletedAt: Date | null }) {
  return Boolean(user.onboardingCompletedAt);
}

export function serializeUser(user: SerializableUser): ApiUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    department: user.department,
    semester: user.semester,
    age: user.age,
    subjectPreferences: user.subjectPreferences,
    collegeName: user.collegeName,
    collegeEmail: user.collegeEmail,
    collegeVerifiedAt: user.collegeVerifiedAt?.toISOString() ?? null,
    isCollegeVerified: Boolean(user.collegeVerifiedAt),
    hasCompletedOnboarding: hasCompletedOnboarding(user),
    roleLabel: roleLabelOf(user),
  };
}
