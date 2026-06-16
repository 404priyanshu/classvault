import { db } from "@/lib/server/db";

export type AdminStats = {
  pendingUploads: number;
  openReports: number;
  resolvedReports: number;
  totalModerationActions: number;
  approvalRate: number; // 0-1
  recentDownloads: number; // last 7 days approx via count
  activeUsers: number; // rough via recent activity
  // Note: per-college scoping and time-series trends can be added via collegeName filter on User joins or event createdAt buckets (for future per-institution B2B dashboards).
};

export async function getAdminStats(collegeFilter?: string, institutionId?: string): Promise<AdminStats> {
  // Prefer institutionId for true per-institution B2B scoping (from User.institutionId).
  // Fall back to collegeName filter for transition / existing college-verified flows.
  const userWhere = institutionId
    ? { institutionId }
    : collegeFilter
      ? { collegeName: collegeFilter }
      : {};
  const noteOwnerJoin = institutionId || collegeFilter ? { owner: userWhere } : {};

  const [pending, reports, resolvedReports, modEvents, recentDownloads, recentUsers] = await Promise.all([
    db.note.count({ where: { status: "PENDING", ...(institutionId || collegeFilter ? { owner: userWhere } : {}) } }),
    db.report.count({ where: { status: "OPEN", ...(institutionId || collegeFilter ? { note: noteOwnerJoin } : {}) } }),
    db.report.count({ where: { status: { in: ["RESOLVED", "DISMISSED"] }, ...(institutionId || collegeFilter ? { note: noteOwnerJoin } : {}) } }),
    db.moderationEvent.count({ where: institutionId ? { moderator: userWhere } : collegeFilter ? { moderator: userWhere } : {} }),
    db.downloadEvent.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        ...(institutionId || collegeFilter ? { user: userWhere } : {}),
      },
    }),
    db.user.count({
      where: {
        updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        ...userWhere,
      },
    }),
  ]);

  // Simple approval rate from moderation events (APPROVE vs total actions)
  const approveCount = await db.moderationEvent.count({
    where: {
      action: { in: ["APPROVE", "RESTORE"] },
      ...(institutionId || collegeFilter ? { moderator: userWhere } : {}),
    },
  });
  const approvalRate = modEvents > 0 ? approveCount / modEvents : 0;

  return {
    pendingUploads: pending,
    openReports: reports,
    resolvedReports,
    totalModerationActions: modEvents,
    approvalRate: Math.round(approvalRate * 100) / 100,
    recentDownloads,
    activeUsers: recentUsers,
  };
}
