// Talks to the Google Apps Script Web App (see /apps-script/Code.gs).
// The URL is unique to each teacher's own deployment, so it's stored in
// localStorage rather than hard-coded — both the classroom screen (PC) and
// the /teacher page (phone) read the same key, but each device needs it
// entered once since localStorage doesn't sync between devices on its own.

export const API_URL_KEY = "teacherApiUrl";

export function getApiUrl(): string {
  return localStorage.getItem(API_URL_KEY) || "";
}

export function setApiUrl(url: string) {
  localStorage.setItem(API_URL_KEY, url.trim());
}
export function clearApiUrl() {
  localStorage.removeItem(API_URL_KEY);
}
export interface Note {
  id: string;
  createdAt: string;
  date: string;
  week: string;
  studentName: string;
  subject: string;
  unitTitle: string;
  learningIntention: string;
  tags: string; // comma-joined, matches sheet storage
  text: string;
}

export interface Intention {
  subject: string;
  label: string;
  centralIdea: string;
  loi1: string;
  loi2: string;
  loi3: string;
  learningObjective: string;
  updatedAt: string;
}

async function get(action: string, params: Record<string, string> = {}) {
  const base = getApiUrl();
  if (!base) throw new Error("No Teacher API URL configured yet.");
  const url = new URL(base);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function post(action: string, payload: unknown) {
  const base = getApiUrl();
  if (!base) throw new Error("No Teacher API URL configured yet.");
  // IMPORTANT: Content-Type must stay "text/plain" here (not application/json).
  // Apps Script web apps don't handle CORS preflight (OPTIONS) requests, so we
  // keep this a "simple request" — text/plain avoids the browser sending a
  // preflight in the first place. Code.gs still JSON.parses the body itself.
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, payload }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function fetchNotes(studentName?: string): Promise<Note[]> {
  const data = await get("notes", studentName ? { studentName } : {});
  return data.notes;
}

export async function addNote(note: Omit<Note, "id" | "createdAt" | "tags"> & { tags: string[] }) {
  return post("addNote", { ...note, tags: note.tags.join(",") });
}

export async function updateNote(id: string, updates: { text?: string; tags?: string[] }) {
  return post("updateNote", { id, ...updates });
}

export async function deleteNote(id: string) {
  return post("deleteNote", { id });
}

export async function fetchIntentions(): Promise<Record<string, Intention>> {
  const data = await get("intentions");
  return data.intentions;
}

export async function pushIntentions(
  intentions: Record<string, { label: string; centralIdea: string; loi1: string; loi2: string; loi3: string; learningObjective: string }>
) {
  return post("setIntentions", intentions);
}

export async function fetchStudents(): Promise<{ name: string; present: boolean; pronoun?: string }[]> {
  const data = await get("students");
  return data.students;
}

export async function pushStudents(students: { name: string; present: boolean; pronoun?: string }[]) {
  return post("setStudents", { students });
}

// "Active subject" is the headline lesson currently showing on the classroom screen.
// It's a single always-changing value (not a log), so the /teacher page can poll it
// to auto-follow whatever's being taught right now.
export async function fetchActiveSubject(): Promise<{ subject: string; updatedAt: string }> {
  const data = await get("activeSubject");
  return { subject: data.subject || "", updatedAt: data.updatedAt || "" };
}

export async function pushActiveSubject(subject: string) {
  return post("setActiveSubject", { subject });
}

// Generic backup store — timetable, theme presets, and report drafts get
// serialized to JSON and pushed under their own key, so they survive a
// cleared browser or a switch to a new device, not just the phone's notes.
export async function fetchAppConfig(): Promise<Record<string, string>> {
  const data = await get("appConfig");
  return data.config || {};
}

export async function pushAppConfig(key: string, value: string) {
  return post("setAppConfig", { key, value });
}

export interface DocReportSection {
  label: string;
  text: string;
}
export interface DocReportStudent {
  name: string;
  sections: DocReportSection[];
}

export async function exportReportsToDoc(students: DocReportStudent[], title?: string): Promise<{ url: string; id: string }> {
  const data = await post("exportReportsToDoc", { students, title });
  return { url: data.url, id: data.id };
}