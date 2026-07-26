type UploadMeta = { id: string; name: string; type: string; size: number; sha256: string; createdAt: number };

export const uploads: UploadMeta[] = [];

export type Job = { id: string; status: "queued" | "running" | "completed" | "failed"; result?: unknown; error?: string };

const jobMap = new Map<string, Job>();

function genId() {
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) return (crypto as any).randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function addUpload(meta: Omit<UploadMeta, "id" | "createdAt"> & { id?: string; createdAt?: number }) {
  const id = meta.id || genId();
  const createdAt = meta.createdAt || Date.now();
  const rec: UploadMeta = { id, name: meta.name, type: meta.type, size: meta.size, sha256: meta.sha256, createdAt };
  uploads.unshift(rec);
  if (uploads.length > 200) uploads.pop();
  return rec;
}

export function listUploads() {
  return uploads;
}

export function deleteUpload(id: string) {
  const idx = uploads.findIndex((u) => u.id === id);
  if (idx >= 0) {
    uploads.splice(idx, 1);
    return true;
  }
  return false;
}

export function createJob(initial?: Partial<Job>) {
  const id = genId();
  const job: Job = { id, status: initial?.status || "queued" };
  jobMap.set(id, job);
  return job;
}

export function getJob(id: string) {
  return jobMap.get(id);
}

export function updateJob(id: string, patch: Partial<Job>) {
  const job = jobMap.get(id);
  if (!job) return undefined;
  Object.assign(job, patch);
  return job;
}

export const settings: { provider: string; model?: string } = { provider: "openai" };

export type ChatRecord = { id: string; messages: any[]; createdAt: number };
export const chatHistory: ChatRecord[] = [];

export function addChatRecord(messages: any[]) {
  const id = genId();
  const rec: ChatRecord = { id, messages, createdAt: Date.now() };
  chatHistory.unshift(rec);
  if (chatHistory.length > 500) chatHistory.pop();
  return rec;
}

export function listChats() {
  return chatHistory;
}
