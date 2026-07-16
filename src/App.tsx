import React, { useEffect, useState, useRef, useMemo } from "react";
import { getApiUrl, setApiUrl, pushIntentions, pushStudents, pushActiveSubject, fetchNotes, fetchAppConfig, pushAppConfig, fetchStudents, exportReportsToDoc, type Note, type DocReportStudent } from "./services/notes";
import {
  Palette, Dumbbell, Music, Drama, Languages, Globe, Apple, Sandwich, Calculator,
  SpellCheck, BookOpen, BookMarked, Lightbulb, Library, Search, Brain, Users, Ticket, Pin,
} from "lucide-react";

const C = {
  bg: "#f2ede4",
  card: "#ebe5d9",
  cardBorder: "#d9d2c5",
  text: "#2c2825",
  muted: "#7a7068",
  sage: "#7a9e87",
  sageDark: "#4e7a60",
  roses: "#c47b7b",
  roseDark: "#9e4f4f",
  slate: "#6b82a8",
  slateDark: "#3d5a80",
  amber: "#b8883a",
  amberDark: "#7a5520",
  highlight: "#e8e0cf",
  lavender: "#9b8ec4",
};

const font = "'Lexend', 'Century Gothic', 'Trebuchet MS', Arial, sans-serif";
const TEAM_COLORS = ["#2f9e52", "#2f6fb8", "#d1453f", "#d99a1f", "#7b52c9"];

const ATL_SKILLS = ["Thinking", "Communication", "Social", "Self-management", "Research"] as const;
type ATLSkill = typeof ATL_SKILLS[number];

const cardStyle: React.CSSProperties = {
  background: C.card, borderRadius: "18px", padding: "24px",
  border: `1.5px solid ${C.cardBorder}`, display: "flex", flexDirection: "column",
  gap: "14px", position: "relative", width: "100%", boxSizing: "border-box",
};
const btnBase: React.CSSProperties = {
  border: "none", borderRadius: "50px", padding: "11px 22px", fontWeight: "700",
  fontSize: "15px", cursor: "pointer", fontFamily: font, letterSpacing: "0.3px", lineHeight: 1.3,
};
const btnSage: React.CSSProperties = { ...btnBase, background: C.sage, color: "#fff" };
const btnRose: React.CSSProperties = { ...btnBase, background: C.roses, color: "#fff" };
const btnSlate: React.CSSProperties = { ...btnBase, background: C.slate, color: "#fff" };
const btnAmber: React.CSSProperties = { ...btnBase, background: C.amber, color: "#fff" };
const btnLavender: React.CSSProperties = { ...btnBase, background: C.lavender, color: "#fff" };
const btnGhost: React.CSSProperties = { ...btnBase, background: C.highlight, color: C.text, border: `1.5px solid ${C.cardBorder}` };
const inputStyle: React.CSSProperties = {
  background: C.bg, border: `1.5px solid ${C.cardBorder}`, borderRadius: "12px",
  padding: "10px 14px", color: C.text, fontSize: "15px", fontFamily: font,
  outline: "none", width: "100%", boxSizing: "border-box", lineHeight: 1.6,
};
const labelStyle: React.CSSProperties = {
  fontSize: "12px", fontWeight: "700", letterSpacing: "1.8px",
  textTransform: "uppercase", color: C.muted,
};
const closeBtn: React.CSSProperties = {
  position: "absolute", top: "12px", right: "14px", background: "none",
  border: "none", fontSize: "20px", color: C.muted, cursor: "pointer",
  lineHeight: 1, fontFamily: font, zIndex: 10,
};
const linkStyle: React.CSSProperties = {
  background: "none", border: "none", color: C.slateDark, fontSize: "11px",
  textDecoration: "underline", cursor: "pointer", padding: 0, marginLeft: "8px", fontFamily: font,
};

const WIDGETS = [
  "timetable", "taskBreakdown", "clock", "timer", "stopwatch", "morningStarter",
  "notes", "roster", "groups", "scoreboard", "dice", "workSymbols", "embedder", "youtubeWidget"
] as const;
type Widget = typeof WIDGETS[number];

const WIDGET_LABELS: Record<Widget, string> = {
  timetable: "📅 Lesson Set-up", taskBreakdown: "📋 Task Steps",
  clock: "🕒 Clock", timer: "⏲ Timer", morningStarter: "🌅 Morning Starter",
  stopwatch: "⏱ Stopwatch", notes: "📝 Notes", roster: "👥 Roster",
  groups: "🤝 Groups", scoreboard: "🏆 Scores",
  dice: "🎲 Dice", workSymbols: "🔇 Work Mode",
  embedder: "🔗 Web Embed Link", youtubeWidget: "📺 YouTube Video"
};

const WIDGET_GROUPS: { label: string; emoji: string; widgets: Widget[] }[] = [
  { label: "Lesson", emoji: "📚", widgets: ["timetable", "taskBreakdown", "morningStarter", "roster", "notes"] },
  { label: "Content", emoji: "🖥️", widgets: ["embedder", "youtubeWidget"] },
  { label: "Class Tools", emoji: "👥", widgets: ["workSymbols", "dice", "groups", "scoreboard"] },
  { label: "Timers", emoji: "⏱️", widgets: ["clock", "timer", "stopwatch"] },
];

const PALETTES = {
  specialists: { color: "#153570", bg: "#c3d8f5" },
  breaks: { color: "#155c30", bg: "#bfeecb" },
  others: { color: "#0a5487", bg: "#bfe6fa" }
};

interface Presets { centralIdea: string; loi1: string; loi2: string; loi3: string; }

const DEFAULT_THEME_PRESETS: Record<string, Presets> = {
  "Who we are": { centralIdea: "Human body systems are interconnected and impact health.", loi1: "Systems function", loi2: "Interconnectedness", loi3: "Health choices" },
  "Where we are in place and time": { centralIdea: "Human migration is a response to challenges.", loi1: "Changes over time", loi2: "Impacts", loi3: "Reasons why people move" },
  "How we express ourselves": { centralIdea: "Creativity offers pathways to uncover identity.", loi1: "Design spaces", loi2: "History inside profiles", loi3: "Expressions" },
  "How the world works": { centralIdea: "Scientific principles drive technological progress.", loi1: "Forces", loi2: "Discovery methods", loi3: "Modern applications" },
  "How we organize ourselves": { centralIdea: "Interconnected networks support societal progress.", loi1: "Organizations", loi2: "Communication/Transport", loi3: "Responsibilities" },
  "Sharing the planet": { centralIdea: "Biodiversity depends on sustainable choices.", loi1: "Ecosystem balance", loi2: "Resource impacts", loi3: "Environmental actions" }
};

interface AnecdotalNote { date: string; text: string; }
interface StudentObservation {
  status: "green" | "amber" | "red" | "none" | "absent";
  notes: string;
  anecdotalNotes?: AnecdotalNote[];
  atlTags?: ATLSkill[];
  starMoment?: string;
}
interface TimetableItem { id: number; lessonId: string; time: string; done: boolean; note: string; }
interface ScoreTeam { id: number; name: string; score: number; color: string; }
interface SubTask { id: number; text: string; done: boolean; }
interface Student { name: string; present: boolean; pronoun?: "he" | "she" | "they"; }

interface SubjectProfile {
  materials: Record<string, boolean>;
  learningObjective: string;
  centralIdea?: string;
  loi1?: string; loi2?: string; loi3?: string;
  activeLoiHighlight?: number;
  atls: string;
  subTasks: SubTask[];
  observations?: Record<string, StudentObservation>;
  activeTaskId?: number | null;
}

interface UoiUnit { title: string; centralIdea: string; loi1: string; loi2: string; loi3: string; }

interface ReportData {
  units: UoiUnit[];
  studentReports: Record<string, {
    literacy: { draft: string; growth1: string; growth2: string; achievement: string; };
    maths: { draft: string; growth1: string; growth2: string; achievement: string; };
    uoi: { unitDrafts: string[]; growth1: string; growth2: string; achievement: string; };
    sel: { draft: string; growth1: string; growth2: string; achievement: string; };
  }>;
}

interface LessonType { id: string; label: string; color: string; bg: string; }
const LESSON_TYPES: LessonType[] = [
  { id: "art", label: "Art", ...PALETTES.specialists },
  { id: "pe", label: "PE", ...PALETTES.specialists },
  { id: "music", label: "Music", ...PALETTES.specialists },
  { id: "drama", label: "Performing Arts", ...PALETTES.specialists },
  { id: "languages", label: "Languages", ...PALETTES.specialists },
  { id: "italian", label: "Italian", ...PALETTES.specialists },
  { id: "recess", label: "Recess", ...PALETTES.breaks },
  { id: "lunch", label: "Lunch", ...PALETTES.breaks },
  { id: "maths", label: "Maths", ...PALETTES.others },
  { id: "spelling", label: "Spelling", ...PALETTES.others },
  { id: "literacy", label: "Literacy", ...PALETTES.others },
  { id: "story", label: "Story", ...PALETTES.others },
  { id: "pyp", label: "PYP Exhibition", ...PALETTES.others },
  { id: "library", label: "Library", ...PALETTES.others },
  { id: "uoi", label: "Unit of Inquiry", ...PALETTES.others },
  { id: "brain", label: "Brain Break", ...PALETTES.others },
  { id: "assembly", label: "Assembly", ...PALETTES.others },
  { id: "event", label: "Event", ...PALETTES.others },
  { id: "off", label: "Off Schedule", ...PALETTES.others },
];

function LessonIcon({ id, size = 32, color = "#000" }: { id: string; size?: number; color?: string }) {
  const props = { size, color, strokeWidth: 2 };
  switch (id) {
    case "art": return <Palette {...props} />;
    case "pe": return <Dumbbell {...props} />;
    case "music": return <Music {...props} />;
    case "drama": return <Drama {...props} />;
    case "languages": return <Languages {...props} />;
    case "italian": return <Globe {...props} />;
    case "recess": return <Apple {...props} />;
    case "lunch": return <Sandwich {...props} />;
    case "maths": return <Calculator {...props} />;
    case "spelling": return <SpellCheck {...props} />;
    case "literacy": return <BookOpen {...props} />;
    case "story": return <BookMarked {...props} />;
    case "pyp": return <Lightbulb {...props} />;
    case "library": return <Library {...props} />;
    case "uoi": return <Search {...props} />;
    case "brain": return <Brain {...props} />;
    case "assembly": return <Users {...props} />;
    case "event": return <Ticket {...props} />;
    default: return <Pin {...props} />;
  }
}

function MaterialIcon({ id, size = 36 }: { id: string; size?: number }) {
  const props = { width: size, height: size, viewBox: "0 0 32 32", fill: "none", stroke: "#000", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "whiteboard": return <svg {...props}><rect x="4" y="6" width="24" height="16" rx="2" /><path d="M8 22l-3 5M24 22l3 5M12 22h8" /></svg>;
    case "pen": return <svg {...props}><path d="M6 26l3-1 14-14-2-2L7 23zM21 7l4 4" /></svg>;
    case "ipad": return <svg {...props}><rect x="6" y="4" width="20" height="24" rx="3" /><circle cx="16" cy="25" r="1" fill="#000" /></svg>;
    case "writing_book": return <svg {...props}><rect x="6" y="4" width="20" height="24" rx="2" /><path d="M6 8h20M6 14h14M6 20h16M10 4v24" /></svg>;
    case "math_notebook": return <svg {...props}><rect x="6" y="4" width="20" height="24" rx="2" /><path d="M6 9h20M6 14h20M6 19h20M6 24h20M11 4v24M16 4v24M21 4v24" /></svg>;
    case "reading_book": return <svg {...props}><path d="M4 24c4 0 8-2 12-2s8 2 12 2V6c-4 0-8-2-12-2S8 6 4 6z M16 4v18" /></svg>;
    case "library_book": return <svg {...props}><path d="M4 6h20v18H4z M8 6v18 M12 6v18 M16 6v18 M20 6v18 M24 10H4" /></svg>;
    case "refill_water": return <svg {...props}><path d="M12 4h8v3h-8z M10 10c0-3 3-3 3-3h6s3 0 3 3v14c0 3-3 3-3 3h-6s-3 0-3-3z M14 14h4M13 18h6" /></svg>;
    default: return null;
  }
}

function CircleTimer({ pct, minutes, seconds }: { pct: number; minutes: number; seconds: number }) {
  const size = 320, cx = 160, cy = 160, r = 135, stroke = 22;
  const angle = pct * 2 * Math.PI;
  const x = cx + r * Math.sin(angle);
  const y = cy - r * Math.cos(angle);
  const largeArc = angle > Math.PI ? 1 : 0;
  // Vivid, saturated variants used only for this ring — the shared C.sage/amber/roses
  // used everywhere else in the UI are deliberately muted, but a timer meant to be
  // read at a glance from across a room needs more punch than that.
  const fillColor = pct > 0.5 ? "#2f9e52" : pct > 0.2 ? "#d99a1f" : "#d1453f";
  const timeLabel = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ display: "block" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.cardBorder} strokeWidth={stroke} />
        {pct > 0.001 && (pct >= 0.999
          ? <circle cx={cx} cy={cy} r={r} fill="none" stroke={fillColor} strokeWidth={stroke} style={{ transition: "stroke 1.2s ease" }} />
          : <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`} fill="none" stroke={fillColor} strokeWidth={stroke} strokeLinecap="round" style={{ transition: "stroke 1.2s ease" }} />
        )}
        <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="middle" fontSize="64" fontWeight="800" fill={C.text} fontFamily={font}>{timeLabel}</text>
        <text x={cx} y={cy + 46} textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="700" fill={C.muted} fontFamily={font}>{minutes} MIN TARGET</text>
      </svg>
    </div>
  );
}

function DiceFace({ value }: { value: number }) {
  return (
    <svg width={100} height={100} style={{ display: "block", margin: "0 auto" }}>
      <rect x={2} y={2} width={96} height={96} rx={16} fill={C.bg} stroke={C.cardBorder} strokeWidth={2} />
      {DICE_DOTS[value]?.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={8} fill={C.text} />)}
    </svg>
  );
}

const DICE_DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]], 2: [[25, 25], [75, 75]], 3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]], 5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]]
};

const WORK_MODES = [
  { id: "silent", icon: "🔇", label: "Silent Work", color: C.roses, bg: "#f5c6c6" },
  { id: "whisper", icon: "🤫", label: "Whisper Only", color: C.amber, bg: "#fff3cd" },
  { id: "partner", icon: "🗣️", label: "Partner Talk", color: C.sage, bg: "#c8e6c9" },
  { id: "group", icon: "👥", label: "Group Work", color: C.slate, bg: "#dce8f5" },
  { id: "free", icon: "🎉", label: "Free Time", color: C.lavender, bg: "#ede8f5" }
];

// ── REPORT DRAFTING PANEL ──
// Shows the raw notes a teacher captured on the /teacher phone view for a given
// student/subject, so report drafting is grounded in what was actually observed
// during lessons instead of starting from a blank textarea.
function EvidenceList({
  notes, onInsert, showSubject,
}: {
  notes: Note[];
  onInsert?: (text: string) => void;
  showSubject?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  if (notes.length === 0) return null;
  return (
    <div style={{ background: C.highlight, borderRadius: "10px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
      <button onClick={() => setExpanded(e => !e)} style={{ ...btnGhost, alignSelf: "flex-start", padding: "3px 10px", fontSize: "11px", borderRadius: "20px" }}>
        {expanded ? "▲" : "▼"} 📱 {notes.length} note{notes.length === 1 ? "" : "s"} from phone
      </button>
      {expanded && notes.map(n => (
        <div key={n.id} style={{ display: "flex", gap: "8px", alignItems: "flex-start", background: "#fff", borderRadius: "8px", padding: "8px 10px", fontSize: "12.5px", lineHeight: 1.5 }}>
          <div style={{ flex: 1 }}>
            <span style={{ color: C.muted, marginRight: "6px" }}>{n.date}</span>
            {showSubject && n.subject && (
              <span style={{ background: C.bg, borderRadius: "6px", padding: "1px 6px", marginRight: "6px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" }}>{n.subject}</span>
            )}
            {n.tags && <span style={{ background: C.bg, borderRadius: "6px", padding: "1px 6px", marginRight: "6px", fontSize: "11px", fontWeight: 700 }}>{n.tags}</span>}
            {n.text}
          </div>
          {onInsert && (
            <button onClick={() => onInsert(n.text)} style={{ ...btnGhost, padding: "3px 8px", fontSize: "11px", flexShrink: 0, whiteSpace: "nowrap" }}>+ Insert</button>
          )}
        </div>
      ))}
    </div>
  );
}

function ReportDraftingPanel({
  students, setStudents, subjectProfiles, reportData, setReportData, themePresets, onClose
}: {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  subjectProfiles: Record<string, SubjectProfile>;
  reportData: ReportData;
  setReportData: React.Dispatch<React.SetStateAction<ReportData>>;
  themePresets: Record<string, Presets>;
  onClose: () => void;
}) {
  const [selectedStudent, setSelectedStudent] = useState<string>(students[0]?.name || "");
  const [generating, setGenerating] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<"literacy" | "maths" | "uoi" | "sel">("literacy");
  const [phoneNotes, setPhoneNotes] = useState<Note[]>([]);
  const [phoneNotesLoading, setPhoneNotesLoading] = useState(false);
  const [phoneNotesError, setPhoneNotesError] = useState<string>("");
  const [showTimeline, setShowTimeline] = useState<boolean>(false);
  // Clear and "generate for whole class" are used far less often than Compile/
  // Generate — tucking them behind this toggle keeps the primary two actions
  // visible without four buttons competing for attention on every tab.
  const [showMoreActions, setShowMoreActions] = useState<boolean>(false);
  const [apiUrlInput, setApiUrlInput] = useState<string>(getApiUrl());
  const [editingApiUrl, setEditingApiUrl] = useState<boolean>(!getApiUrl());
  const [notesRefreshTick, setNotesRefreshTick] = useState(0);
  const [geminiKey, setGeminiKeyState] = useState<string>(() => localStorage.getItem("geminiApiKey") || "");
  const [editingKey, setEditingKey] = useState<boolean>(() => !localStorage.getItem("geminiApiKey"));
  const [keyInput, setKeyInput] = useState<string>(() => localStorage.getItem("geminiApiKey") || "");
  const [draftError, setDraftError] = useState<string>("");
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; label: string } | null>(null);

  function saveGeminiKey() {
    const trimmed = keyInput.trim();
    localStorage.setItem("geminiApiKey", trimmed);
    setGeminiKeyState(trimmed);
    setEditingKey(false);
  }

  function connectApiUrl() {
    setApiUrl(apiUrlInput);
    setEditingApiUrl(false);
    setNotesRefreshTick(v => v + 1);
  }

  // Pull in whatever's been logged on the /teacher phone view for this student —
  // this is the actual evidence captured during lessons, and previously never
  // made it into report drafting at all.
  useEffect(() => {
    if (!selectedStudent || !getApiUrl()) { setPhoneNotes([]); setPhoneNotesError(""); return; }
    let cancelled = false;
    setPhoneNotesLoading(true);
    setPhoneNotesError("");
    fetchNotes(selectedStudent)
      .then((ns) => { if (!cancelled) setPhoneNotes(ns); })
      .catch((err) => { if (!cancelled) { setPhoneNotes([]); setPhoneNotesError(err instanceof Error ? err.message : "Could not load notes."); } })
      .finally(() => { if (!cancelled) setPhoneNotesLoading(false); });
    return () => { cancelled = true; };
  }, [selectedStudent, notesRefreshTick]);

  useEffect(() => { setShowTimeline(false); }, [selectedStudent]);

  const student = students.find(s => s.name === selectedStudent);
  const pronoun = student?.pronoun || "they";
  const possessive = pronoun === "he" ? "his" : pronoun === "she" ? "her" : "their";
  const subject = pronoun === "they" ? "they" : pronoun;
  const verbIs = pronoun === "they" ? "are" : "is";

  const getStudentReport = () => {
    if (!reportData.studentReports[selectedStudent]) {
      return {
        literacy: { draft: "", growth1: "", growth2: "", achievement: "ME" },
        maths: { draft: "", growth1: "", growth2: "", achievement: "ME" },
        uoi: { unitDrafts: ["", "", ""], growth1: "", growth2: "", achievement: "ME" },
        sel: { draft: "", growth1: "", growth2: "", achievement: "ME" },
      };
    }
    return reportData.studentReports[selectedStudent];
  };

  const updateReportFor = (studentName: string, section: string, field: string, value: string, unitIdx?: number) => {
    setReportData(prev => {
      const current = prev.studentReports[studentName] || {
        literacy: { draft: "", growth1: "", growth2: "", achievement: "ME" },
        maths: { draft: "", growth1: "", growth2: "", achievement: "ME" },
        uoi: { unitDrafts: ["", "", ""], growth1: "", growth2: "", achievement: "ME" },
        sel: { draft: "", growth1: "", growth2: "", achievement: "ME" },
      };
      return {
        ...prev,
        studentReports: {
          ...prev.studentReports,
          [studentName]: {
            ...current,
            [section]: section === "uoi" && field === "unitDraft" && unitIdx !== undefined
              ? { ...current.uoi, unitDrafts: current.uoi.unitDrafts.map((d, i) => i === unitIdx ? value : d) }
              : { ...(current as any)[section], [field]: value }
          }
        }
      };
    });
  };

  const updateReport = (section: string, field: string, value: string, unitIdx?: number) =>
    updateReportFor(selectedStudent, section, field, value, unitIdx);

  function pronounsFor(name: string): { pronoun: "he" | "she" | "they"; possessive: string } {
    const s = students.find(x => x.name === name);
    const p = s?.pronoun || "they";
    return { pronoun: p, possessive: p === "he" ? "his" : p === "she" ? "her" : "their" };
  }
  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  const buildObsSummaryFor = (studentName: string, subjectId: string, notesForStudent: Note[], unitCentralIdea?: string) => {
    const profile = subjectProfiles[subjectId];
    const obs = profile?.observations?.[studentName];
    const localPart = obs
      ? (() => {
          const status = obs.status === "green" ? "Mastered" : obs.status === "amber" ? "Progressing" : obs.status === "red" ? "Needs support" : "Not tracked";
          const atls = (obs.atlTags || []).join(", ") || "None recorded";
          const star = obs.starMoment || "";
          const notesTxt = [obs.notes, ...(obs.anecdotalNotes || []).map(n => `${n.date}: ${n.text}`)].filter(Boolean).join(" | ");
          return `Status: ${status}. ATL skills: ${atls}. ${star ? `Star moment: ${star}.` : ""} Notes: ${notesTxt || "None."}`;
        })()
      : "";
    const relevantPhoneNotes = notesForStudent.filter(
      n => n.subject === subjectId && (unitCentralIdea === undefined || n.unitTitle === unitCentralIdea)
    );
    const phonePart = relevantPhoneNotes.length
      ? `Logged classroom observations (${relevantPhoneNotes.length}): ` +
        relevantPhoneNotes.map(n => `[${n.date}${n.tags ? ` · ${n.tags}` : ""}] ${n.text}`).join(" || ")
      : "";
    const combined = [localPart, phonePart].filter(Boolean).join(" ");
    return combined || "No observations recorded.";
  };

  const buildObsSummary = (subjectId: string) => buildObsSummaryFor(selectedStudent, subjectId, phoneNotes);

  async function callGemini(prompt: string): Promise<string> {
    if (!geminiKey) throw new Error("Add your Gemini API key above first.");
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `Request failed (${response.status})`);
    }
    const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
    if (!text.trim()) throw new Error("Gemini returned an empty response — try again.");
    return text.trim();
  }

  async function generateDraftFor(studentName: string, notesForStudent: Note[], section: "literacy" | "maths" | "sel", unitIdx?: number) {
    const { pronoun: p, possessive: pos } = pronounsFor(studentName);
    let prompt = "";

    if (section === "literacy") {
      const obs = buildObsSummaryFor(studentName, "literacy", notesForStudent);
      const spellingObs = buildObsSummaryFor(studentName, "spelling", notesForStudent);
      prompt = `You are writing a Grade 5 IB PYP end-of-term Literacy report comment for a 10-year-old student named ${studentName}. Use ${p}/${pos} pronouns. 

Teacher observations: ${obs}
Spelling observations: ${spellingObs}

Write approximately 150 words in warm, professional PYP report language. Cover reading, writing, and oral communication skills. Be specific and evidence-based. Do not use generic filler. Do not include growth areas in this section — those are separate. Write in third person. Start with the student's name.`;
    } else if (section === "maths") {
      const obs = buildObsSummaryFor(studentName, "maths", notesForStudent);
      prompt = `You are writing a Grade 5 IB PYP end-of-term Mathematics report comment for a 10-year-old student named ${studentName}. Use ${p}/${pos} pronouns.

Teacher observations: ${obs}

Write approximately 150 words in warm, professional PYP report language. Reference conceptual understanding, skills application, and mathematical thinking. Be specific. Do not include growth areas. Write in third person. Start with the student's name.`;
    } else if (section === "sel") {
      const allObs = ["literacy", "maths", "uoi"].map(id => buildObsSummaryFor(studentName, id, notesForStudent)).join(" | ");
      prompt = `You are writing a Grade 5 IB PYP end-of-term Social Emotional Learning report comment for a 10-year-old student named ${studentName}. Use ${p}/${pos} pronouns.

This section is based on ATL (Approaches to Learning) skills and classroom interactions.
Cross-subject observations: ${allObs}

Write approximately 150 words covering how the student manages ${pos} learning, collaborates with peers, communicates, and contributes to the classroom community. Use warm, professional PYP language. Do not include growth areas. Write in third person. Start with the student's name.`;
    }

    const text = await callGemini(prompt);
    if (unitIdx !== undefined) {
      updateReportFor(studentName, "uoi", "unitDraft", text, unitIdx);
    } else {
      updateReportFor(studentName, section, "draft", text);
    }
  }

  async function generateUoiDraftFor(studentName: string, notesForStudent: Note[], unitIdx: number) {
    const { pronoun: p, possessive: pos } = pronounsFor(studentName);
    const unit = reportData.units[unitIdx];
    const obs = buildObsSummaryFor(studentName, "uoi", notesForStudent, unit?.centralIdea);
    const prompt = `You are writing a Grade 5 IB PYP end-of-term Unit of Inquiry report comment for a 10-year-old student named ${studentName}. Use ${p}/${pos} pronouns.

Unit title: ${unit?.title || "Unit " + (unitIdx + 1)}
Central idea: ${unit?.centralIdea || "Not specified"}
Lines of inquiry: ${[unit?.loi1, unit?.loi2, unit?.loi3].filter(Boolean).join("; ") || "Not specified"}

Teacher observations: ${obs}

Write approximately 150 words in warm, professional PYP language. Reference the central idea and lines of inquiry. Be specific about what the student understood, inquired into, and demonstrated. Do not include growth areas. Write in third person. Start with the student's name.`;
    const text = await callGemini(prompt);
    updateReportFor(studentName, "uoi", "unitDraft", text, unitIdx);
  }

  const generateDraft = async (section: "literacy" | "maths" | "sel", unitIdx?: number) => {
    const key = unitIdx !== undefined ? `uoi_${unitIdx}` : section;
    setGenerating(g => ({ ...g, [key]: true }));
    try {
      await generateDraftFor(selectedStudent, phoneNotes, section, unitIdx);
      setDraftError("");
    } catch (e) {
      console.error("API error", e);
      setDraftError(e instanceof Error ? e.message : "Something went wrong generating the draft.");
    }
    setGenerating(g => ({ ...g, [key]: false }));
  };

  const generateUoiDraft = async (unitIdx: number) => {
    const key = `uoi_${unitIdx}`;
    setGenerating(g => ({ ...g, [key]: true }));
    try {
      await generateUoiDraftFor(selectedStudent, phoneNotes, unitIdx);
      setDraftError("");
    } catch (e) {
      console.error("API error", e);
      setDraftError(e instanceof Error ? e.message : "Something went wrong generating the draft.");
    }
    setGenerating(g => ({ ...g, [key]: false }));
  };

  // ── BATCH GENERATION ──
  // Sequential (not parallel) with a short pause between calls, since the free
  // Gemini tier has real per-minute limits — bursting requests just trades one
  // rate-limit error for another. Each item's failure is collected rather than
  // stopping the whole batch, so one bad note doesn't block the rest of the class.
  const generateAllSectionsForStudent = async (studentName: string) => {
    if (!geminiKey) { setDraftError("Add your Gemini API key above first."); return; }
    setGenerating(g => ({ ...g, batch_student: true }));
    setDraftError("");
    let notesForStudent: Note[] = studentName === selectedStudent ? phoneNotes : [];
    if (studentName !== selectedStudent && getApiUrl()) {
      try { notesForStudent = await fetchNotes(studentName); } catch { notesForStudent = []; }
    }
    const tasks: { label: string; run: () => Promise<void> }[] = [
      { label: "Literacy", run: () => generateDraftFor(studentName, notesForStudent, "literacy") },
      { label: "Maths", run: () => generateDraftFor(studentName, notesForStudent, "maths") },
      { label: "SEL", run: () => generateDraftFor(studentName, notesForStudent, "sel") },
      { label: "UOI Unit 1", run: () => generateUoiDraftFor(studentName, notesForStudent, 0) },
      { label: "UOI Unit 2", run: () => generateUoiDraftFor(studentName, notesForStudent, 1) },
      { label: "UOI Unit 3", run: () => generateUoiDraftFor(studentName, notesForStudent, 2) },
    ];
    const errors: string[] = [];
    for (let i = 0; i < tasks.length; i++) {
      setBatchProgress({ current: i + 1, total: tasks.length, label: `${studentName} — ${tasks[i].label}` });
      try {
        await tasks[i].run();
      } catch (e) {
        errors.push(`${tasks[i].label}: ${e instanceof Error ? e.message : "failed"}`);
      }
      if (i < tasks.length - 1) await sleep(900);
    }
    setBatchProgress(null);
    setGenerating(g => ({ ...g, batch_student: false }));
    if (errors.length) setDraftError(`Some sections failed: ${errors.join(" | ")}`);
  };

  const generateSubjectForWholeClass = async (subjectId: "literacy" | "maths" | "sel") => {
    if (!geminiKey) { setDraftError("Add your Gemini API key above first."); return; }
    if (students.length === 0) { setDraftError("No students in roster."); return; }
    const gKey = `batch_${subjectId}`;
    setGenerating(g => ({ ...g, [gKey]: true }));
    setDraftError("");
    const errors: string[] = [];
    for (let i = 0; i < students.length; i++) {
      const name = students[i].name;
      setBatchProgress({ current: i + 1, total: students.length, label: `${name} — ${subjectId}` });
      try {
        const notesForStudent = name === selectedStudent ? phoneNotes : (getApiUrl() ? await fetchNotes(name) : []);
        await generateDraftFor(name, notesForStudent, subjectId);
      } catch (e) {
        errors.push(`${name}: ${e instanceof Error ? e.message : "failed"}`);
      }
      if (i < students.length - 1) await sleep(900);
    }
    setBatchProgress(null);
    setGenerating(g => ({ ...g, [gKey]: false }));
    if (errors.length) setDraftError(`${errors.length} of ${students.length} failed: ${errors.join(" | ")}`);
  };

  // Free alternative to AI generation — just formats the raw phone notes into
  // a readable starting draft, no API call and no cost. SEL pulls from every
  // subject since it's meant to be cross-subject; the others filter to one.
  const compileFromNotes = (sectionKey: "literacy" | "maths" | "sel") => {
    const relevant = sectionKey === "sel" ? phoneNotes : phoneNotes.filter(n => n.subject === sectionKey);
    if (relevant.length === 0) {
      setDraftError(`No phone notes found${sectionKey === "sel" ? "" : ` tagged "${sectionKey}"`} to compile yet.`);
      return;
    }
    const lines = relevant
      .slice()
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
      .map(n => `• ${n.date}${sectionKey === "sel" && n.subject ? ` [${n.subject}]` : ""}${n.tags ? ` (${n.tags})` : ""}: ${n.text}`)
      .join("\n");
    updateReport(sectionKey, "draft", `Observations for ${selectedStudent}, compiled from ${relevant.length} logged note${relevant.length === 1 ? "" : "s"}:\n\n${lines}`);
    setDraftError("");
  };

  const compileUoiFromNotes = (unitIdx: number) => {
    const unitCentralIdea = reportData.units[unitIdx]?.centralIdea;
    if (!unitCentralIdea?.trim()) {
      setDraftError(`Set this unit's Central Idea first (type it or "Load preset...") — notes are matched to units by central idea.`);
      return;
    }
    const relevant = phoneNotes.filter(n => n.subject === "uoi" && n.unitTitle === unitCentralIdea);
    if (relevant.length === 0) {
      setDraftError(`No phone notes found matching this unit's central idea yet.`);
      return;
    }
    const lines = relevant
      .slice()
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
      .map(n => `• ${n.date}${n.tags ? ` (${n.tags})` : ""}: ${n.text}`)
      .join("\n");
    updateReport("uoi", "unitDraft", `Observations for ${selectedStudent}, compiled from ${relevant.length} logged note${relevant.length === 1 ? "" : "s"}:\n\n${lines}`, unitIdx);
    setDraftError("");
  };

  // Suggests two growth areas using ONLY the notes flagged NS (not secure) or
  // AE (approaching expectation) for this subject — i.e. the notes that
  // actually indicate something to work on, rather than the whole note set.
  const generateGrowthAreas = async (sectionKey: "literacy" | "maths" | "uoi" | "sel") => {
    const gKey = `growth_${sectionKey}`;
    setGenerating(g => ({ ...g, [gKey]: true }));
    const subjectIds = sectionKey === "sel" ? ["literacy", "maths", "uoi"] : [sectionKey];
    const relevant = phoneNotes.filter(
      n => subjectIds.includes(n.subject) && (n.tags?.split(",").includes("NS") || n.tags?.split(",").includes("AE"))
    );
    if (relevant.length === 0) {
      setDraftError(`No notes tagged "NS" or "AE" found for ${sectionKey === "sel" ? "SEL" : sectionKey} yet — growth areas need at least one note flagged as needing support or still approaching.`);
      setGenerating(g => ({ ...g, [gKey]: false }));
      return;
    }
    const notesText = relevant.map(n => `[${n.date} · ${n.tags}] ${n.text}`).join("\n");
    const prompt = `You are identifying two areas for growth for a Grade 5 IB PYP student named ${selectedStudent} in ${sectionKey === "sel" ? "Social Emotional Learning" : sectionKey}, based ONLY on these logged classroom observations that were flagged as needing support (NS) or still approaching expectations (AE):

${notesText}

Write exactly two short, specific, actionable growth areas (each under 15 words), based only on what these notes actually show — do not invent anything the notes don't support. Respond with ONLY the two growth areas, one per line, no numbering, no extra commentary.`;
    try {
      const text = await callGemini(prompt);
      const lines = text.split("\n").map(l => l.replace(/^[-•\d.\s]+/, "").trim()).filter(Boolean);
      updateReport(sectionKey, "growth1", lines[0] || "");
      updateReport(sectionKey, "growth2", lines[1] || "");
      setDraftError("");
    } catch (e) {
      console.error("API error", e);
      setDraftError(e instanceof Error ? e.message : "Something went wrong suggesting growth areas.");
    }
    setGenerating(g => ({ ...g, [gKey]: false }));
  };

  const report = getStudentReport();
  const notedSubjects = useMemo(
    () => Array.from(new Set(phoneNotes.map(n => n.subject).filter(Boolean))),
    [phoneNotes]
  );
  const matchableTabs = ["literacy", "maths", "uoi"];
  const noNotesMatchAnyTab = phoneNotes.length > 0 && !notedSubjects.some(s => matchableTabs.includes(s));
  // Only force the setup section open when something actually needs attention —
  // otherwise it collapses to one line so it doesn't sit above the report
  // content on every single visit once everything's already working.
  const setupNeedsAttention = editingApiUrl || editingKey || !!phoneNotesError || noNotesMatchAnyTab;
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const showSettingsBlocks = settingsExpanded || setupNeedsAttention;
  const ACHIEVEMENTS = ["EE", "ME", "AE", "NS"];
  const TABS = [
    { key: "literacy" as const, label: "📚 Literacy" },
    { key: "maths" as const, label: "🔢 Maths" },
    { key: "uoi" as const, label: "🔍 UOI" },
    { key: "sel" as const, label: "🤝 SEL" },
  ];

  // Suggests an achievement level from whichever RAG tag (EE/ME/AE/NS) shows up
  // most often among a subject's phone notes. Never applied automatically —
  // the teacher clicks to accept it, same as everything else in this panel.
  function suggestAchievement(subjectId: string): string | null {
    const relevant = subjectId === "sel" ? phoneNotes : phoneNotes.filter(n => n.subject === subjectId);
    const counts: Record<string, number> = {};
    relevant.forEach(n => {
      const tag = ACHIEVEMENTS.find(a => n.tags === a || n.tags?.split(",").includes(a));
      if (tag) counts[tag] = (counts[tag] || 0) + 1;
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  const GRADE_RANK: Record<string, number> = { NS: 1, AE: 2, ME: 3, EE: 4 };

  // Compares the EARLIEST graded note to the MOST RECENT graded note for a
  // subject — deliberately simple and explainable ("started AE, now EE = up")
  // rather than a statistical trend line that's harder to justify in a report.
  // subjectId === "sel" checks across every subject, matching how SEL already
  // aggregates cross-subject evidence elsewhere in this panel.
  function computeTrend(subjectId: string): "up" | "down" | "flat" | null {
    const relevant = subjectId === "sel" ? phoneNotes : phoneNotes.filter(n => n.subject === subjectId);
    const graded = relevant
      .map(n => {
        const tags = (n.tags || "").split(",").map(t => t.trim());
        const tag = tags.find(t => GRADE_RANK[t] !== undefined);
        return tag ? { date: n.date || "", rank: GRADE_RANK[tag] } : null;
      })
      .filter((x): x is { date: string; rank: number } => x !== null)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (graded.length < 2) return null;
    const first = graded[0].rank;
    const last = graded[graded.length - 1].rank;
    if (last > first) return "up";
    if (last < first) return "down";
    return "flat";
  }

  function TrendBadge({ subjectId }: { subjectId: string }) {
    const trend = computeTrend(subjectId);
    if (!trend) return null;
    const color = trend === "up" ? C.sageDark : trend === "down" ? C.roseDark : C.muted;
    const label = trend === "up" ? "↑ Trending up" : trend === "down" ? "↓ Trending down" : "→ Steady";
    return <span style={{ fontSize: "11px", fontWeight: 700, color }}>{label}</span>;
  }

  const exportStudentReport = () => {
    let text = `REPORT DRAFT: ${selectedStudent}\nGenerated: ${new Date().toLocaleDateString()}\n`;
    text += `${"=".repeat(60)}\n\n`;
    text += `LITERACY [${report.literacy.achievement}]\n${"-".repeat(40)}\n${report.literacy.draft}\n\n`;
    text += `Growth area 1: ${report.literacy.growth1}\nGrowth area 2: ${report.literacy.growth2}\n\n`;
    text += `MATHEMATICS [${report.maths.achievement}]\n${"-".repeat(40)}\n${report.maths.draft}\n\n`;
    text += `Growth area 1: ${report.maths.growth1}\nGrowth area 2: ${report.maths.growth2}\n\n`;
    text += `UNIT OF INQUIRY [${report.uoi.achievement}]\n${"-".repeat(40)}\n`;
    reportData.units.forEach((unit, i) => {
      text += `Unit ${i + 1}: ${unit.title || "Untitled"}\n${report.uoi.unitDrafts[i] || "Draft not yet generated."}\n\n`;
    });
    text += `Growth area 1: ${report.uoi.growth1}\nGrowth area 2: ${report.uoi.growth2}\n\n`;
    text += `SOCIAL EMOTIONAL LEARNING [${report.sel.achievement}]\n${"-".repeat(40)}\n${report.sel.draft}\n\n`;
    text += `Growth area 1: ${report.sel.growth1}\nGrowth area 2: ${report.sel.growth2}\n`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report-${selectedStudent.replace(/\s+/g, "-")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ ...cardStyle, background: "#fff", border: "2.5px solid #000", gridColumn: "span 2" }}>
      <button style={closeBtn} onClick={onClose}>×</button>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
        <span style={{ ...labelStyle, fontSize: "11px" }}>✏️ Draft Reports</span>
        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
          style={{ ...inputStyle, width: "auto", flex: "0 0 180px", fontSize: "14px", fontWeight: "700" }}>
          {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: C.muted }}>Pronouns:</span>
          {(["he", "she", "they"] as const).map(p => (
            <button key={p} onClick={() => {
              setStudents(prev => prev.map(s => s.name === selectedStudent ? { ...s, pronoun: p } : s));
            }}
              style={{ ...btnBase, padding: "3px 10px", fontSize: "11px", borderRadius: "20px",
                background: pronoun === p ? C.text : C.bg, color: pronoun === p ? "#fff" : C.muted,
                border: `1px solid ${C.cardBorder}` }}>
              {p}
            </button>
          ))}
        </div>
        <button onClick={() => generateAllSectionsForStudent(selectedStudent)} disabled={!!generating.batch_student || !!batchProgress}
          style={{ ...btnSlate, fontSize: "12px", padding: "6px 14px", marginLeft: "auto" }}>
          {generating.batch_student ? "✨ Generating all..." : `✨ Generate All Sections for ${selectedStudent}`}
        </button>
        <button onClick={exportStudentReport} style={{ ...btnSage, fontSize: "12px", padding: "6px 14px" }}>
          📥 Export {selectedStudent}'s Report
        </button>
      </div>

      {batchProgress && (
        <div style={{ background: C.highlight, borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: C.text, display: "flex", alignItems: "center", gap: "10px" }}>
          <span>⏳ Generating {batchProgress.current} of {batchProgress.total}: {batchProgress.label}</span>
          <div style={{ flex: 1, height: "6px", background: C.bg, borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%`, height: "100%", background: C.sageDark, transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}

      {showSettingsBlocks ? (
        <>
          {!setupNeedsAttention && (
            <button onClick={() => setSettingsExpanded(false)} style={{ ...linkStyle, alignSelf: "flex-start", marginLeft: 0 }}>
              ▲ Hide setup
            </button>
          )}
          {editingApiUrl ? (
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", background: C.highlight, borderRadius: "10px", padding: "8px 10px" }}>
              <span style={{ fontSize: "11px", color: C.muted, whiteSpace: "nowrap" }}>📱 Teacher API URL:</span>
              <input
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                style={{ ...inputStyle, flex: "1 1 260px", fontSize: "12px", padding: "5px 10px" }}
                onKeyDown={(e) => e.key === "Enter" && apiUrlInput.trim() && connectApiUrl()}
              />
              <button onClick={connectApiUrl} disabled={!apiUrlInput.trim()} style={{ ...btnSage, fontSize: "11px", padding: "5px 12px" }}>Connect</button>
              {!!getApiUrl() && (
                <button onClick={() => { setApiUrlInput(getApiUrl()); setEditingApiUrl(false); }} style={{ ...btnGhost, fontSize: "11px", padding: "5px 10px" }}>Cancel</button>
              )}
              <span style={{ fontSize: "10.5px", color: C.muted, width: "100%" }}>
                Same URL as the "Teacher API URL" field on your phone's /teacher page — copy it from there so both devices read the same Google Sheet.
              </span>
            </div>
          ) : phoneNotesLoading ? (
            <span style={{ fontSize: "11px", color: C.muted, fontStyle: "italic" }}>Loading phone notes for {selectedStudent}…</span>
          ) : phoneNotesError ? (
            <span style={{ fontSize: "11px", color: C.roseDark, fontStyle: "italic" }}>
              ⚠️ Couldn't load phone notes: {phoneNotesError}
              <button onClick={() => setEditingApiUrl(true)} style={linkStyle}>Change API URL</button>
            </span>
          ) : phoneNotes.length === 0 ? (
            <span style={{ fontSize: "11px", color: C.muted, fontStyle: "italic" }}>
              📱 No phone notes logged yet for {selectedStudent}.
              <button onClick={() => setEditingApiUrl(true)} style={linkStyle}>Change API URL</button>
            </span>
          ) : noNotesMatchAnyTab ? (
            <span style={{ fontSize: "11px", color: C.roseDark, fontStyle: "italic" }}>
              ⚠️ {phoneNotes.length} phone note{phoneNotes.length === 1 ? "" : "s"} loaded for {selectedStudent}, but none are tagged "literacy", "maths", or "uoi" — they won't show under any tab. Subject value{notedSubjects.length === 1 ? "" : "s"} found: {notedSubjects.join(", ") || "(blank)"}.
            </span>
          ) : (
            <span style={{ fontSize: "11px", color: C.muted, fontStyle: "italic" }}>
              📱 {phoneNotes.length} phone note{phoneNotes.length === 1 ? "" : "s"} loaded for {selectedStudent} (subjects: {notedSubjects.join(", ")}) — used automatically in "Generate Draft" and shown below each section.
              <button onClick={() => setEditingApiUrl(true)} style={linkStyle}>Change API URL</button>
            </span>
          )}

          {editingKey ? (
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", background: C.highlight, borderRadius: "10px", padding: "8px 10px" }}>
              <span style={{ fontSize: "11px", color: C.muted, whiteSpace: "nowrap" }}>✨ Gemini API Key:</span>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIza..."
                style={{ ...inputStyle, flex: "1 1 220px", fontSize: "12px", padding: "5px 10px" }}
                onKeyDown={(e) => e.key === "Enter" && keyInput.trim() && saveGeminiKey()}
              />
              <button onClick={saveGeminiKey} disabled={!keyInput.trim()} style={{ ...btnSage, fontSize: "11px", padding: "5px 12px" }}>Save</button>
              {!!geminiKey && (
                <button onClick={() => { setKeyInput(geminiKey); setEditingKey(false); }} style={{ ...btnGhost, fontSize: "11px", padding: "5px 10px" }}>Cancel</button>
              )}
              <span style={{ fontSize: "10.5px", color: C.muted, width: "100%" }}>
                Required for "✨ Generate Draft" — free to get at aistudio.google.com, no credit card needed. Stored only in this browser's local storage and sent directly from your browser to Google, so only enter it on a device you trust.
              </span>
            </div>
          ) : (
            <span style={{ fontSize: "11px", color: C.muted, fontStyle: "italic" }}>
              ✨ Gemini API key connected.
              <button onClick={() => setEditingKey(true)} style={linkStyle}>Change key</button>
            </span>
          )}
        </>
      ) : (
        <button onClick={() => setSettingsExpanded(true)} style={{
          background: C.highlight, border: `1px solid ${C.cardBorder}`, borderRadius: "10px",
          padding: "6px 10px", fontSize: "11px", color: C.muted, cursor: "pointer",
          textAlign: "left", fontFamily: font,
        }}>
          ⚙️ {phoneNotes.length} phone note{phoneNotes.length === 1 ? "" : "s"} · ✨ Gemini connected — tap to view setup
        </button>
      )}

      {draftError && (
        <div style={{ background: "#f6e6e6", border: `1.5px solid ${C.roses}`, borderRadius: "10px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: C.roseDark }}>⚠️ Draft generation failed: {draftError}</span>
          <button onClick={() => setDraftError("")} style={{ ...btnGhost, fontSize: "11px", padding: "3px 10px", marginLeft: "auto" }}>Dismiss</button>
        </div>
      )}

      {phoneNotes.length > 0 && (
        <div>
          <button onClick={() => setShowTimeline(v => !v)} style={{ ...btnGhost, fontSize: "11px", padding: "5px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
            {showTimeline ? "▲ Hide" : "▼ Show"} full timeline for {selectedStudent} ({phoneNotes.length})
          </button>
          {showTimeline && (
            <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", background: C.highlight, borderRadius: "10px", padding: "10px", marginTop: "8px" }}>
              {phoneNotes.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "")).map(n => (
                <div key={n.id} style={{ background: "#fff", borderRadius: "8px", padding: "8px 10px", fontSize: "12.5px", lineHeight: 1.5 }}>
                  <span style={{ color: C.muted, marginRight: "6px" }}>{n.date}</span>
                  <span style={{ background: C.bg, borderRadius: "6px", padding: "1px 6px", marginRight: "6px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" }}>{n.subject}</span>
                  {n.tags && <span style={{ background: C.bg, borderRadius: "6px", padding: "1px 6px", marginRight: "6px", fontSize: "11px", fontWeight: 700 }}>{n.tags}</span>}
                  {n.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", borderBottom: `1.5px solid ${C.cardBorder}`, paddingBottom: "8px" }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ ...btnBase, padding: "6px 16px", fontSize: "13px", borderRadius: "10px",
              background: activeTab === tab.key ? C.text : C.highlight,
              color: activeTab === tab.key ? "#fff" : C.text }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* LITERACY TAB */}
      {activeTab === "literacy" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <EvidenceList
            notes={phoneNotes.filter(n => n.subject === "literacy")}
            onInsert={(text) => updateReport("literacy", "draft", report.literacy.draft ? `${report.literacy.draft}\n${text}` : text)}
          />
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ ...labelStyle, fontSize: "10px" }}>Achievement:</span>
            <TrendBadge subjectId="literacy" />
            {ACHIEVEMENTS.map(a => (
              <button key={a} onClick={() => updateReport("literacy", "achievement", a)}
                style={{ ...btnBase, padding: "4px 12px", fontSize: "12px", borderRadius: "8px",
                  background: report.literacy.achievement === a ? C.slate : C.bg,
                  color: report.literacy.achievement === a ? "#fff" : C.text,
                  border: `1px solid ${C.cardBorder}` }}>{a}</button>
            ))}
            {suggestAchievement("literacy") && (
              <button onClick={() => updateReport("literacy", "achievement", suggestAchievement("literacy")!)}
                style={{ ...btnGhost, padding: "4px 10px", fontSize: "11px" }}>
                💡 Suggest: {suggestAchievement("literacy")}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setShowMoreActions(v => !v)} title="More actions" style={{ ...btnGhost, padding: "6px 10px", fontSize: "13px", marginRight: "auto" }}>⋯</button>
            {showMoreActions && report.literacy.draft && (
              <button onClick={() => { if (confirm("Clear this draft? This can't be undone.")) updateReport("literacy", "draft", ""); }}
                style={{ ...btnGhost, padding: "6px 12px", fontSize: "12px", color: C.roseDark }}>
                🗑️ Clear
              </button>
            )}
            <button onClick={() => compileFromNotes("literacy")}
              style={{ ...btnGhost, padding: "6px 14px", fontSize: "12px" }}>
              📋 Compile from Notes (free)
            </button>
            <button onClick={() => generateDraft("literacy")} disabled={generating.literacy}
              style={{ ...btnSage, padding: "6px 16px", fontSize: "13px" }}>
              {generating.literacy ? "✨ Generating..." : "✨ Generate Draft"}
            </button>
            {showMoreActions && (
              <button onClick={() => generateSubjectForWholeClass("literacy")} disabled={!!generating.batch_literacy || !!batchProgress}
                style={{ ...btnSlate, padding: "6px 14px", fontSize: "12px" }}>
                {generating.batch_literacy ? "✨ Generating class..." : "✨ Generate for Whole Class"}
              </button>
            )}
          </div>
          <textarea value={report.literacy.draft} onChange={e => updateReport("literacy", "draft", e.target.value)}
            placeholder="Click 'Generate Draft' or type directly..."
            style={{ ...inputStyle, minHeight: "160px", resize: "vertical", fontSize: "14px", lineHeight: 1.7 }} />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => generateGrowthAreas("literacy")} disabled={generating.growth_literacy}
              style={{ ...btnGhost, padding: "4px 12px", fontSize: "11px" }}>
              {generating.growth_literacy ? "✨ Thinking..." : "✨ Suggest Growth Areas (from NS/AE notes)"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <span style={{ ...labelStyle, fontSize: "10px" }}>Growth Area 1</span>
              <input value={report.literacy.growth1} onChange={e => updateReport("literacy", "growth1", e.target.value)}
                placeholder="e.g. Developing more complex sentence structures"
                style={{ ...inputStyle, fontSize: "13px", marginTop: "4px" }} />
            </div>
            <div>
              <span style={{ ...labelStyle, fontSize: "10px" }}>Growth Area 2</span>
              <input value={report.literacy.growth2} onChange={e => updateReport("literacy", "growth2", e.target.value)}
                placeholder="e.g. Using evidence to support written arguments"
                style={{ ...inputStyle, fontSize: "13px", marginTop: "4px" }} />
            </div>
          </div>
        </div>
      )}

      {/* MATHS TAB */}
      {activeTab === "maths" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <EvidenceList
            notes={phoneNotes.filter(n => n.subject === "maths")}
            onInsert={(text) => updateReport("maths", "draft", report.maths.draft ? `${report.maths.draft}\n${text}` : text)}
          />
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ ...labelStyle, fontSize: "10px" }}>Achievement:</span>
            <TrendBadge subjectId="maths" />
            {ACHIEVEMENTS.map(a => (
              <button key={a} onClick={() => updateReport("maths", "achievement", a)}
                style={{ ...btnBase, padding: "4px 12px", fontSize: "12px", borderRadius: "8px",
                  background: report.maths.achievement === a ? C.slate : C.bg,
                  color: report.maths.achievement === a ? "#fff" : C.text,
                  border: `1px solid ${C.cardBorder}` }}>{a}</button>
            ))}
            {suggestAchievement("maths") && (
              <button onClick={() => updateReport("maths", "achievement", suggestAchievement("maths")!)}
                style={{ ...btnGhost, padding: "4px 10px", fontSize: "11px" }}>
                💡 Suggest: {suggestAchievement("maths")}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setShowMoreActions(v => !v)} title="More actions" style={{ ...btnGhost, padding: "6px 10px", fontSize: "13px", marginRight: "auto" }}>⋯</button>
            {showMoreActions && report.maths.draft && (
              <button onClick={() => { if (confirm("Clear this draft? This can't be undone.")) updateReport("maths", "draft", ""); }}
                style={{ ...btnGhost, padding: "6px 12px", fontSize: "12px", color: C.roseDark }}>
                🗑️ Clear
              </button>
            )}
            <button onClick={() => compileFromNotes("maths")}
              style={{ ...btnGhost, padding: "6px 14px", fontSize: "12px" }}>
              📋 Compile from Notes (free)
            </button>
            <button onClick={() => generateDraft("maths")} disabled={generating.maths}
              style={{ ...btnSage, padding: "6px 16px", fontSize: "13px" }}>
              {generating.maths ? "✨ Generating..." : "✨ Generate Draft"}
            </button>
            {showMoreActions && (
              <button onClick={() => generateSubjectForWholeClass("maths")} disabled={!!generating.batch_maths || !!batchProgress}
                style={{ ...btnSlate, padding: "6px 14px", fontSize: "12px" }}>
                {generating.batch_maths ? "✨ Generating class..." : "✨ Generate for Whole Class"}
              </button>
            )}
          </div>
          <textarea value={report.maths.draft} onChange={e => updateReport("maths", "draft", e.target.value)}
            placeholder="Click 'Generate Draft' or type directly..."
            style={{ ...inputStyle, minHeight: "160px", resize: "vertical", fontSize: "14px", lineHeight: 1.7 }} />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => generateGrowthAreas("maths")} disabled={generating.growth_maths}
              style={{ ...btnGhost, padding: "4px 12px", fontSize: "11px" }}>
              {generating.growth_maths ? "✨ Thinking..." : "✨ Suggest Growth Areas (from NS/AE notes)"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <span style={{ ...labelStyle, fontSize: "10px" }}>Growth Area 1</span>
              <input value={report.maths.growth1} onChange={e => updateReport("maths", "growth1", e.target.value)}
                placeholder="e.g. Applying strategies to multi-step problems"
                style={{ ...inputStyle, fontSize: "13px", marginTop: "4px" }} />
            </div>
            <div>
              <span style={{ ...labelStyle, fontSize: "10px" }}>Growth Area 2</span>
              <input value={report.maths.growth2} onChange={e => updateReport("maths", "growth2", e.target.value)}
                placeholder="e.g. Explaining mathematical reasoning clearly"
                style={{ ...inputStyle, fontSize: "13px", marginTop: "4px" }} />
            </div>
          </div>
        </div>
      )}

      {/* UOI TAB */}
      {activeTab === "uoi" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", background: C.highlight, borderRadius: "12px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ fontWeight: "700", fontSize: "13px", color: C.text }}>Unit {i + 1}:</span>
                <input value={reportData.units[i]?.title || ""} onChange={e => {
                  const updated = [...reportData.units];
                  updated[i] = { ...updated[i], title: e.target.value };
                  setReportData(prev => ({ ...prev, units: updated }));
                }} placeholder="Unit title..." style={{ ...inputStyle, flex: 1, fontSize: "13px", padding: "4px 10px" }} />
                <select
                  value=""
                  onChange={e => {
                    const key = e.target.value;
                    if (!key || !themePresets[key]) return;
                    const preset = themePresets[key];
                    const updated = [...reportData.units];
                    updated[i] = { title: key, centralIdea: preset.centralIdea, loi1: preset.loi1, loi2: preset.loi2, loi3: preset.loi3 };
                    setReportData(prev => ({ ...prev, units: updated }));
                  }}
                  style={{ ...inputStyle, width: "auto", fontSize: "11px", padding: "4px 8px", flexShrink: 0 }}
                  title="Fill this unit from a saved Theme Preset"
                >
                  <option value="">📥 Load preset...</option>
                  {Object.keys(themePresets).map(key => <option key={key} value={key}>{key}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                {["centralIdea", "loi1", "loi2", "loi3"].slice(0, 3).map((field, fi) => (
                  <input key={field} value={(reportData.units[i] as any)?.[["centralIdea", "loi1", "loi2", "loi3"][fi + (fi === 0 ? 0 : 0)]] || ""}
                    onChange={e => {
                      const updated = [...reportData.units];
                      updated[i] = { ...updated[i], [["centralIdea", "loi1", "loi2", "loi3"][fi]]: e.target.value };
                      setReportData(prev => ({ ...prev, units: updated }));
                    }}
                    placeholder={["Central idea...", "LOI 1...", "LOI 2..."][fi]}
                    style={{ ...inputStyle, fontSize: "12px", padding: "4px 8px" }} />
                ))}
              </div>
              {reportData.units[i]?.centralIdea?.trim() ? (
                <EvidenceList
                  notes={phoneNotes.filter(n => n.subject === "uoi" && n.unitTitle === reportData.units[i]?.centralIdea)}
                  onInsert={(text) => updateReport("uoi", "unitDraft", report.uoi.unitDrafts[i] ? `${report.uoi.unitDrafts[i]}\n${text}` : text, i)}
                />
              ) : (
                <span style={{ fontSize: "11px", color: C.muted, fontStyle: "italic" }}>
                  Set this unit's Central Idea (or "Load preset...") to match phone notes to it.
                </span>
              )}
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                {showMoreActions && report.uoi.unitDrafts[i] && (
                  <button onClick={() => { if (confirm("Clear this unit's draft? This can't be undone.")) updateReport("uoi", "unitDraft", "", i); }}
                    style={{ ...btnGhost, padding: "6px 10px", fontSize: "11px", marginRight: "auto", color: C.roseDark }}>
                    🗑️ Clear
                  </button>
                )}
                <button onClick={() => compileUoiFromNotes(i)}
                  style={{ ...btnGhost, padding: "6px 12px", fontSize: "11px", whiteSpace: "nowrap", marginLeft: showMoreActions ? 0 : "auto" }}>
                  📋 Compile (free)
                </button>
                <button onClick={() => generateUoiDraft(i)} disabled={generating[`uoi_${i}`]}
                  style={{ ...btnSage, padding: "6px 14px", fontSize: "12px", whiteSpace: "nowrap" }}>
                  {generating[`uoi_${i}`] ? "✨ Generating..." : "✨ Generate"}
                </button>
              </div>
              <textarea value={report.uoi.unitDrafts[i] || ""} onChange={e => updateReport("uoi", "unitDraft", e.target.value, i)}
                placeholder="Generate or type draft for this unit..."
                style={{ ...inputStyle, minHeight: "120px", resize: "vertical", fontSize: "13px", lineHeight: 1.7 }} />
            </div>
          ))}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ ...labelStyle, fontSize: "10px" }}>Overall Achievement:</span>
            <TrendBadge subjectId="uoi" />
            {ACHIEVEMENTS.map(a => (
              <button key={a} onClick={() => updateReport("uoi", "achievement", a)}
                style={{ ...btnBase, padding: "4px 12px", fontSize: "12px", borderRadius: "8px",
                  background: report.uoi.achievement === a ? C.slate : C.bg,
                  color: report.uoi.achievement === a ? "#fff" : C.text,
                  border: `1px solid ${C.cardBorder}` }}>{a}</button>
            ))}
            {suggestAchievement("uoi") && (
              <button onClick={() => updateReport("uoi", "achievement", suggestAchievement("uoi")!)}
                style={{ ...btnGhost, padding: "4px 10px", fontSize: "11px" }}>
                💡 Suggest: {suggestAchievement("uoi")}
              </button>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => generateGrowthAreas("uoi")} disabled={generating.growth_uoi}
              style={{ ...btnGhost, padding: "4px 12px", fontSize: "11px" }}>
              {generating.growth_uoi ? "✨ Thinking..." : "✨ Suggest Growth Areas (from NS/AE notes)"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <span style={{ ...labelStyle, fontSize: "10px" }}>Overall Growth Area 1</span>
              <input value={report.uoi.growth1} onChange={e => updateReport("uoi", "growth1", e.target.value)}
                placeholder="e.g. Taking action based on inquiry findings"
                style={{ ...inputStyle, fontSize: "13px", marginTop: "4px" }} />
            </div>
            <div>
              <span style={{ ...labelStyle, fontSize: "10px" }}>Overall Growth Area 2</span>
              <input value={report.uoi.growth2} onChange={e => updateReport("uoi", "growth2", e.target.value)}
                placeholder="e.g. Making connections across lines of inquiry"
                style={{ ...inputStyle, fontSize: "13px", marginTop: "4px" }} />
            </div>
          </div>
        </div>
      )}

      {/* SEL TAB */}
      {activeTab === "sel" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <EvidenceList
            notes={phoneNotes}
            showSubject
            onInsert={(text) => updateReport("sel", "draft", report.sel.draft ? `${report.sel.draft}\n${text}` : text)}
          />
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ ...labelStyle, fontSize: "10px" }}>Achievement:</span>
            <TrendBadge subjectId="sel" />
            {ACHIEVEMENTS.map(a => (
              <button key={a} onClick={() => updateReport("sel", "achievement", a)}
                style={{ ...btnBase, padding: "4px 12px", fontSize: "12px", borderRadius: "8px",
                  background: report.sel.achievement === a ? C.slate : C.bg,
                  color: report.sel.achievement === a ? "#fff" : C.text,
                  border: `1px solid ${C.cardBorder}` }}>{a}</button>
            ))}
            {suggestAchievement("sel") && (
              <button onClick={() => updateReport("sel", "achievement", suggestAchievement("sel")!)}
                style={{ ...btnGhost, padding: "4px 10px", fontSize: "11px" }}>
                💡 Suggest: {suggestAchievement("sel")}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setShowMoreActions(v => !v)} title="More actions" style={{ ...btnGhost, padding: "6px 10px", fontSize: "13px", marginRight: "auto" }}>⋯</button>
            {showMoreActions && report.sel.draft && (
              <button onClick={() => { if (confirm("Clear this draft? This can't be undone.")) updateReport("sel", "draft", ""); }}
                style={{ ...btnGhost, padding: "6px 12px", fontSize: "12px", color: C.roseDark }}>
                🗑️ Clear
              </button>
            )}
            <button onClick={() => compileFromNotes("sel")}
              style={{ ...btnGhost, padding: "6px 14px", fontSize: "12px" }}>
              📋 Compile from Notes (free)
            </button>
            <button onClick={() => generateDraft("sel")} disabled={generating.sel}
              style={{ ...btnSage, padding: "6px 16px", fontSize: "13px" }}>
              {generating.sel ? "✨ Generating..." : "✨ Generate Draft"}
            </button>
            {showMoreActions && (
              <button onClick={() => generateSubjectForWholeClass("sel")} disabled={!!generating.batch_sel || !!batchProgress}
                style={{ ...btnSlate, padding: "6px 14px", fontSize: "12px" }}>
                {generating.batch_sel ? "✨ Generating class..." : "✨ Generate for Whole Class"}
              </button>
            )}
          </div>
          <textarea value={report.sel.draft} onChange={e => updateReport("sel", "draft", e.target.value)}
            placeholder="Click 'Generate Draft' or type directly. Based on ATL skills and classroom interactions."
            style={{ ...inputStyle, minHeight: "160px", resize: "vertical", fontSize: "14px", lineHeight: 1.7 }} />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => generateGrowthAreas("sel")} disabled={generating.growth_sel}
              style={{ ...btnGhost, padding: "4px 12px", fontSize: "11px" }}>
              {generating.growth_sel ? "✨ Thinking..." : "✨ Suggest Growth Areas (from NS/AE notes)"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <span style={{ ...labelStyle, fontSize: "10px" }}>Growth Area 1</span>
              <input value={report.sel.growth1} onChange={e => updateReport("sel", "growth1", e.target.value)}
                placeholder="e.g. Managing frustration during challenging tasks"
                style={{ ...inputStyle, fontSize: "13px", marginTop: "4px" }} />
            </div>
            <div>
              <span style={{ ...labelStyle, fontSize: "10px" }}>Growth Area 2</span>
              <input value={report.sel.growth2} onChange={e => updateReport("sel", "growth2", e.target.value)}
                placeholder="e.g. Contributing ideas during group discussions"
                style={{ ...inputStyle, fontSize: "13px", marginTop: "4px" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──
export default function App() {
  const [time, setTime] = useState<Date>(new Date());
  const [seconds, setSeconds] = useState<number>(300);
  const [running, setRunning] = useState<boolean>(false);
  const [minutes, setMinutes] = useState<number>(5);
  // Drives a visual flash on the Timer card when it hits zero — audio alone
  // is easy to miss over classroom noise or if the tab isn't the active window.
  const [timerJustFinished, setTimerJustFinished] = useState<boolean>(false);
  const [swRunning, setSwRunning] = useState<boolean>(false);
  const [swMs, setSwMs] = useState<number>(0);
  const swRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Captured synchronously during the first render — i.e. before ANY effect
  // (including the plain localStorage-persist effects below) has had a
  // chance to write a default value back in. This is what lets the restore
  // effect tell "genuinely fresh browser" apart from "already has data".
  const wasStudentsEmptyAtBoot = useRef(localStorage.getItem("classListObjects") === null).current;
  const wasTimetableEmptyAtBoot = useRef(localStorage.getItem("timetable") === null).current;
  const wasThemePresetsEmptyAtBoot = useRef(localStorage.getItem("uoiThemePresetsRegistry") === null).current;
  const wasReportDataEmptyAtBoot = useRef(localStorage.getItem("reportData") === null).current;
  const [notes, setNotes] = useState<string>(() => localStorage.getItem("notes") || "");
  const [students, setStudents] = useState<Student[]>(() => {
    try { const stored = localStorage.getItem("classListObjects"); return stored ? JSON.parse(stored) : []; }
    catch { return []; }
  });
  const [studentName, setStudentName] = useState<string>("");
  const [chosenStudent, setChosenStudent] = useState<string>("");
  const [groupSize, setGroupSize] = useState<number>(3);
  const [generatedGroups, setGeneratedGroups] = useState<string[][]>([]);
  const [timetable, setTimetable] = useState<TimetableItem[]>(() => { try { return JSON.parse(localStorage.getItem("timetable") || "[]"); } catch { return []; } });
  const [templates, setTemplates] = useState<Record<string, Omit<TimetableItem, "id">[]>>(() => { try { return JSON.parse(localStorage.getItem("timetableTemplates") || "{}"); } catch { return {}; } });
  const [newTemplateName, setNewTemplateName] = useState<string>("");
  const [headlineLessonId, setHeadlineLessonId] = useState<string>(() => localStorage.getItem("activeHeadlineId") || "art");
  const [subjectProfiles, setSubjectProfiles] = useState<Record<string, SubjectProfile>>(() => { try { return JSON.parse(localStorage.getItem("subjectProfiles") || "{}"); } catch { return {}; } });
  const [newSubTaskText, setNewSubTaskText] = useState<string>("");
  const [isEditingMaterials, setIsEditingMaterials] = useState<boolean>(false);
  const [isEditingPresets, setIsEditingPresets] = useState<boolean>(false);
  const [selectedPresetToEdit, setSelectedPresetToEdit] = useState<string>("Who we are");
  const [themePresets, setThemePresets] = useState<Record<string, Presets>>(() => {
    try { const saved = localStorage.getItem("uoiThemePresetsRegistry"); return saved ? JSON.parse(saved) : DEFAULT_THEME_PRESETS; }
    catch { return DEFAULT_THEME_PRESETS; }
  });
  const [widgetSpan, setWidgetSpan] = useState<Partial<Record<Widget, boolean>>>({
    embedder: true, youtubeWidget: true, notes: false, taskBreakdown: true, morningStarter: true,
  });
  const [reportData, setReportData] = useState<ReportData>(() => {
    try { return JSON.parse(localStorage.getItem("reportData") || "null") || { units: [{title:"",centralIdea:"",loi1:"",loi2:"",loi3:""},{title:"",centralIdea:"",loi1:"",loi2:"",loi3:""},{title:"",centralIdea:"",loi1:"",loi2:"",loi3:""}], studentReports: {} }; }
    catch { return { units: [{title:"",centralIdea:"",loi1:"",loi2:"",loi3:""},{title:"",centralIdea:"",loi1:"",loi2:"",loi3:""},{title:"",centralIdea:"",loi1:"",loi2:"",loi3:""}], studentReports: {} }; }
  });
  const [showReportPanel, setShowReportPanel] = useState<boolean>(false);
  const [exportingDoc, setExportingDoc] = useState<boolean>(false);
  const [exportDocError, setExportDocError] = useState<string>("");
  // AI-generated 5-questions-and-a-prompt warm-up kids can start on independently
  // as they arrive. Grounded in whatever the current Maths/Literacy learning
  // objectives actually are, when set — otherwise falls back to general review.
  const [morningStarter, setMorningStarter] = useState<{ date: string; mathsQuestions: string[]; literacyPrompt: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem("morningStarter") || "null"); } catch { return null; }
  });
  const [generatingStarter, setGeneratingStarter] = useState<boolean>(false);
  const [starterError, setStarterError] = useState<string>("");
  const [teams, setTeams] = useState<ScoreTeam[]>([{ id: 1, name: "Team A", score: 0, color: "#2f9e52" }, { id: 2, name: "Team B", score: 0, color: "#2f6fb8" }]);
  const [newTeamName, setNewTeamName] = useState<string>("");
  const [diceValue, setDiceValue] = useState<number>(1);
  const [rolling, setRolling] = useState<boolean>(false);
  const [embedHtml, setEmbedHtml] = useState<string>(() => localStorage.getItem("embedCodeMarkup") || "");
  const [isEmbedInputCollapsed, setIsEmbedInputCollapsed] = useState<boolean>(false);
  const [youtubeUrl, setYoutubeUrl] = useState<string>(() => localStorage.getItem("youtubeLinkUrl") || "");
  const [isYoutubeInputCollapsed, setIsYoutubeInputCollapsed] = useState<boolean>(false);
  const [hoveredSidebarId, setHoveredSidebarId] = useState<number | null>(null);
  const [workMode, setWorkMode] = useState<{ id: string; icon: string; label: string; color: string; bg: string }>(WORK_MODES[0]);
  const [activeGroupMenu, setActiveGroupMenu] = useState<string | null>(null);
  const [confirmClearActive, setConfirmClearActive] = useState<boolean>(false);
  const [presentationMode, setPresentationMode] = useState<boolean>(() => localStorage.getItem("presentationMode") === "1");
  const [visible, setVisible] = useState<Record<Widget, boolean>>({
    timetable: true, taskBreakdown: false, clock: false, timer: false, morningStarter: false,
    stopwatch: false, notes: false, roster: false, groups: false, scoreboard: false, dice: false,
    workSymbols: false, embedder: false, youtubeWidget: false
  });
const playTimerChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const duration = 5;
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.25);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime + 0.5);
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.75);
      
      gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio context error", e);
    }
  };

  const toggle = (key: Widget) => setVisible((v) => ({ ...v, [key]: !v[key] }));

  useEffect(() => {
    if (!timerJustFinished) return;
    const id = setTimeout(() => setTimerJustFinished(false), 8000);
    return () => clearTimeout(id);
  }, [timerJustFinished]);

  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  
   useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          playTimerChime();
          setTimerJustFinished(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);
  
  useEffect(() => {
    if (swRunning) {
      swRef.current = setInterval(() => setSwMs((m) => m + 100), 100);
    } else {
      if (swRef.current) clearInterval(swRef.current);
    }
    return () => { if (swRef.current) clearInterval(swRef.current); };
  }, [swRunning]);

  useEffect(() => { localStorage.setItem("classListObjects", JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem("timetable", JSON.stringify(timetable)); }, [timetable]);
  useEffect(() => { localStorage.setItem("notes", notes); }, [notes]);
  useEffect(() => { localStorage.setItem("activeHeadlineId", headlineLessonId); }, [headlineLessonId]);
  useEffect(() => { localStorage.setItem("subjectProfiles", JSON.stringify(subjectProfiles)); }, [subjectProfiles]);
  useEffect(() => { localStorage.setItem("embedCodeMarkup", embedHtml); }, [embedHtml]);
  useEffect(() => { localStorage.setItem("youtubeLinkUrl", youtubeUrl); }, [youtubeUrl]);
  useEffect(() => { localStorage.setItem("uoiThemePresetsRegistry", JSON.stringify(themePresets)); }, [themePresets]);
  useEffect(() => { localStorage.setItem("reportData", JSON.stringify(reportData)); }, [reportData]);
  useEffect(() => { localStorage.setItem("morningStarter", JSON.stringify(morningStarter)); }, [morningStarter]);

  // Presentation mode: a one-tap way to hide every teacher/editing control so the
  // shared screen only shows what students need to see. Entering it force-closes
  // any open editing panels so nothing is left mid-edit and exposed on the display.
  useEffect(() => {
    localStorage.setItem("presentationMode", presentationMode ? "1" : "0");
    if (presentationMode) {
      setIsEditingMaterials(false);
      setIsEditingPresets(false);
      setShowReportPanel(false);
      setActiveGroupMenu(null);
      setConfirmClearActive(false);
    }
  }, [presentationMode]);

  useEffect(() => {
    if (!getApiUrl()) return;
    const todaysLessonIds = Array.from(new Set(timetable.map((item) => item.lessonId)));
    const intentions: Record<string, { label: string; centralIdea: string; loi1: string; loi2: string; loi3: string; learningObjective: string }> = {};
    todaysLessonIds.forEach((id) => {
      const profile = subjectProfiles[id];
      const lessonType = LESSON_TYPES.find((lt) => lt.id === id);
      intentions[id] = {
        label: lessonType?.label || id,
        centralIdea: profile?.centralIdea || "",
        loi1: profile?.loi1 || "",
        loi2: profile?.loi2 || "",
        loi3: profile?.loi3 || "",
        learningObjective: profile?.learningObjective || "",
      };
    });
    if (Object.keys(intentions).length) {
      pushIntentions(intentions).catch(() => {});
    }
  }, [subjectProfiles, timetable]);
  useEffect(() => {
    if (!getApiUrl()) return;
    pushStudents(students.map(s => ({ name: s.name, present: s.present, pronoun: s.pronoun }))).catch(() => {});
  }, [students]);

  // ── BACKUP TO GOOGLE SHEETS ──
  // Notes were already safe (they've always lived in the Sheet). Timetable,
  // theme presets, and report drafts previously lived ONLY in this browser's
  // localStorage — gone forever if the cache cleared or you switched devices.
  // Debounced (1.5s) so typing in a draft textarea doesn't fire a network
  // request on every keystroke.
  useEffect(() => {
    if (!getApiUrl()) return;
    const id = setTimeout(() => { pushAppConfig("timetable", JSON.stringify(timetable)).catch(() => {}); }, 1500);
    return () => clearTimeout(id);
  }, [timetable]);
  useEffect(() => {
    if (!getApiUrl()) return;
    const id = setTimeout(() => { pushAppConfig("themePresets", JSON.stringify(themePresets)).catch(() => {}); }, 1500);
    return () => clearTimeout(id);
  }, [themePresets]);
  useEffect(() => {
    if (!getApiUrl()) return;
    // Stored as one small row per student (not one giant blob for the whole
    // class) — a single cell in Google Sheets caps out at 50,000 characters,
    // and a full class's worth of drafts in one cell would blow past that by
    // mid-term, silently failing right when the backup matters most.
    const id = setTimeout(() => {
      pushAppConfig("reportUnits", JSON.stringify(reportData.units)).catch(() => {});
      Object.entries(reportData.studentReports).forEach(([name, report]) => {
        pushAppConfig(`reportData:${name}`, JSON.stringify(report)).catch(() => {});
      });
    }, 1500);
    return () => clearTimeout(id);
  }, [reportData]);

  // Restore from the cloud backup exactly once, on mount — and only into
  // whichever pieces were genuinely empty when this browser loaded (a fresh
  // device/cleared cache), so it can never clobber work already in progress
  // on a browser that already has its own local data.
  useEffect(() => {
    if (!getApiUrl()) return;
    if (wasTimetableEmptyAtBoot || wasThemePresetsEmptyAtBoot || wasReportDataEmptyAtBoot) {
      fetchAppConfig().then((config) => {
        if (wasTimetableEmptyAtBoot && config.timetable) {
          try { setTimetable(JSON.parse(config.timetable)); } catch {}
        }
        if (wasThemePresetsEmptyAtBoot && config.themePresets) {
          try { setThemePresets(JSON.parse(config.themePresets)); } catch {}
        }
        if (wasReportDataEmptyAtBoot) {
          const studentReports: ReportData["studentReports"] = {};
          Object.entries(config).forEach(([key, value]) => {
            if (key.startsWith("reportData:")) {
              try { studentReports[key.slice("reportData:".length)] = JSON.parse(value); } catch {}
            }
          });
          let units: ReportData["units"] | undefined;
          if (config.reportUnits) {
            try { units = JSON.parse(config.reportUnits); } catch {}
          }
          if (units || Object.keys(studentReports).length > 0) {
            setReportData(prev => ({ units: units || prev.units, studentReports }));
          }
        }
      }).catch(() => {});
    }
    if (wasStudentsEmptyAtBoot) {
      fetchStudents().then((cloudStudents) => {
        if (cloudStudents.length) {
          setStudents(cloudStudents.map(s => ({ name: s.name, present: s.present, pronoun: (s.pronoun as "he" | "she" | "they") || "they" })));
        }
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tell the /teacher page what's currently being taught, so it can auto-follow
  // instead of relying on the teacher remembering to switch subjects manually.
  useEffect(() => {
    if (!getApiUrl()) return;
    pushActiveSubject(headlineLessonId).catch(() => {});
  }, [headlineLessonId]);

  const currentProfile: SubjectProfile = subjectProfiles[headlineLessonId] || {
    materials: {}, learningObjective: headlineLessonId === "uoi" ? "" : "🎯 ",
    centralIdea: "", loi1: "", loi2: "", loi3: "", activeLoiHighlight: 0,
    atls: "", subTasks: [], observations: {}, activeTaskId: null,
  };

  const updateProfileField = (field: keyof SubjectProfile, val: any) => {
    setSubjectProfiles(prev => ({
      ...prev,
      [headlineLessonId]: {
        ...((prev[headlineLessonId] || { materials: {}, learningObjective: "", centralIdea: "", loi1: "", loi2: "", loi3: "", activeLoiHighlight: 0, atls: "", subTasks: [], observations: {}, activeTaskId: null }) as SubjectProfile),
        [field]: val
      }
    }));
  };

  const updatePresetField = (themeKey: string, field: keyof Presets, val: string) => {
    setThemePresets(prev => ({ ...prev, [themeKey]: { ...prev[themeKey], [field]: val } }));
  };

  const applyUoiPreset = (themeKey: string) => {
    const data = themePresets[themeKey];
    if (!data) return;
    setSubjectProfiles(prev => ({
      ...prev,
      uoi: {
        ...((prev.uoi || { materials: {}, learningObjective: "", atls: "", subTasks: [], observations: {}, activeTaskId: null }) as SubjectProfile),
        centralIdea: data.centralIdea, loi1: data.loi1, loi2: data.loi2, loi3: data.loi3, activeLoiHighlight: 0
      }
    }));
    setHeadlineLessonId("uoi");
    setIsEditingPresets(false);
  };

  const activeHeadlineItem = LESSON_TYPES.find(l => l.id === headlineLessonId);

  const swFormatted = (() => {
    const totalSec = Math.floor(swMs / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    const ms = Math.floor((swMs % 1000) / 100);
    return `${m}:${s}.${ms}`;
  })();

  const rollDice = () => {
    if (rolling) return;
    setRolling(true);
    let count = 0;
    const id = setInterval(() => {
      setDiceValue(Math.ceil(Math.random() * 6));
      count++;
      if (count >= 12) { clearInterval(id); setRolling(false); }
    }, 80);
  };

  const saveCurrentAsTemplate = () => {
    if (!newTemplateName.trim()) return;
    const cleanedItems = timetable.map(({ lessonId, time, note }) => ({ lessonId, time, note, done: false }));
    const updated = { ...templates, [newTemplateName.trim()]: cleanedItems };
    setTemplates(updated);
    localStorage.setItem("timetableTemplates", JSON.stringify(updated));
    setNewTemplateName("");
  };

  const loadTemplate = (name: string) => {
    if (!name || !templates[name]) return;
    const restored = templates[name].map((item, idx) => ({ ...item, id: Date.now() + idx }));
    setTimetable(restored);
    if (restored.length > 0) setHeadlineLessonId(restored[0].lessonId);
  };

  const addSubTask = () => {
    if (!newSubTaskText.trim()) return;
    const updatedTasks = [...(currentProfile.subTasks ?? []), { id: Date.now(), text: newSubTaskText.trim(), done: false }];
    updateProfileField("subTasks", updatedTasks);
    setNewSubTaskText("");
  };

  const generateClassGroups = () => {
    const presentList = students.filter(s => s.present).map(s => s.name);
    if (presentList.length === 0) return;
    for (let i = presentList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [presentList[i], presentList[j]] = [presentList[j], presentList[i]];
    }
    const groupsArray: string[][] = [];
    while (presentList.length > 0) groupsArray.push(presentList.splice(0, groupSize));
    setGeneratedGroups(groupsArray);
  };

  const youtubeEmbedId = useMemo(() => {
    if (!youtubeUrl.trim()) return "";
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = youtubeUrl.match(regExp);
      return (match && match[2].length === 11) ? match[2] : "";
    } catch { return ""; }
  }, [youtubeUrl]);

  const downloadWeeklySummaryReport = () => {
    let summaryText = `======= CLASSROOM WEEKLY COMPILATION SUMMARY PLAN =======\nGenerated: ${new Date().toLocaleDateString()}\n\n`;
    summaryText += `📝 SHARED GENERAL SESSION NOTES:\n${notes || "No general notes captured."}\n\n`;
    summaryText += `${"=".repeat(75)}\n\n`;
    LESSON_TYPES.forEach((lesson) => {
      const profile = subjectProfiles[lesson.id];
      if (profile && (profile.learningObjective?.trim() || profile.subTasks.length > 0 || profile.centralIdea?.trim() || (profile.observations && Object.keys(profile.observations).length > 0))) {
        summaryText += `📚 SUBJECT: ${lesson.label.toUpperCase()}\n${"-".repeat(65)}\n`;
        if (lesson.id === "uoi") {
          summaryText += `❓ GUIDING QUESTION:\n ${profile.learningObjective?.trim() || "None mapped."}\n\n`;
          summaryText += `💡 CENTRAL IDEA:\n ${profile.centralIdea?.trim() || "None mapped."}\n\n`;
          summaryText += `🔍 LOI 1: ${profile.loi1?.trim() || "None"}\n🔍 LOI 2: ${profile.loi2?.trim() || "None"}\n🔍 LOI 3: ${profile.loi3?.trim() || "None"}\n\n`;
        } else {
          summaryText += `🎯 LEARNING OBJECTIVE:\n ${profile.learningObjective?.trim() || "None mapped."}\n\n`;
        }
        if (profile.subTasks.length > 0) {
          summaryText += `📋 STEP TASKS:\n`;
          profile.subTasks.forEach((t, i) => { summaryText += ` [${t.done ? "✓" : " "}] ${i + 1}. ${t.text}\n`; });
          summaryText += '\n';
        }
        if (profile.observations && Object.keys(profile.observations).length > 0) {
          summaryText += `📊 STUDENT OBSERVATIONS:\n`;
          Object.entries(profile.observations).forEach(([name, obs]) => {
            if (obs.status !== "none" || obs.notes.trim() || (obs.anecdotalNotes || []).length > 0) {
              const sym = obs.status === "green" ? "🟢 Mastered" : obs.status === "amber" ? "🟡 Progressing" : obs.status === "red" ? "🔴 Support" : "⚪ Not Tracked";
              summaryText += `  • ${name}: ${sym}\n`;
              if (obs.starMoment) summaryText += `    ⭐ ${obs.starMoment}\n`;
              if ((obs.atlTags || []).length > 0) summaryText += `    ATL: ${obs.atlTags!.join(", ")}\n`;
              if (obs.notes) summaryText += `    Note: ${obs.notes}\n`;
              (obs.anecdotalNotes || []).forEach(n => { summaryText += `    ${n.date}: ${n.text}\n`; });
            }
          });
          summaryText += '\n';
        }
        summaryText += `${"=".repeat(75)}\n\n`;
      }
    });
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `weekly-classroom-plan-summary.txt`; link.click();
    URL.revokeObjectURL(url);
  };

  // Turns whatever's currently in Draft Reports into a formatted Google Doc —
  // one titled section per student, one sub-heading per subject. This is the
  // polished, human-readable deliverable; the Sheets backup above is the
  // separate, invisible safety net that keeps the editable data itself safe.
  const exportAllReportsToDoc = async () => {
    const names = Object.keys(reportData.studentReports);
    if (names.length === 0) {
      setExportDocError("No report drafts found yet — write or generate some drafts first.");
      return;
    }
    setExportingDoc(true);
    setExportDocError("");
    try {
      const docStudents: DocReportStudent[] = names.map(name => {
        const r = reportData.studentReports[name];
        const sections: { label: string; text: string }[] = [];
        const addSection = (label: string, draft: string, achievement: string, growth1: string, growth2: string) => {
          const parts: string[] = [];
          if (achievement) parts.push(`Achievement: ${achievement}`);
          if (draft?.trim()) parts.push(draft.trim());
          const growths = [growth1, growth2].filter(Boolean);
          if (growths.length) parts.push(`Growth areas: ${growths.join("; ")}`);
          sections.push({ label, text: parts.join("\n\n") || "(No content yet)" });
        };
        addSection("Literacy", r.literacy.draft, r.literacy.achievement, r.literacy.growth1, r.literacy.growth2);
        addSection("Maths", r.maths.draft, r.maths.achievement, r.maths.growth1, r.maths.growth2);
        reportData.units.forEach((unit, i) => {
          if (unit.title?.trim() || r.uoi.unitDrafts[i]?.trim()) {
            addSection(`Unit of Inquiry: ${unit.title || `Unit ${i + 1}`}`, r.uoi.unitDrafts[i] || "", i === 0 ? r.uoi.achievement : "", "", "");
          }
        });
        if (r.uoi.growth1 || r.uoi.growth2) {
          sections.push({ label: "UOI Overall Growth Areas", text: [r.uoi.growth1, r.uoi.growth2].filter(Boolean).join("; ") || "(None yet)" });
        }
        addSection("Social Emotional Learning", r.sel.draft, r.sel.achievement, r.sel.growth1, r.sel.growth2);
        return { name, sections };
      });
      const { url: docUrl } = await exportReportsToDoc(docStudents, `Reports — ${new Date().toLocaleDateString()}`);
      window.open(docUrl, "_blank");
    } catch (e) {
      setExportDocError(e instanceof Error ? e.message : "Export failed — check that the Apps Script backend has been redeployed with Docs permission granted.");
    }
    setExportingDoc(false);
  };

  // Same backend action as exportAllReportsToDoc, just pointed at this week's
  // planning content instead of per-student report drafts — one Doc "section"
  // per subject taught this week rather than per student.
  const exportWeeklySummaryToDoc = async () => {
    const subjectsWithContent = LESSON_TYPES.filter(lesson => {
      const profile = subjectProfiles[lesson.id];
      return profile && (
        profile.learningObjective?.trim() || profile.subTasks.length > 0 ||
        profile.centralIdea?.trim() || (profile.observations && Object.keys(profile.observations).length > 0)
      );
    });
    if (subjectsWithContent.length === 0) {
      setExportDocError("No lesson content captured yet this week — nothing to export.");
      return;
    }
    setExportingDoc(true);
    setExportDocError("");
    try {
      const docSubjects: DocReportStudent[] = subjectsWithContent.map(lesson => {
        const profile = subjectProfiles[lesson.id]!;
        const sections: { label: string; text: string }[] = [];
        if (lesson.id === "uoi") {
          sections.push({ label: "Guiding Question", text: profile.learningObjective?.trim() || "None mapped." });
          sections.push({ label: "Central Idea", text: profile.centralIdea?.trim() || "None mapped." });
          sections.push({ label: "Lines of Inquiry", text: [profile.loi1, profile.loi2, profile.loi3].filter(Boolean).join("\n") || "None mapped." });
        } else {
          sections.push({ label: "Learning Objective", text: profile.learningObjective?.trim() || "None mapped." });
        }
        if (profile.subTasks.length > 0) {
          sections.push({ label: "Step Tasks", text: profile.subTasks.map((t, i) => `${i + 1}. ${t.done ? "✓" : "☐"} ${t.text}`).join("\n") });
        }
        if (profile.observations && Object.keys(profile.observations).length > 0) {
          const obsText = Object.entries(profile.observations).map(([name, obs]) => {
            const status = obs.status === "green" ? "Mastered" : obs.status === "amber" ? "Progressing" : obs.status === "red" ? "Needs support" : "Not tracked";
            return `${name}: ${status}${obs.notes ? " — " + obs.notes : ""}`;
          }).join("\n");
          sections.push({ label: "Observations", text: obsText });
        }
        return { name: lesson.label, sections };
      });
      const { url: docUrl } = await exportReportsToDoc(docSubjects, `Weekly Summary — ${new Date().toLocaleDateString()}`);
      window.open(docUrl, "_blank");
    } catch (e) {
      setExportDocError(e instanceof Error ? e.message : "Export failed — check that the Apps Script backend has been redeployed with Docs permission granted.");
    }
    setExportingDoc(false);
  };

  // Reuses the same Gemini key set in Draft Reports (both just read the same
  // localStorage entry) rather than duplicating a whole separate key-management
  // UI here. Grounded in the current Maths/Literacy learning objectives when
  // set, so it's a warm-up connected to what's actually being taught, not a
  // generic worksheet.
  const generateMorningStarter = async () => {
    const key = localStorage.getItem("geminiApiKey");
    if (!key) {
      setStarterError('Add a Gemini API key first — open Draft Reports and set it there, it\'s shared across the whole app.');
      return;
    }
    setGeneratingStarter(true);
    setStarterError("");
    try {
      // A starter is meant to review what was already taught, not preview
      // today's not-yet-happened lesson — so this looks backward through the
      // phone notes for the most recent PRIOR day a subject was taught, using
      // the learningIntention snapshot each note already carries, rather than
      // subjectProfiles' live objective (which reflects today, not yesterday).
      const todayStr = new Date().toISOString().slice(0, 10);
      let mathsObjective = "";
      let literacyObjective = "";
      let mathsDate = "";
      let literacyDate = "";
      if (getApiUrl()) {
        try {
          const allNotes = await fetchNotes();
          const mostRecentPrior = (subjectId: string) => {
            const priorDates = Array.from(new Set(
              allNotes
                .filter(n => n.subject === subjectId && n.date?.slice(0, 10) < todayStr && n.learningIntention?.trim())
                .map(n => n.date!.slice(0, 10))
            )).sort((a, b) => b.localeCompare(a));
            if (priorDates.length === 0) return null;
            const latestDate = priorDates[0];
            const note = allNotes.find(n => n.subject === subjectId && n.date?.slice(0, 10) === latestDate && n.learningIntention?.trim());
            return note ? { text: note.learningIntention!.trim(), date: latestDate } : null;
          };
          const mathsResult = mostRecentPrior("maths");
          const literacyResult = mostRecentPrior("literacy");
          if (mathsResult) { mathsObjective = mathsResult.text; mathsDate = mathsResult.date; }
          if (literacyResult) { literacyObjective = literacyResult.text; literacyDate = literacyResult.date; }
        } catch { /* fall through — prompt below handles missing objectives gracefully */ }
      }
      const prompt = `You are creating a short "morning starter" review activity for a Grade 5 classroom of 10-year-olds, to complete independently as they arrive, before today's lesson begins. This should REVIEW/recall what was already taught previously — not preview today's new content, since today hasn't been taught yet.

${mathsObjective ? `Maths learning objective from the last lesson (${mathsDate}): ${mathsObjective}` : "No prior maths objective found in the logged notes — use general Grade 5 maths review."}
${literacyObjective ? `Literacy learning objective from the last lesson (${literacyDate}): ${literacyObjective}` : "No prior literacy objective found in the logged notes — use an engaging general literacy prompt."}

Write:
1. Exactly 5 short maths practice questions appropriate for Grade 5 that review/recall the objective above, increasing slightly in difficulty. Number them 1 to 5.
2. One literacy warm-up prompt that reviews/recalls the objective above — a short writing or thinking prompt, one or two sentences.

Respond in EXACTLY this format, with no extra commentary before or after:
MATHS:
1. ...
2. ...
3. ...
4. ...
5. ...
LITERACY:
...`;
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || `Request failed (${response.status})`);
      const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
      const mathsMatch = text.match(/MATHS:([\s\S]*?)LITERACY:/i);
      const literacyMatch = text.match(/LITERACY:([\s\S]*)$/i);
      const mathsQuestions = (mathsMatch?.[1] || "")
        .split("\n").map((l: string) => l.replace(/^\s*\d+\.\s*/, "").trim()).filter(Boolean).slice(0, 5);
      const literacyPrompt = (literacyMatch?.[1] || "").trim();
      if (mathsQuestions.length === 0 && !literacyPrompt) {
        throw new Error("Couldn't read a valid starter from the response — try again.");
      }
      setMorningStarter({ date: todayStr, mathsQuestions, literacyPrompt });
    } catch (e) {
      setStarterError(e instanceof Error ? e.message : "Something went wrong generating the starter.");
    }
    setGeneratingStarter(false);
  };

  const showSidebar = timetable.length > 0;
  const weekdayFull = time.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase();
  const monthFull = time.toLocaleDateString(undefined, { month: "long" }).toUpperCase();
  const dayNum = time.getDate(); const yearNum = time.getFullYear();
  const customSpelledDate = `${weekdayFull}, ${monthFull} ${dayNum}, ${yearNum}`;

  const ALL_MATERIALS = [
    { id: "whiteboard", name: "Whiteboard" }, { id: "pen", name: "Pen / Pencil" }, { id: "ipad", name: "iPad" },
    { id: "writing_book", name: "Writing Book" }, { id: "math_notebook", name: "Math Notebook" },
    { id: "reading_book", name: "Reading Book" }, { id: "library_book", name: "Library Book" }, { id: "refill_water", name: "Refill Water" },
  ];

  const MemoizedIframeContainer = useMemo(() => {
    if (!embedHtml.trim()) return null;
    return <div style={{ width: "100%", minHeight: "450px", border: `2px solid ${C.cardBorder}`, borderRadius: "12px", overflow: "hidden", background: C.bg }} dangerouslySetInnerHTML={{ __html: embedHtml }} />;
  }, [embedHtml]);

return (
    /* Merged your outer layout styles with the critical 'alignItems: "flex-start"' property */
    <div style={{ display: "flex", alignItems: "flex-start", width: "100vw", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: font, boxSizing: "border-box", margin: 0, padding: 0, overflowX: "hidden", maxWidth: "100%" }}>
      {/* ── LEFT SIDEBAR ── */}
      {showSidebar && (
        <div style={{ width: "110px", borderRight: `2px solid ${C.cardBorder}`, background: C.card, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", boxSizing: "border-box", overflowY: "auto", height: "100vh", position: "sticky", top: 0, flexShrink: 0 }}>
          {!presentationMode && (confirmClearActive ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", background: "#f8d7da", border: `1px solid ${C.roses}`, padding: "6px", borderRadius: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "bold", textAlign: "center", color: C.roseDark }}>Confirm?</span>
              <button onClick={() => { setTimetable([]); setConfirmClearActive(false); }} style={{ ...btnRose, padding: "4px", fontSize: "11px", borderRadius: "6px" }}>Yes</button>
              <button onClick={() => setConfirmClearActive(false)} style={{ ...btnGhost, padding: "4px", fontSize: "11px", borderRadius: "6px" }}>No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmClearActive(true)} style={{ ...btnGhost, fontSize: "11px", padding: "6px 8px", borderRadius: "10px", width: "100%", whiteSpace: "nowrap" }}>🗑️ Clear All</button>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", alignItems: "center" }}>
            {timetable.map((item) => {
              const lt = LESSON_TYPES.find((l) => l.id === item.lessonId) || LESSON_TYPES[LESSON_TYPES.length - 1];
              const isCurrentHeadline = headlineLessonId === item.lessonId;
              const isHovered = hoveredSidebarId === item.id;
              return (
                <div key={item.id} onMouseEnter={() => setHoveredSidebarId(item.id)} onMouseLeave={() => setHoveredSidebarId(null)} style={{ position: "relative" }}>
                  <button onClick={() => setHeadlineLessonId(item.lessonId)} title={lt.label}
                    style={{ background: isCurrentHeadline ? C.highlight : lt.bg, border: isCurrentHeadline ? "3px solid #000" : `2px solid ${lt.color}`, boxShadow: isCurrentHeadline ? "0 0 12px rgba(0,0,0,0.15)" : "none", borderRadius: "14px", width: "68px", height: "68px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", boxSizing: "border-box", opacity: item.done ? 0.4 : 1, transition: "all 0.15s" }}>
                    <LessonIcon id={lt.id} size={32} />
                  </button>
                  {!presentationMode && isHovered && (
                    <button onClick={(e) => { e.stopPropagation(); setTimetable(timetable.filter(t => t.id !== item.id)); }}
                      style={{ position: "absolute", top: "-6px", right: "-6px", background: C.roses, color: "#fff", border: "1.5px solid #000", borderRadius: "50%", width: "20px", height: "20px", fontSize: "12px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>×</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, padding: "12px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "24px", minWidth: 0, maxWidth: "100%" }}>

        {/* TOOLBAR (teacher-only — hidden in presentation mode) */}
        {!presentationMode && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", background: C.card, padding: "12px 18px", borderRadius: "16px", border: `1.5px solid ${C.cardBorder}`, alignItems: "center", width: "100%", boxSizing: "border-box", position: "relative" }}>
          {WIDGET_GROUPS.map((group) => {
            const isMenuOpen = activeGroupMenu === group.label;
            return (
              <div key={group.label} style={{ position: "relative" }}>
                <button onClick={() => setActiveGroupMenu(isMenuOpen ? null : group.label)}
                  style={{ ...btnGhost, fontSize: "14px", padding: "8px 16px", background: isMenuOpen ? C.highlight : C.bg, border: isMenuOpen ? "1.5px solid #000" : `1.5px solid ${C.cardBorder}`, borderRadius: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{group.emoji}</span>
                  <span style={{ fontWeight: "700" }}>{group.label}</span>
                  <span style={{ fontSize: "10px", opacity: 0.7 }}>{isMenuOpen ? "▲" : "▼"}</span>
                </button>
                {isMenuOpen && (
                  <div style={{ position: "absolute", top: "45px", left: 0, background: "#fff", border: `1.5px solid ${C.cardBorder}`, borderRadius: "12px", padding: "8px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "0 6px 16px rgba(0,0,0,0.1)", zIndex: 99, minWidth: "190px" }}>
                    {group.widgets.map((wKey) => (
                      <div key={wKey} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <button onClick={() => { toggle(wKey); setActiveGroupMenu(null); }}
                          style={{ ...btnBase, padding: "8px 12px", fontSize: "13px", textAlign: "left", width: "100%", background: visible[wKey] ? C.highlight : "none", borderRadius: "8px", color: C.text, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span>{WIDGET_LABELS[wKey].split(" ").slice(1).join(" ")}</span>
                          <span>{visible[wKey] ? "🟢" : "⚪"}</span>
                        </button>
                        {visible[wKey] && wKey !== "timetable" && (
                          <div style={{ display: "flex", gap: "4px", paddingLeft: "12px", paddingBottom: "4px" }}>
                            {["Half", "Full"].map((size) => {
                              const isFull = size === "Full";
                              const isActive = !!widgetSpan[wKey] === isFull;
                              return (
                                <button key={size} onClick={(e) => { e.stopPropagation(); setWidgetSpan(s => ({ ...s, [wKey]: isFull })); }}
                                  style={{ ...btnBase, padding: "2px 10px", fontSize: "11px", borderRadius: "20px", background: isActive ? C.text : C.bg, color: isActive ? "#fff" : C.muted, border: `1px solid ${C.cardBorder}` }}>
                                  {size}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ height: "24px", width: "1.5px", background: C.cardBorder, margin: "0 4px" }} />
          <button onClick={() => { setIsEditingMaterials(!isEditingMaterials); setIsEditingPresets(false); }}
            style={{ ...btnGhost, fontWeight: "700", fontSize: "13px", padding: "8px 14px", borderRadius: "12px", border: isEditingMaterials ? "1.5px solid #000" : "1.5px dashed #000", background: isEditingMaterials ? C.highlight : "none" }}>
            {isEditingMaterials ? "🔒 Lock Materials" : "🛠️ Desk Setup"}
          </button>
          <div style={{ position: "relative", marginLeft: "auto" }}>
            <button onClick={() => setActiveGroupMenu(activeGroupMenu === "Teacher" ? null : "Teacher")}
              style={{ ...btnGhost, fontSize: "13px", fontWeight: "700", padding: "8px 16px", background: activeGroupMenu === "Teacher" ? C.highlight : C.bg, border: activeGroupMenu === "Teacher" ? "1.5px solid #000" : `1.5px solid ${C.cardBorder}`, borderRadius: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>👩‍🏫</span>
              <span>Teacher</span>
              <span style={{ fontSize: "10px", opacity: 0.7 }}>{activeGroupMenu === "Teacher" ? "▲" : "▼"}</span>
            </button>
            {activeGroupMenu === "Teacher" && (
              <div style={{ position: "absolute", top: "45px", right: 0, background: "#fff", border: `1.5px solid ${C.cardBorder}`, borderRadius: "12px", padding: "8px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "0 6px 16px rgba(0,0,0,0.1)", zIndex: 99, minWidth: "190px" }}>
                <button onClick={() => { setShowReportPanel(true); setActiveGroupMenu(null); }}
                  style={{ ...btnBase, padding: "8px 12px", fontSize: "13px", textAlign: "left", width: "100%", background: showReportPanel ? C.highlight : "none", borderRadius: "8px", color: C.text }}>
                  ✏️ Draft Reports
                </button>
                <button onClick={() => { downloadWeeklySummaryReport(); setActiveGroupMenu(null); }}
                  style={{ ...btnBase, padding: "8px 12px", fontSize: "13px", textAlign: "left", width: "100%", background: "none", borderRadius: "8px", color: C.text }}>
                  📥 Export Weekly Summary (.txt)
                </button>
                <button onClick={() => { exportWeeklySummaryToDoc(); setActiveGroupMenu(null); }} disabled={exportingDoc}
                  style={{ ...btnBase, padding: "8px 12px", fontSize: "13px", textAlign: "left", width: "100%", background: "none", borderRadius: "8px", color: C.text }}>
                  {exportingDoc ? "📄 Creating doc..." : "📄 Export Weekly Summary to Doc"}
                </button>
                <button onClick={() => { exportAllReportsToDoc(); setActiveGroupMenu(null); }} disabled={exportingDoc}
                  style={{ ...btnBase, padding: "8px 12px", fontSize: "13px", textAlign: "left", width: "100%", background: "none", borderRadius: "8px", color: C.text }}>
                  {exportingDoc ? "📄 Creating doc..." : "📄 Export Student Reports to Doc"}
                </button>
              </div>
            )}
          </div>
        </div>
        )}

        {exportDocError && !presentationMode && (
          <div style={{ background: "#f6e6e6", border: `1.5px solid ${C.roses}`, borderRadius: "12px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: C.roseDark }}>⚠️ {exportDocError}</span>
            <button onClick={() => setExportDocError("")} style={{ ...btnGhost, fontSize: "11px", padding: "3px 10px", marginLeft: "auto" }}>Dismiss</button>
          </div>
        )}

        {/* MATERIALS PANEL */}
        {!presentationMode && isEditingMaterials && (
          <div style={{ ...cardStyle, background: "#fff", border: "2px dashed #000", padding: "16px", gap: "10px" }}>
            <span style={{ ...labelStyle, fontSize: "11px" }}>Configure Dashboard Active Student Desk Items:</span>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {ALL_MATERIALS.map((m) => {
                const isSelected = !!currentProfile.materials[m.id];
                return (
                  <button key={m.id} onClick={() => updateProfileField("materials", { ...currentProfile.materials, [m.id]: !isSelected })}
                    style={{ ...btnBase, borderRadius: "12px", padding: "8px 14px", fontSize: "13px", background: isSelected ? "#dbe3ed" : C.bg, border: `2.5px solid ${isSelected ? "#000" : C.cardBorder}`, display: "flex", alignItems: "center", gap: "8px" }}>
                    <MaterialIcon id={m.id} size={18} />
                    <span style={{ color: "#000", fontWeight: "700" }}>{isSelected ? `✓ ${m.name}` : m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* THEME PRESETS PANEL */}
        {!presentationMode && isEditingPresets && (
          <div style={{ ...cardStyle, background: "#fff", border: "2px dashed #000", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <span style={{ ...labelStyle, fontSize: "11px" }}>Load or Customize UOI Transdisciplinary Theme Presets:</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", borderBottom: `1.5px solid ${C.cardBorder}`, paddingBottom: "10px" }}>
              {Object.keys(themePresets).map((theme) => (
                <button key={theme} onClick={() => setSelectedPresetToEdit(theme)}
                  style={{ ...btnBase, fontSize: "11px", padding: "6px 12px", borderRadius: "8px", background: selectedPresetToEdit === theme ? C.slate : C.highlight, color: selectedPresetToEdit === theme ? "#fff" : C.text }}>
                  {theme}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: C.bg, padding: "14px", borderRadius: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: C.text }}>💡 Central Idea:</span>
                  <textarea value={themePresets[selectedPresetToEdit].centralIdea} onChange={(e) => updatePresetField(selectedPresetToEdit, "centralIdea", e.target.value)} style={{ ...inputStyle, background: "#fff", height: "60px", fontSize: "13px", resize: "none" }} />
                </div>
                <button onClick={() => applyUoiPreset(selectedPresetToEdit)} style={{ ...btnSage, fontSize: "13px", padding: "8px 16px" }}>🚀 Apply & Load Preset to Board</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: C.text }}>🔍 Lines of Inquiry:</span>
                {[1, 2, 3].map((num) => {
                  const key = `loi${num}` as keyof Presets;
                  return <input key={num} value={themePresets[selectedPresetToEdit][key]} onChange={(e) => updatePresetField(selectedPresetToEdit, key, e.target.value)} placeholder={`Line of Inquiry ${num}`} style={{ ...inputStyle, background: "#fff", fontSize: "13px", padding: "6px 12px" }} />;
                })}
              </div>
            </div>
          </div>
        )}

        {/* HERO WORKSPACE */}
        {timetable.length > 0 && activeHeadlineItem && (() => {
          const isMaths = headlineLessonId === "maths";
          const isUoi = headlineLessonId === "uoi";
          const mathDate = `${time.getDate().toString().padStart(2, '0')}/${(time.getMonth() + 1).toString().padStart(2, '0')}/${time.getFullYear().toString().slice(-2)}`;
          return (
            <>
              <div style={{ ...cardStyle, background: activeHeadlineItem.bg, border: `2.5px solid ${activeHeadlineItem.color}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "20px", borderBottom: `2px solid ${activeHeadlineItem.color}`, paddingBottom: "18px", width: "100%", boxSizing: "border-box" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", justifySelf: "start" }}>
                    <LessonIcon id={activeHeadlineItem.id} size={48} />
                    <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "800", color: "#000", letterSpacing: "-0.5px", textTransform: "uppercase" }}>{activeHeadlineItem.label}</h1>
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                    {ALL_MATERIALS.map((m) => {
                      if (!currentProfile.materials[m.id]) return null;
                      return (
                        <div key={m.id} style={{ borderRadius: "14px", padding: "10px", width: "115px", background: "#fff", border: "2px solid #000", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", boxSizing: "border-box" }}>
                          <MaterialIcon id={m.id} size={28} />
                          <span style={{ fontSize: "12px", color: "#000", fontWeight: "700", textAlign: "center", whiteSpace: "nowrap" }}>{m.name}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ justifySelf: "end" }}>
                    <span style={{ fontFamily: font, fontSize: "24px", fontWeight: "700", color: C.text, whiteSpace: "nowrap" }}>{isMaths ? mathDate : customSpelledDate}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                  {isUoi && <span style={{ ...labelStyle, fontSize: "11px", color: "#000" }}>🎯 Guiding Question:</span>}
                  <textarea
                    value={currentProfile.learningObjective}
                    onChange={(e) => updateProfileField("learningObjective", e.target.value)}
                    readOnly={presentationMode}
                    style={{
                      ...inputStyle,
                      background: presentationMode ? "transparent" : "#fff",
                      border: presentationMode ? "none" : "2.5px solid #000",
                      padding: presentationMode ? "6px 2px" : "14px 18px",
                      color: "#000", fontWeight: "800",
                      fontSize: presentationMode ? "28px" : "20px",
                      height: presentationMode ? "auto" : "85px",
                      resize: "none",
                      cursor: presentationMode ? "default" : "text",
                    }}
                  />
                </div>
                {isUoi && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "4px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <span style={{ ...labelStyle, fontSize: "11px", color: "#000" }}>💡 Central Idea:</span>
                        {!presentationMode && (
                          <button onClick={() => { setIsEditingPresets(!isEditingPresets); setIsEditingMaterials(false); }}
                            style={{ ...btnGhost, fontWeight: "700", fontSize: "11px", padding: "4px 10px", borderRadius: "10px", border: isEditingPresets ? "1.5px solid #000" : "1.5px dashed #000", background: isEditingPresets ? C.highlight : "none" }}>
                            🌍 Theme Presets
                          </button>
                        )}
                      </div>
                      <textarea
                        value={currentProfile.centralIdea || ""}
                        onChange={(e) => updateProfileField("centralIdea", e.target.value)}
                        readOnly={presentationMode}
                        style={{
                          ...inputStyle,
                          background: presentationMode ? "transparent" : "#fff",
                          border: presentationMode ? "none" : "2.5px solid #000",
                          padding: presentationMode ? "4px 2px" : "14px 18px",
                          color: "#000", fontWeight: "700",
                          fontSize: presentationMode ? "22px" : "18px",
                          height: presentationMode ? "auto" : "65px",
                          resize: "none",
                          cursor: presentationMode ? "default" : "text",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ ...labelStyle, fontSize: "11px", color: "#000" }}>🔍 Lines of Inquiry:</span>
                      {[1, 2, 3].map((num) => {
                        const loiKey = `loi${num}` as keyof SubjectProfile;
                        const isHighlighted = currentProfile.activeLoiHighlight === num;
                        return (
                          <div key={num} onClick={() => updateProfileField("activeLoiHighlight", isHighlighted ? 0 : num)}
                            style={{ display: "flex", alignItems: "center", gap: "14px", background: isHighlighted ? `${activeHeadlineItem.color}15` : "#fff", padding: "14px 18px", borderRadius: "14px", border: isHighlighted ? `3px solid ${activeHeadlineItem.color}` : `1.5px solid ${C.cardBorder}`, cursor: "pointer", width: "100%", boxSizing: "border-box", transition: "all 0.15s ease-in-out" }}>
                            <span style={{ fontWeight: "900", fontSize: "15px", color: activeHeadlineItem.color, whiteSpace: "nowrap" }}>LOI {num}:</span>
                            <input value={(currentProfile[loiKey] as string) || ""} onChange={(e) => { e.stopPropagation(); updateProfileField(loiKey, e.target.value); }} onClick={(e) => e.stopPropagation()}
                              readOnly={presentationMode}
                              style={{ background: "none", border: "none", outline: "none", width: "100%", fontSize: presentationMode ? "19px" : "16px", fontWeight: isHighlighted ? "800" : "700", color: "#000", fontFamily: font, cursor: presentationMode ? "default" : "text" }} />
                            {isHighlighted && <span style={{ fontSize: "18px", flexShrink: 0 }}>🎯</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* PACING STEPS */}
        {visible.taskBreakdown && (
          <div style={{ ...cardStyle, border: timetable.length > 0 && activeHeadlineItem ? `2.5px solid ${activeHeadlineItem.color}` : `1.5px solid ${C.cardBorder}`, background: "#fff" }}>
            {!presentationMode && <button style={closeBtn} onClick={() => toggle("taskBreakdown")}>×</button>}
            {!presentationMode && (
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <input style={inputStyle} type="text" value={newSubTaskText} onChange={(e) => setNewSubTaskText(e.target.value)} placeholder="Enter a new step..." onKeyDown={(e) => e.key === 'Enter' && addSubTask()} />
                <button onClick={addSubTask} style={btnSage}>Add Step</button>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
              {(currentProfile?.subTasks?.length ?? 0) > 0 ? currentProfile.subTasks.map((task) => {
                const isTaskFocused = currentProfile.activeTaskId === task.id;
                const activeAccent = activeHeadlineItem?.color || C.slate;
                return (
                  <div key={task.id} onClick={() => updateProfileField("activeTaskId", isTaskFocused ? null : task.id)}
                    style={{ display: "flex", alignItems: "center", gap: "14px", background: task.done ? C.highlight : isTaskFocused ? activeAccent : C.bg, padding: isTaskFocused ? "16px 20px" : "10px 16px", borderRadius: "12px", opacity: task.done ? 0.5 : 1, border: isTaskFocused ? "2.5px solid #000" : `1px solid ${C.cardBorder}`, cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                    <input type="checkbox" checked={task.done} onClick={(e) => e.stopPropagation()} onChange={() => updateProfileField("subTasks", currentProfile.subTasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t))} style={{ width: "20px", height: "20px", cursor: "pointer" }} />
                    <span style={{ fontSize: isTaskFocused ? "19px" : "16px", fontWeight: "700", color: isTaskFocused && !task.done ? "#fff" : "#000", textDecoration: task.done ? "line-through" : "none", flex: 1, transition: "font-size 0.2s" }}>{task.text}</span>
                    {isTaskFocused && !task.done && <span style={{ fontSize: "14px", color: "#fff", background: "rgba(0,0,0,0.2)", padding: "4px 8px", borderRadius: "6px", fontWeight: "bold" }}>CURRENT STEP 🎯</span>}
                    {!presentationMode && <button onClick={(e) => { e.stopPropagation(); updateProfileField("subTasks", currentProfile.subTasks.filter(t => t.id !== task.id)); }} style={{ background: "none", border: "none", color: isTaskFocused ? "#fff" : C.muted, cursor: "pointer", fontSize: "16px" }}>×</button>}
                  </div>
                );
              }) : <span style={{ color: C.muted, fontSize: "13px", fontStyle: "italic" }}>No visual steps added.</span>}
            </div>
          </div>
        )}

        {/* ── LOWER GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", width: "100%", boxSizing: "border-box" }}>

          {/* REPORT DRAFTING PANEL */}
          {!presentationMode && showReportPanel && students.length > 0 && (
            <ReportDraftingPanel
              students={students}
              setStudents={setStudents}
              subjectProfiles={subjectProfiles}
              reportData={reportData}
              setReportData={setReportData}
              themePresets={themePresets}
              onClose={() => setShowReportPanel(false)}
            />
          )}
          {!presentationMode && showReportPanel && students.length === 0 && (
            <div style={{ ...cardStyle, gridColumn: "span 2", background: "#fff", border: "2px dashed #000" }}>
              <button style={closeBtn} onClick={() => setShowReportPanel(false)}>×</button>
              <p style={{ color: C.muted, fontStyle: "italic", fontSize: "14px", margin: "24px 0 0" }}>
                No students in roster. Open <b>👥 Roster & Groups</b> and add students first.
              </p>
            </div>
          )}

          {/* EMBEDDER */}
          {visible.embedder && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.embedder ? "span 2" : "span 1", background: "#fff", border: "2px solid #000" }}>
              {!presentationMode && <button style={closeBtn} onClick={() => toggle("embedder")}>×</button>}
              {!presentationMode && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "12px" }}>
                  <button onClick={() => setIsEmbedInputCollapsed(!isEmbedInputCollapsed)} style={{ ...btnGhost, fontSize: "11px", padding: "4px 12px" }}>{isEmbedInputCollapsed ? "⚙️ Show Code Box" : "Hide Input Code Box"}</button>
                </div>
              )}
              {!presentationMode && !isEmbedInputCollapsed && <textarea defaultValue={embedHtml} onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => setEmbedHtml(e.target.value)} placeholder="Paste iframe embed code..." style={{ ...inputStyle, height: "70px", fontFamily: "monospace", fontSize: "13px" }} />}
              {MemoizedIframeContainer}
            </div>
          )}

          {/* YOUTUBE */}
          {visible.youtubeWidget && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.youtubeWidget ? "span 2" : "span 1", background: "#fff", border: "2px solid #000" }}>
              {!presentationMode && <button style={closeBtn} onClick={() => toggle("youtubeWidget")}>×</button>}
              {!presentationMode && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "12px" }}>
                  <button onClick={() => setIsYoutubeInputCollapsed(!isYoutubeInputCollapsed)} style={{ ...btnGhost, fontSize: "11px", padding: "4px 12px" }}>{isYoutubeInputCollapsed ? "⚙️ Show URL Input" : "Hide Link Input Box"}</button>
                </div>
              )}
              {!presentationMode && !isYoutubeInputCollapsed && <input type="text" defaultValue={youtubeUrl} onBlur={(e: React.FocusEvent<HTMLInputElement>) => setYoutubeUrl(e.target.value)} placeholder="Paste YouTube URL..." style={inputStyle} />}
              {youtubeEmbedId ? (
                <div style={{ width: "100%", position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "12px", background: "#000", border: `2px solid ${C.cardBorder}` }}>
                  <iframe style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} src={`https://www.youtube.com/embed/${youtubeEmbedId}`} title="YouTube player" allowFullScreen />
                </div>
              ) : youtubeUrl.trim() && <span style={{ color: C.roseDark, fontSize: "13px", fontStyle: "italic" }}>Invalid YouTube link.</span>}
            </div>
          )}

          {/* LESSON SET-UP (always full width — has enough content that half-width cramped it) */}
          {visible.timetable && (
            <div style={{ ...cardStyle, gridColumn: "span 2" }}>
              {!presentationMode && <button style={closeBtn} onClick={() => toggle("timetable")}>×</button>}
              <div style={{ background: C.highlight, padding: "12px", borderRadius: "14px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginTop: "12px" }}>
                <select onChange={(e: React.ChangeEvent<HTMLSelectElement>) => loadTemplate(e.target.value)} defaultValue="" style={{ ...inputStyle, width: "auto", flex: 1, padding: "6px 10px", fontSize: "14px" }}>
                  <option value="" disabled>-- Load Saved Template --</option>
                  {Object.keys(templates).map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <div style={{ display: "flex", gap: "6px", flex: "1 1 180px" }}>
                  <input value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="Name Plan..." style={{ ...inputStyle, padding: "6px 10px", fontSize: "13px" }} />
                  <button style={{ ...btnSage, padding: "6px 12px", fontSize: "12px", borderRadius: "10px" }} onClick={saveCurrentAsTemplate}>Save</button>
                </div>
              </div>
              <div style={{ borderTop: `1.5px solid ${C.cardBorder}`, paddingTop: "12px", marginTop: "4px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                  {LESSON_TYPES.map((lt) => (
                    <button key={lt.id} onClick={() => { const newItem = { id: Date.now(), lessonId: lt.id, time: "", done: false, note: "" }; setTimetable([...timetable, newItem]); setHeadlineLessonId(lt.id); }}
                      style={{ ...btnBase, padding: "10px 6px", fontSize: "12px", borderRadius: "10px", background: lt.bg, color: C.text, border: `1.5px solid ${lt.color}`, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {lt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MORNING STARTER — content stays visible in presentation mode (it's for
              the kids), only the Generate button (a creation/editing action) hides. */}
          {visible.morningStarter && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.morningStarter ? "span 2" : "span 1" }}>
              {!presentationMode && <button style={closeBtn} onClick={() => toggle("morningStarter")}>×</button>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "800" }}>🌅 Morning Starter</h2>
                {!presentationMode && (
                  <button onClick={generateMorningStarter} disabled={generatingStarter} style={{ ...btnSage, fontSize: "12px", padding: "7px 16px" }}>
                    {generatingStarter ? "✨ Generating..." : morningStarter?.date === new Date().toISOString().slice(0, 10) ? "✨ Regenerate" : "✨ Generate Today's Starter"}
                  </button>
                )}
              </div>
              {!presentationMode && starterError && (
                <div style={{ background: "#f6e6e6", border: `1.5px solid ${C.roses}`, borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: C.roseDark, marginBottom: "12px" }}>
                  ⚠️ {starterError}
                </div>
              )}
              {morningStarter && morningStarter.date === new Date().toISOString().slice(0, 10) ? (
                <div style={{ display: "grid", gridTemplateColumns: morningStarter.mathsQuestions.length && morningStarter.literacyPrompt ? "1.3fr 1fr" : "1fr", gap: "24px" }}>
                  {morningStarter.mathsQuestions.length > 0 && (
                    <div>
                      <div style={{ fontWeight: "800", fontSize: "17px", marginBottom: "10px", color: C.slateDark }}>🔢 Maths Warm-Up</div>
                      <ol style={{ margin: 0, paddingLeft: "22px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {morningStarter.mathsQuestions.map((q, i) => (
                          <li key={i} style={{ fontSize: "17px", fontWeight: "600", color: C.text }}>{q}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {morningStarter.literacyPrompt && (
                    <div>
                      <div style={{ fontWeight: "800", fontSize: "17px", marginBottom: "10px", color: C.sageDark }}>📝 Literacy Prompt</div>
                      <div style={{ fontSize: "17px", fontWeight: "600", fontStyle: "italic", color: C.text, lineHeight: 1.6 }}>{morningStarter.literacyPrompt}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: C.muted, fontSize: "14px", textAlign: "center", padding: "24px 0" }}>
                  {presentationMode ? "No starter generated yet for today." : "Click \"Generate Today's Starter\" to create today's warm-up."}
                </div>
              )}
            </div>
          )}

          {/* CLOCK */}
          {visible.clock && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.clock ? "span 2" : "span 1" }}>
              {!presentationMode && <button style={closeBtn} onClick={() => toggle("clock")}>×</button>}
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "220px" }}>
                <div style={{ fontSize: "74px", fontWeight: "800", letterSpacing: "-2px", color: C.text }}>{time.toLocaleTimeString()}</div>
              </div>
            </div>
          )}

          {/* TIMER */}
          {visible.timer && (
            <div
              onClick={() => timerJustFinished && setTimerJustFinished(false)}
              style={{
                ...cardStyle,
                gridColumn: widgetSpan.timer ? "span 2" : "span 1",
                ...(timerJustFinished ? {
                  background: C.roses,
                  border: "2.5px solid #000",
                  animation: "timerFlash 0.7s ease-in-out infinite",
                  cursor: "pointer",
                } : {}),
              }}
            >
              {!presentationMode && <button style={closeBtn} onClick={() => toggle("timer")}>×</button>}
              {timerJustFinished && (
                <div style={{ textAlign: "center", fontSize: "22px", fontWeight: "900", color: "#000", letterSpacing: "1px", marginBottom: "8px" }}>
                  ⏰ TIME'S UP! <span style={{ fontSize: "13px", fontWeight: "700", opacity: 0.7 }}>(tap to dismiss)</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "28px", flexWrap: "wrap-reverse" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: "10px", minWidth: "150px" }}>
                  <input type="number" value={minutes} min={1} onChange={(e) => { const v = Math.max(1, Number(e.target.value)); setMinutes(v); if (!running) setSeconds(v * 60); }} style={{ ...inputStyle, fontSize: "16px", fontWeight: "bold", textAlign: "center" }} />
                  <button style={btnSage} onClick={(e) => { e.stopPropagation(); setRunning(true); setTimerJustFinished(false); }} disabled={running}>▶ START</button>
                  <button style={btnRose} onClick={(e) => { e.stopPropagation(); setRunning(false); }}>⏸ STOP</button>
                  <button style={btnGhost} onClick={(e) => { e.stopPropagation(); setRunning(false); setSeconds(minutes * 60); setTimerJustFinished(false); }}>↺ RESET</button>
                </div>
                <CircleTimer pct={seconds / (minutes * 60 || 1)} minutes={minutes} seconds={seconds} />
              </div>
            </div>
          )}

          {/* STOPWATCH */}
          {visible.stopwatch && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.stopwatch ? "span 2" : "span 1" }}>
              {!presentationMode && <button style={closeBtn} onClick={() => toggle("stopwatch")}>×</button>}
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "180px" }}>
                <div style={{ fontSize: "68px", fontWeight: "800", color: swRunning ? C.sageDark : C.text }}>{swFormatted}</div>
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <button style={btnSage} onClick={() => setSwRunning(true)} disabled={swRunning}>▶ START</button>
                <button style={btnRose} onClick={() => setSwRunning(false)}>⏸ STOP</button>
                <button style={btnGhost} onClick={() => { setSwRunning(false); setSwMs(0); }}>↺ RESET</button>
              </div>
            </div>
          )}

          {/* WORK MODES */}
          {visible.workSymbols && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.workSymbols ? "span 2" : "span 1" }}>
              {!presentationMode && <button style={closeBtn} onClick={() => toggle("workSymbols")}>×</button>}
              <div style={{ background: workMode.color, borderRadius: "14px", padding: "32px 24px", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", marginTop: "12px" }}>
                <div style={{ fontWeight: "900", fontSize: "36px", color: "#fff", letterSpacing: "2px", textTransform: "uppercase" }}>{workMode.label}</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px", justifyContent: "center" }}>
                {WORK_MODES.map((m) => (
                  <button key={m.id} onClick={() => setWorkMode(m)} style={{ ...btnBase, background: workMode.id === m.id ? m.color : C.highlight, color: workMode.id === m.id ? "#fff" : C.text, padding: "8px 14px", fontSize: "13px", border: `2px solid ${m.color}` }}>{m.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* DICE */}
          {visible.dice && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.dice ? "span 2" : "span 1" }}>
              {!presentationMode && <button style={closeBtn} onClick={() => toggle("dice")}>×</button>}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "180px" }}>
                <div style={{ transition: rolling ? "transform 0.08s" : "none", transform: rolling ? `rotate(${Math.random() * 20 - 10}deg)` : "none" }}>
                  <DiceFace value={diceValue} />
                </div>
              </div>
              <button style={{ ...btnLavender, alignSelf: "center" }} onClick={rollDice} disabled={rolling}>DICE ROLL</button>
            </div>
          )}

          {/* NOTES */}
          {visible.notes && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.notes ? "span 2" : "span 1" }}>
              {!presentationMode && <button style={closeBtn} onClick={() => toggle("notes")}>×</button>}
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Type shared lesson summary notes here…" style={{ ...inputStyle, flex: 1, minHeight: "220px", resize: "none", marginTop: "12px" }} />
            </div>
          )}

          {/* ROSTER */}
          {visible.roster && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.roster ? "span 2" : "span 1" }}>
              {!presentationMode && <button style={closeBtn} onClick={() => toggle("roster")}>×</button>}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Name…"
                  onKeyDown={(e) => { if (e.key === "Enter" && studentName.trim()) { e.preventDefault(); setStudents([...students, { name: studentName.trim(), present: true, pronoun: "they" }]); setStudentName(""); } }}
                  style={inputStyle} />
                <button style={btnSlate} onClick={() => { if (studentName.trim()) { setStudents([...students, { name: studentName.trim(), present: true, pronoun: "they" }]); setStudentName(""); } }}>+</button>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button style={{ ...btnGhost, fontSize: "11px", padding: "6px 10px", flex: 1, border: "1px dashed #000" }} onClick={() => { if (students.length === 0) return alert("List is empty!"); const textData = students.map(s => s.name).join("\n"); const blob = new Blob([textData], { type: "text/plain" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "class-list.txt"; link.click(); URL.revokeObjectURL(url); }}>💾 Save File</button>
                <label style={{ ...btnGhost, fontSize: "11px", padding: "6px 10px", flex: 1, border: "1px dashed #000", textAlign: "center", cursor: "pointer" }}>📂 Load File
                  <input type="file" accept=".txt" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (evt) => { const text = evt.target?.result as string; if (text) { const names = text.split("\n").map(n => n.trim()).filter(n => n.length > 0); if (names.length > 0) setStudents(names.map(name => ({ name, present: true, pronoun: "they" as const }))); } }; reader.readAsText(file); }} />
                </label>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "220px", overflowY: "auto", borderTop: `1px solid ${C.cardBorder}`, paddingTop: "8px", marginTop: "8px" }}>
                {students.map((s, i) => (
                  <div key={i} style={{ background: s.present ? C.highlight : "#f5c6c6", border: s.present ? `1px solid ${C.cardBorder}` : `1px solid ${C.roses}`, padding: "4px 8px", borderRadius: "8px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px", opacity: s.present ? 1 : 0.6 }}>
                    <input type="checkbox" checked={s.present} onChange={() => setStudents(students.map((st, idx) => idx === i ? { ...st, present: !st.present } : st))} style={{ cursor: "pointer" }} />
                    <span style={{ fontWeight: "700", textDecoration: s.present ? "none" : "line-through" }}>{s.name}</span>
                    {/* Pronoun selector */}
                    <select value={s.pronoun || "they"} onChange={(e) => setStudents(students.map((st, idx) => idx === i ? { ...st, pronoun: e.target.value as any } : st))}
                      style={{ fontSize: "10px", background: "none", border: `1px solid ${C.cardBorder}`, borderRadius: "4px", padding: "1px 2px", fontFamily: font, color: C.muted, cursor: "pointer" }}>
                      <option value="he">he</option>
                      <option value="she">she</option>
                      <option value="they">they</option>
                    </select>
                    <button onClick={() => setStudents(students.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUPS (random picker + team generator — split out from Roster since these
              are classroom-engagement tools, not roster administration) */}
          {visible.groups && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.groups ? "span 2" : "span 1" }}>
              {!presentationMode && <button style={closeBtn} onClick={() => toggle("groups")}>×</button>}
              <div style={{ background: C.highlight, padding: "12px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "bold" }}>Group Size:</span>
                  <input type="number" min={2} max={10} value={groupSize} onChange={(e) => setGroupSize(Math.max(2, Number(e.target.value)))} style={{ ...inputStyle, width: "65px", padding: "4px 8px" }} />
                  <button onClick={generateClassGroups} style={{ ...btnSage, padding: "6px 14px", fontSize: "12px", borderRadius: "8px", flex: 1 }}>👥 Generate Groups</button>
                </div>
                {generatedGroups.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto", background: "#fff", padding: "10px", borderRadius: "8px", border: `1.5px solid ${C.cardBorder}` }}>
                    {generatedGroups.map((grp, gIdx) => (
                      <div key={gIdx} style={{ fontSize: "13px", fontWeight: "700", color: "#000", borderBottom: "1px solid #f2ede4", paddingBottom: "4px" }}>
                        Team {gIdx + 1}: <span style={{ fontWeight: "normal", color: C.text }}>{grp.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button style={{ ...btnAmber, alignSelf: "stretch", marginTop: "10px" }} onClick={() => { const presentOnes = students.filter(s => s.present); if (presentOnes.length > 0) setChosenStudent(presentOnes[Math.floor(Math.random() * presentOnes.length)].name); }}>🎲 PICK RANDOM PRESENT STUDENT</button>
              {chosenStudent && <div style={{ background: "#dce8f5", padding: "12px", borderRadius: "10px", fontWeight: "800", fontSize: "18px", textAlign: "center", marginTop: "10px" }}>⭐ {chosenStudent}</div>}
            </div>
          )}

          {/* SCOREBOARD */}
          {visible.scoreboard && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.scoreboard ? "span 2" : "span 1" }}>
              {!presentationMode && <button style={closeBtn} onClick={() => toggle("scoreboard")}>×</button>}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1, alignItems: "center", marginTop: "12px" }}>
                {teams.map((team) => (
                  <div key={team.id} style={{ flex: "1 1 100px", background: C.bg, border: `2px solid ${team.color}`, borderRadius: "14px", padding: "10px", textAlign: "center" }}>
                    <input value={team.name} onChange={(e) => setTeams(teams.map(t => t.id === team.id ? { ...t, name: e.target.value } : t))} style={{ fontWeight: "700", color: team.color, fontSize: "14px", background: "none", border: "none", textAlign: "center", width: "100%", outline: "none", fontFamily: font }} />
                    <div style={{ fontSize: "36px", fontWeight: "800", margin: "4px 0" }}>{team.score}</div>
                    <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                      <button onClick={() => setTeams(teams.map(t => t.id === team.id ? { ...t, score: t.score + 1 } : t))} style={{ ...btnBase, padding: "4px 10px" }}>+</button>
                      <button onClick={() => setTeams(teams.map(t => t.id === team.id ? { ...t, score: Math.max(0, t.score - 1) } : t))} style={{ ...btnGhost, padding: "4px 10px" }}>-</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                <input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="New team name…"
                  onKeyDown={(e) => { if (e.key === "Enter" && newTeamName.trim()) { e.preventDefault(); setTeams([...teams, { id: Date.now(), name: newTeamName.trim(), score: 0, color: TEAM_COLORS[teams.length % TEAM_COLORS.length] }]); setNewTeamName(""); } }}
                  style={{ ...inputStyle, padding: "6px 10px" }} />
                <button style={btnLavender} onClick={() => { if (newTeamName.trim()) { setTeams([...teams, { id: Date.now(), name: newTeamName.trim(), score: 0, color: TEAM_COLORS[teams.length % TEAM_COLORS.length] }]); setNewTeamName(""); } }}>+</button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* PRESENTATION MODE TOGGLE — always available, kept deliberately small and
          low-contrast so it doesn't compete for a student's attention, but never hidden. */}
      <button
        onClick={() => setPresentationMode((p) => !p)}
        title={presentationMode ? "Exit presentation mode" : "Enter presentation mode (hides all editing controls)"}
        style={{
          position: "fixed",
          bottom: "14px",
          right: "14px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: presentationMode ? "8px 10px" : "9px 16px",
          borderRadius: "999px",
          border: `1.5px solid ${presentationMode ? "rgba(0,0,0,0.15)" : C.cardBorder}`,
          background: presentationMode ? "rgba(255,255,255,0.55)" : C.card,
          color: presentationMode ? "rgba(44,40,37,0.55)" : C.text,
          fontFamily: font,
          fontWeight: 700,
          fontSize: "12px",
          cursor: "pointer",
          boxShadow: presentationMode ? "none" : "0 2px 8px rgba(0,0,0,0.08)",
          opacity: presentationMode ? 0.55 : 1,
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = presentationMode ? "0.55" : "1"; }}
      >
        {presentationMode ? "🚪 Exit Presentation" : "🖥️ Presentation Mode"}
      </button>
    </div>
  );
}
