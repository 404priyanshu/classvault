type PublicRoomClause = { type: "Public" };
type CollegeByCollegeName = { type: "College-only"; owner: { collegeName: string } };
type CollegeByInstitution = { type: "College-only"; owner: { institutionId: string } };

export type RoomListWhere = { OR: (PublicRoomClause | CollegeByCollegeName | CollegeByInstitution)[] };

export function roomListWhere(
  viewer: { institutionId?: string | null; collegeName?: string | null } | string | null,
): RoomListWhere {
  let institutionId: string | null = null;
  let collegeName: string | null = null;
  if (typeof viewer === "string" || viewer === null) {
    collegeName = viewer;
  } else if (viewer) {
    institutionId = viewer.institutionId ?? null;
    collegeName = viewer.collegeName ?? null;
  }

  const clauses: (PublicRoomClause | CollegeByCollegeName | CollegeByInstitution)[] = [{ type: "Public" }];
  if (institutionId) {
    clauses.push({ type: "College-only", owner: { institutionId } });
  } else if (collegeName) {
    clauses.push({ type: "College-only", owner: { collegeName } });
  }
  return { OR: clauses };
}

export function canViewCollegeOnlyRoom(
  owner: { collegeName: string | null; institutionId: string | null },
  viewer: { collegeName: string | null; institutionId: string | null },
): boolean {
  if (owner.institutionId && viewer.institutionId) {
    return owner.institutionId === viewer.institutionId;
  }
  if (!owner.collegeName || !viewer.collegeName) return false;
  return owner.collegeName === viewer.collegeName;
}
