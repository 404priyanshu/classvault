import type { ApiStudyTask } from "@/lib/api-types";
import { db } from "@/lib/server/db";

type StudyTaskRow = { id: string; title: string; done: boolean };

function serializeStudyTask(task: StudyTaskRow): ApiStudyTask {
  return { id: task.id, title: task.title, done: task.done };
}

export async function listStudyTasks(userId: string): Promise<ApiStudyTask[]> {
  const tasks = await db.studyTask.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return tasks.map(serializeStudyTask);
}

export async function createStudyTask(userId: string, title: string): Promise<ApiStudyTask> {
  const task = await db.studyTask.create({ data: { userId, title } });
  return serializeStudyTask(task);
}

// Ownership is enforced by scoping the write to userId, so one user can never
// mutate another user's task even with a guessed id.
export async function updateStudyTask(
  userId: string,
  taskId: string,
  patch: { title?: string; done?: boolean },
): Promise<ApiStudyTask | null> {
  const result = await db.studyTask.updateMany({ where: { id: taskId, userId }, data: patch });
  if (result.count === 0) return null;
  const task = await db.studyTask.findUnique({ where: { id: taskId } });
  return task ? serializeStudyTask(task) : null;
}

export async function deleteStudyTask(userId: string, taskId: string): Promise<boolean> {
  const result = await db.studyTask.deleteMany({ where: { id: taskId, userId } });
  return result.count > 0;
}
