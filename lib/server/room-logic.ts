type PublicRoomClause = { type: "Public" };
type CollegeRoomClause = { type: "College-only"; owner: { collegeName: string } };

export type RoomListWhere = { OR: (PublicRoomClause | CollegeRoomClause)[] };

export function roomListWhere(viewerCollege: string | null): RoomListWhere {
  const clauses: (PublicRoomClause | CollegeRoomClause)[] = [{ type: "Public" }];
  if (viewerCollege) {
    clauses.push({ type: "College-only", owner: { collegeName: viewerCollege } });
  }
  return { OR: clauses };
}

export function canViewCollegeOnlyRoom(ownerCollege: string | null, viewerCollege: string | null): boolean {
  if (!viewerCollege) return false;
  return viewerCollege === ownerCollege;
}
