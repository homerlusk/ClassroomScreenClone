import React, { useEffect, useState, useRef, useMemo } from "react";

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

const font = "'Century Gothic', 'Trebuchet MS', Arial, sans-serif";
const TEAM_COLORS = [C.sage, C.slate, C.roses, C.amber, C.lavender];

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

const WIDGETS = [
  "timetable", "taskBreakdown", "progressTracker", "clock", "timer", "stopwatch",
  "notes", "classList", "scoreboard", "dice", "workSymbols", "embedder", "youtubeWidget"
] as const;
type Widget = typeof WIDGETS[number];

const WIDGET_LABELS: Record<Widget, string> = {
  timetable: "📅 Timetable Setup", taskBreakdown: "📋 Task Steps",
  progressTracker: "📊 Progress Tracker", clock: "🕒 Clock", timer: "⏲ Timer",
  stopwatch: "⏱ Stopwatch", notes: "📝 Notes", classList: "👥 Roster & Groups",
  scoreboard: "🏆 Scores", dice: "🎲 Dice", workSymbols: "🔇 Work Mode",
  embedder: "🔗 Web Embed Link", youtubeWidget: "📺 YouTube Video"
};

const WIDGET_GROUPS: { label: string; emoji: string; widgets: Widget[] }[] = [
  { label: "Timers", emoji: "⏱️", widgets: ["clock", "timer", "stopwatch"] },
  { label: "Class Tools", emoji: "👥", widgets: ["workSymbols", "dice", "classList", "scoreboard"] },
  { label: "Lesson", emoji: "📚", widgets: ["timetable", "taskBreakdown", "progressTracker", "notes"] },
  { label: "Content", emoji: "🖥️", widgets: ["embedder", "youtubeWidget"] },
];

const PALETTES = {
  specialists: { color: "#2e4361", bg: "#dbe3ed" },
  breaks: { color: "#2d543d", bg: "#e2f0e6" },
  others: { color: "#1a4d6e", bg: "#e1f1fc" }
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

function LessonIcon({ id, size = 32 }: { id: string; size?: number }) {
  const style = { fontSize: `${size}px`, lineHeight: 1, display: "inline-block" };
  switch (id) {
    case "art": return <span style={style}>🎨</span>;
    case "pe": return <span style={style}>🏃‍♂️</span>;
    case "music": return <span style={style}>🎵</span>;
    case "drama": return <span style={style}>🎭</span>;
    case "languages": return <span style={style}>🗣️</span>;
    case "italian": return <span style={style}>🇮🇹</span>;
    case "recess": return <span style={style}>🍎</span>;
    case "lunch": return <span style={style}>🥪</span>;
    case "maths": return <span style={style}>🔢</span>;
    case "spelling": return <span style={style}>🔤</span>;
    case "literacy": return <span style={style}>📚</span>;
    case "story": return <span style={style}>📖</span>;
    case "pyp": return <span style={style}>💡</span>;
    case "library": return <span style={style}>🏫</span>;
    case "uoi": return <span style={style}>🔍</span>;
    case "brain": return <span style={style}>🧠</span>;
    case "assembly": return <span style={style}>👥</span>;
    case "event": return <span style={style}>🎟️</span>;
    default: return <span style={style}>📌</span>;
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
  const fillColor = pct > 0.5 ? C.sage : pct > 0.2 ? C.amber : C.roses;
  const timeLabel = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "340px" }}>
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

// ── ENHANCED PROGRESS TRACKER ──
function ProgressTrackerWidget({
  toggle, headlineLessonId, subjectProfiles, setSubjectProfiles, students
}: {
  toggle: (key: Widget) => void;
  headlineLessonId: string;
  subjectProfiles: Record<string, SubjectProfile>;
  setSubjectProfiles: React.Dispatch<React.SetStateAction<Record<string, SubjectProfile>>>;
  students: Student[];
}) {
  const [localLessonId, setLocalLessonId] = useState<string>("");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState<string>("");

  const resolvedLessonId = localLessonId || headlineLessonId;
  const resolvedLesson = LESSON_TYPES.find(l => l.id === resolvedLessonId);
  const resolvedProfile: SubjectProfile = subjectProfiles[resolvedLessonId] || {
    materials: {}, learningObjective: "", centralIdea: "", loi1: "", loi2: "", loi3: "",
    activeLoiHighlight: 0, atls: "", subTasks: [], observations: {}, activeTaskId: null
  };

  const updateObs = (name: string, updates: Partial<StudentObservation>) => {
    const current = resolvedProfile.observations?.[name] || { status: "none", notes: "" };
    const updatedObs = { ...(resolvedProfile.observations || {}), [name]: { ...current, ...updates } };
    setSubjectProfiles(prev => ({
      ...prev,
      [resolvedLessonId]: { ...((prev[resolvedLessonId] || resolvedProfile) as SubjectProfile), observations: updatedObs }
    }));
  };

  const addAnecdotalNote = (studentName: string) => {
    if (!newNoteText.trim()) return;
    const obs = resolvedProfile.observations?.[studentName] || { status: "none", notes: "" };
    const existing = obs.anecdotalNotes || [];
    const newNote: AnecdotalNote = { date: new Date().toLocaleDateString(), text: newNoteText.trim() };
    updateObs(studentName, { anecdotalNotes: [...existing, newNote] });
    setNewNoteText("");
  };

  const toggleATL = (studentName: string, skill: ATLSkill) => {
    const obs = resolvedProfile.observations?.[studentName] || { status: "none", notes: "" };
    const current = obs.atlTags || [];
    const updated = current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill];
    updateObs(studentName, { atlTags: updated });
  };

  return (
    <div style={cardStyle}>
      <button onClick={() => toggle("progressTracker")} style={closeBtn}>×</button>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px" }}>
        <span style={labelStyle}>📊 Tracking:</span>
        <select value={resolvedLessonId} onChange={(e) => setLocalLessonId(e.target.value)} style={{ ...inputStyle, width: "auto", flex: 1 }}>
          <option value="" disabled>-- Select a subject --</option>
          {LESSON_TYPES.map(lt => <option key={lt.id} value={lt.id}>{lt.label}</option>)}
        </select>
        {resolvedLesson && <LessonIcon id={resolvedLesson.id} size={24} />}
      </div>

      {students.length === 0 ? (
        <p style={{ color: C.muted, fontStyle: "italic", fontSize: "14px", margin: 0 }}>
          No students in roster. Open <b>👥 Roster & Groups</b> and add students first.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "500px", overflowY: "auto", paddingRight: "4px" }}>
          {students.map((student) => {
            const obs = resolvedProfile.observations?.[student.name] || { status: "none", notes: "" };
            const statusColor = obs.status === "green" ? C.sage : obs.status === "amber" ? C.amber : obs.status === "red" ? C.roses : C.cardBorder;
            const isExpanded = expandedStudent === student.name;
            return (
              <div key={student.name} style={{ background: C.bg, borderRadius: "10px", border: `2px solid ${statusColor}`, overflow: "hidden" }}>
                {/* Main row */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px" }}>
                  <span style={{ fontWeight: "600", fontSize: "14px", color: student.present ? C.text : C.muted, minWidth: "90px" }}>
                    {student.name}{!student.present && <span style={{ color: C.roses }}> (Abs)</span>}
                  </span>
                  <input type="text" placeholder="Quick note..." value={obs.notes}
                    style={{ ...inputStyle, flex: 1, padding: "4px 8px", fontSize: "13px" }}
                    onChange={(e) => updateObs(student.name, { notes: e.target.value })}
                  />
                  <select value={obs.status}
                    style={{ ...inputStyle, width: "120px", padding: "4px 6px", fontSize: "12px" }}
                    onChange={(e) => updateObs(student.name, { status: e.target.value as any })}
                  >
                    <option value="none">⚪ Not set</option>
                    <option value="green">🟢 Mastered</option>
                    <option value="amber">🟡 Progressing</option>
                    <option value="red">🔴 Support</option>
                    <option value="absent">❌ Absent</option>
                  </select>
                  <button onClick={() => setExpandedStudent(isExpanded ? null : student.name)}
                    style={{ ...btnGhost, padding: "4px 10px", fontSize: "11px", borderRadius: "8px", whiteSpace: "nowrap" }}>
                    {isExpanded ? "▲ Less" : "▼ More"}
                  </button>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div style={{ padding: "12px", borderTop: `1.5px solid ${C.cardBorder}`, display: "flex", flexDirection: "column", gap: "10px", background: "#fff" }}>
                    {/* Star moment */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ ...labelStyle, fontSize: "10px" }}>⭐ Star Moment</span>
                      <input type="text" placeholder="A standout achievement this term..."
                        value={obs.starMoment || ""}
                        style={{ ...inputStyle, fontSize: "13px", padding: "6px 10px" }}
                        onChange={(e) => updateObs(student.name, { starMoment: e.target.value })}
                      />
                    </div>

                    {/* ATL tags */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ ...labelStyle, fontSize: "10px" }}>ATL Skills Observed</span>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {ATL_SKILLS.map(skill => {
                          const active = (obs.atlTags || []).includes(skill);
                          return (
                            <button key={skill} onClick={() => toggleATL(student.name, skill)}
                              style={{ ...btnBase, padding: "3px 10px", fontSize: "11px", borderRadius: "20px",
                                background: active ? C.slate : C.bg, color: active ? "#fff" : C.muted,
                                border: `1px solid ${active ? C.slate : C.cardBorder}` }}>
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Anecdotal notes */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ ...labelStyle, fontSize: "10px" }}>📋 Anecdotal Notes Log</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input type="text" placeholder="Add dated observation..."
                          value={newNoteText}
                          style={{ ...inputStyle, flex: 1, fontSize: "13px", padding: "6px 10px" }}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addAnecdotalNote(student.name)}
                        />
                        <button onClick={() => addAnecdotalNote(student.name)} style={{ ...btnSage, padding: "6px 12px", fontSize: "12px", borderRadius: "10px" }}>+ Add</button>
                      </div>
                      {(obs.anecdotalNotes || []).length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "100px", overflowY: "auto" }}>
                          {(obs.anecdotalNotes || []).map((note, i) => (
                            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "12px", padding: "4px 6px", background: C.highlight, borderRadius: "6px" }}>
                              <span style={{ color: C.muted, whiteSpace: "nowrap", fontWeight: "700" }}>{note.date}</span>
                              <span style={{ color: C.text, flex: 1 }}>{note.text}</span>
                              <button onClick={() => updateObs(student.name, { anecdotalNotes: (obs.anecdotalNotes || []).filter((_, idx) => idx !== i) })}
                                style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "12px" }}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── REPORT DRAFTING PANEL ──
function ReportDraftingPanel({
  students, subjectProfiles, reportData, setReportData, onClose
}: {
  students: Student[];
  subjectProfiles: Record<string, SubjectProfile>;
  reportData: ReportData;
  setReportData: React.Dispatch<React.SetStateAction<ReportData>>;
  onClose: () => void;
}) {
  const [selectedStudent, setSelectedStudent] = useState<string>(students[0]?.name || "");
  const [generating, setGenerating] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<"literacy" | "maths" | "uoi" | "sel">("literacy");

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

  const updateReport = (section: string, field: string, value: string, unitIdx?: number) => {
    const current = getStudentReport();
    setReportData(prev => ({
      ...prev,
      studentReports: {
        ...prev.studentReports,
        [selectedStudent]: {
          ...current,
          [section]: section === "uoi" && field === "unitDraft" && unitIdx !== undefined
            ? { ...current.uoi, unitDrafts: current.uoi.unitDrafts.map((d, i) => i === unitIdx ? value : d) }
            : { ...(current as any)[section], [field]: value }
        }
      }
    }));
  };

  const buildObsSummary = (subjectId: string) => {
    const profile = subjectProfiles[subjectId];
    if (!profile?.observations?.[selectedStudent]) return "No observations recorded.";
    const obs = profile.observations[selectedStudent];
    const status = obs.status === "green" ? "Mastered" : obs.status === "amber" ? "Progressing" : obs.status === "red" ? "Needs support" : "Not tracked";
    const atls = (obs.atlTags || []).join(", ") || "None recorded";
    const star = obs.starMoment || "";
    const notes = [obs.notes, ...(obs.anecdotalNotes || []).map(n => `${n.date}: ${n.text}`)].filter(Boolean).join(" | ");
    return `Status: ${status}. ATL skills: ${atls}. ${star ? `Star moment: ${star}.` : ""} Notes: ${notes || "None."}`;
  };

  const generateDraft = async (section: "literacy" | "maths" | "sel", unitIdx?: number) => {
    const key = unitIdx !== undefined ? `uoi_${unitIdx}` : section;
    setGenerating(g => ({ ...g, [key]: true }));

    let prompt = "";
    const name = selectedStudent;

    if (section === "literacy") {
      const obs = buildObsSummary("literacy");
      const spellingObs = buildObsSummary("spelling");
      prompt = `You are writing a Grade 5 IB PYP end-of-term Literacy report comment for a 10-year-old student named ${name}. Use ${pronoun}/${possessive} pronouns. 

Teacher observations: ${obs}
Spelling observations: ${spellingObs}

Write approximately 150 words in warm, professional PYP report language. Cover reading, writing, and oral communication skills. Be specific and evidence-based. Do not use generic filler. Do not include growth areas in this section — those are separate. Write in third person. Start with the student's name.`;
    } else if (section === "maths") {
      const obs = buildObsSummary("maths");
      prompt = `You are writing a Grade 5 IB PYP end-of-term Mathematics report comment for a 10-year-old student named ${name}. Use ${pronoun}/${possessive} pronouns.

Teacher observations: ${obs}

Write approximately 150 words in warm, professional PYP report language. Reference conceptual understanding, skills application, and mathematical thinking. Be specific. Do not include growth areas. Write in third person. Start with the student's name.`;
    } else if (section === "sel") {
      const allObs = ["literacy", "maths", "uoi"].map(id => buildObsSummary(id)).join(" | ");
      prompt = `You are writing a Grade 5 IB PYP end-of-term Social Emotional Learning report comment for a 10-year-old student named ${name}. Use ${pronoun}/${possessive} pronouns.

This section is based on ATL (Approaches to Learning) skills and classroom interactions.
Cross-subject observations: ${allObs}

Write approximately 150 words covering how the student manages ${possessive} learning, collaborates with peers, communicates, and contributes to the classroom community. Use warm, professional PYP language. Do not include growth areas. Write in third person. Start with the student's name.`;
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      const text = data.content?.map((c: any) => c.text || "").join("") || "";
      if (unitIdx !== undefined) {
        updateReport("uoi", "unitDraft", text.trim(), unitIdx);
      } else {
        updateReport(section, "draft", text.trim());
      }
    } catch (e) {
      console.error("API error", e);
    }
    setGenerating(g => ({ ...g, [key]: false }));
  };

  const generateUoiDraft = async (unitIdx: number) => {
    const key = `uoi_${unitIdx}`;
    setGenerating(g => ({ ...g, [key]: true }));
    const unit = reportData.units[unitIdx];
    const obs = buildObsSummary("uoi");
    const name = selectedStudent;
    const prompt = `You are writing a Grade 5 IB PYP end-of-term Unit of Inquiry report comment for a 10-year-old student named ${name}. Use ${pronoun}/${possessive} pronouns.

Unit title: ${unit?.title || "Unit " + (unitIdx + 1)}
Central idea: ${unit?.centralIdea || "Not specified"}
Lines of inquiry: ${[unit?.loi1, unit?.loi2, unit?.loi3].filter(Boolean).join("; ") || "Not specified"}

Teacher observations: ${obs}

Write approximately 150 words in warm, professional PYP language. Reference the central idea and lines of inquiry. Be specific about what the student understood, inquired into, and demonstrated. Do not include growth areas. Write in third person. Start with the student's name.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      const text = data.content?.map((c: any) => c.text || "").join("") || "";
      updateReport("uoi", "unitDraft", text.trim(), unitIdx);
    } catch (e) {
      console.error("API error", e);
    }
    setGenerating(g => ({ ...g, [key]: false }));
  };

  const report = getStudentReport();
  const ACHIEVEMENTS = ["EE", "ME", "AE", "NS"];
  const TABS = [
    { key: "literacy" as const, label: "📚 Literacy" },
    { key: "maths" as const, label: "🔢 Maths" },
    { key: "uoi" as const, label: "🔍 UOI" },
    { key: "sel" as const, label: "🤝 SEL" },
  ];

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
              // This would need to update students array — handled via parent
            }}
              style={{ ...btnBase, padding: "3px 10px", fontSize: "11px", borderRadius: "20px",
                background: pronoun === p ? C.text : C.bg, color: pronoun === p ? "#fff" : C.muted,
                border: `1px solid ${C.cardBorder}` }}>
              {p}
            </button>
          ))}
          <span style={{ fontSize: "11px", color: C.muted, marginLeft: "4px" }}>(set in Roster)</span>
        </div>
        <button onClick={exportStudentReport} style={{ ...btnSage, fontSize: "12px", padding: "6px 14px", marginLeft: "auto" }}>
          📥 Export {selectedStudent}'s Report
        </button>
      </div>

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
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ ...labelStyle, fontSize: "10px" }}>Achievement:</span>
            {ACHIEVEMENTS.map(a => (
              <button key={a} onClick={() => updateReport("literacy", "achievement", a)}
                style={{ ...btnBase, padding: "4px 12px", fontSize: "12px", borderRadius: "8px",
                  background: report.literacy.achievement === a ? C.slate : C.bg,
                  color: report.literacy.achievement === a ? "#fff" : C.text,
                  border: `1px solid ${C.cardBorder}` }}>{a}</button>
            ))}
            <button onClick={() => generateDraft("literacy")} disabled={generating.literacy}
              style={{ ...btnSage, padding: "6px 16px", fontSize: "13px", marginLeft: "auto" }}>
              {generating.literacy ? "✨ Generating..." : "✨ Generate Draft"}
            </button>
          </div>
          <textarea value={report.literacy.draft} onChange={e => updateReport("literacy", "draft", e.target.value)}
            placeholder="Click 'Generate Draft' or type directly..."
            style={{ ...inputStyle, minHeight: "160px", resize: "vertical", fontSize: "14px", lineHeight: 1.7 }} />
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
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ ...labelStyle, fontSize: "10px" }}>Achievement:</span>
            {ACHIEVEMENTS.map(a => (
              <button key={a} onClick={() => updateReport("maths", "achievement", a)}
                style={{ ...btnBase, padding: "4px 12px", fontSize: "12px", borderRadius: "8px",
                  background: report.maths.achievement === a ? C.slate : C.bg,
                  color: report.maths.achievement === a ? "#fff" : C.text,
                  border: `1px solid ${C.cardBorder}` }}>{a}</button>
            ))}
            <button onClick={() => generateDraft("maths")} disabled={generating.maths}
              style={{ ...btnSage, padding: "6px 16px", fontSize: "13px", marginLeft: "auto" }}>
              {generating.maths ? "✨ Generating..." : "✨ Generate Draft"}
            </button>
          </div>
          <textarea value={report.maths.draft} onChange={e => updateReport("maths", "draft", e.target.value)}
            placeholder="Click 'Generate Draft' or type directly..."
            style={{ ...inputStyle, minHeight: "160px", resize: "vertical", fontSize: "14px", lineHeight: 1.7 }} />
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
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ ...labelStyle, fontSize: "10px" }}>Overall Achievement:</span>
            {ACHIEVEMENTS.map(a => (
              <button key={a} onClick={() => updateReport("uoi", "achievement", a)}
                style={{ ...btnBase, padding: "4px 12px", fontSize: "12px", borderRadius: "8px",
                  background: report.uoi.achievement === a ? C.slate : C.bg,
                  color: report.uoi.achievement === a ? "#fff" : C.text,
                  border: `1px solid ${C.cardBorder}` }}>{a}</button>
            ))}
          </div>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", background: C.highlight, borderRadius: "12px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ fontWeight: "700", fontSize: "13px", color: C.text }}>Unit {i + 1}:</span>
                <input value={reportData.units[i]?.title || ""} onChange={e => {
                  const updated = [...reportData.units];
                  updated[i] = { ...updated[i], title: e.target.value };
                  setReportData(prev => ({ ...prev, units: updated }));
                }} placeholder="Unit title..." style={{ ...inputStyle, flex: 1, fontSize: "13px", padding: "4px 10px" }} />
                <button onClick={() => generateUoiDraft(i)} disabled={generating[`uoi_${i}`]}
                  style={{ ...btnSage, padding: "6px 14px", fontSize: "12px", whiteSpace: "nowrap" }}>
                  {generating[`uoi_${i}`] ? "✨ Generating..." : "✨ Generate"}
                </button>
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
              <textarea value={report.uoi.unitDrafts[i] || ""} onChange={e => updateReport("uoi", "unitDraft", e.target.value, i)}
                placeholder="Generate or type draft for this unit..."
                style={{ ...inputStyle, minHeight: "120px", resize: "vertical", fontSize: "13px", lineHeight: 1.7 }} />
            </div>
          ))}
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
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ ...labelStyle, fontSize: "10px" }}>Achievement:</span>
            {ACHIEVEMENTS.map(a => (
              <button key={a} onClick={() => updateReport("sel", "achievement", a)}
                style={{ ...btnBase, padding: "4px 12px", fontSize: "12px", borderRadius: "8px",
                  background: report.sel.achievement === a ? C.slate : C.bg,
                  color: report.sel.achievement === a ? "#fff" : C.text,
                  border: `1px solid ${C.cardBorder}` }}>{a}</button>
            ))}
            <button onClick={() => generateDraft("sel")} disabled={generating.sel}
              style={{ ...btnSage, padding: "6px 16px", fontSize: "13px", marginLeft: "auto" }}>
              {generating.sel ? "✨ Generating..." : "✨ Generate Draft"}
            </button>
          </div>
          <textarea value={report.sel.draft} onChange={e => updateReport("sel", "draft", e.target.value)}
            placeholder="Click 'Generate Draft' or type directly. Based on ATL skills and classroom interactions."
            style={{ ...inputStyle, minHeight: "160px", resize: "vertical", fontSize: "14px", lineHeight: 1.7 }} />
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
  const [swRunning, setSwRunning] = useState<boolean>(false);
  const [swMs, setSwMs] = useState<number>(0);
  const swRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
    embedder: true, youtubeWidget: true, notes: false, progressTracker: true, taskBreakdown: true,
  });
  const [reportData, setReportData] = useState<ReportData>(() => {
    try { return JSON.parse(localStorage.getItem("reportData") || "null") || { units: [{title:"",centralIdea:"",loi1:"",loi2:"",loi3:""},{title:"",centralIdea:"",loi1:"",loi2:"",loi3:""},{title:"",centralIdea:"",loi1:"",loi2:"",loi3:""}], studentReports: {} }; }
    catch { return { units: [{title:"",centralIdea:"",loi1:"",loi2:"",loi3:""},{title:"",centralIdea:"",loi1:"",loi2:"",loi3:""},{title:"",centralIdea:"",loi1:"",loi2:"",loi3:""}], studentReports: {} }; }
  });
  const [showReportPanel, setShowReportPanel] = useState<boolean>(false);
  const [teams, setTeams] = useState<ScoreTeam[]>([{ id: 1, name: "Team A", score: 0, color: C.sage }, { id: 2, name: "Team B", score: 0, color: C.slate }]);
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
  const [visible, setVisible] = useState<Record<Widget, boolean>>({
    timetable: true, taskBreakdown: false, progressTracker: false, clock: false, timer: false,
    stopwatch: false, notes: false, classList: false, scoreboard: false, dice: false,
    workSymbols: false, embedder: false, youtubeWidget: false
  });

  const toggle = (key: Widget) => setVisible((v) => ({ ...v, [key]: !v[key] }));

  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds(s => { if (s <= 1) { clearInterval(id); setRunning(false); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (swRunning) { swRef.current = setInterval(() => setSwMs((m) => m + 100), 100); }
    else { if (swRef.current) clearInterval(swRef.current); }
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

  const currentProfile: SubjectProfile = subjectProfiles[headlineLessonId] || {
    materials: {}, learningObjective: headlineLessonId === "uoi" ? "" : "🎯 We are learning to... ",
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
    <div style={{ display: "flex", width: "100vw", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: font, boxSizing: "border-box", margin: 0, padding: 0, overflowX: "hidden", maxWidth: "100%" }}>

      {/* ── LEFT SIDEBAR ── */}
      {showSidebar && (
        <div style={{ width: "110px", borderRight: `2px solid ${C.cardBorder}`, background: C.card, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", boxSizing: "border-box", overflowY: "auto", height: "100vh", position: "sticky", top: 0, flexShrink: 0 }}>
          {confirmClearActive ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", background: "#f8d7da", border: `1px solid ${C.roses}`, padding: "6px", borderRadius: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "bold", textAlign: "center", color: C.roseDark }}>Confirm?</span>
              <button onClick={() => { setTimetable([]); setConfirmClearActive(false); }} style={{ ...btnRose, padding: "4px", fontSize: "11px", borderRadius: "6px" }}>Yes</button>
              <button onClick={() => setConfirmClearActive(false)} style={{ ...btnGhost, padding: "4px", fontSize: "11px", borderRadius: "6px" }}>No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmClearActive(true)} style={{ ...btnGhost, fontSize: "11px", padding: "6px 8px", borderRadius: "10px", width: "100%", whiteSpace: "nowrap" }}>🗑️ Clear All</button>
          )}
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
                  {isHovered && (
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

        {/* TOOLBAR */}
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
                        {visible[wKey] && (
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
          <button onClick={() => { setIsEditingPresets(!isEditingPresets); setIsEditingMaterials(false); }}
            style={{ ...btnGhost, fontWeight: "700", fontSize: "13px", padding: "8px 14px", borderRadius: "12px", border: isEditingPresets ? "1.5px solid #000" : "1.5px dashed #000", background: isEditingPresets ? C.highlight : "none" }}>
            🌍 Theme Presets
          </button>
          <button onClick={() => setShowReportPanel(!showReportPanel)}
            style={{ ...btnGhost, fontWeight: "700", fontSize: "13px", padding: "8px 14px", borderRadius: "12px", border: showReportPanel ? "1.5px solid #000" : "1.5px dashed #000", background: showReportPanel ? C.highlight : "none" }}>
            ✏️ Draft Reports
          </button>
          <button onClick={downloadWeeklySummaryReport} style={{ ...btnSage, fontSize: "13px", padding: "8px 16px", marginLeft: "auto", background: "#4e7a60" }}>
            📥 Export Summary
          </button>
        </div>

        {/* MATERIALS PANEL */}
        {isEditingMaterials && (
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
        {isEditingPresets && (
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
                  <textarea value={currentProfile.learningObjective} onChange={(e) => updateProfileField("learningObjective", e.target.value)} style={{ ...inputStyle, background: "#fff", border: "2.5px solid #000", padding: "14px 18px", color: "#000", fontSize: "20px", fontWeight: "700", height: "85px", resize: "none" }} />
                </div>
                {isUoi && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "4px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ ...labelStyle, fontSize: "11px", color: "#000" }}>💡 Central Idea:</span>
                      <textarea value={currentProfile.centralIdea || ""} onChange={(e) => updateProfileField("centralIdea", e.target.value)} style={{ ...inputStyle, background: "#fff", border: "2.5px solid #000", padding: "14px 18px", color: "#000", fontSize: "18px", fontWeight: "700", height: "65px", resize: "none" }} />
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
                              style={{ background: "none", border: "none", outline: "none", width: "100%", fontSize: "16px", fontWeight: isHighlighted ? "800" : "700", color: "#000", fontFamily: font }} />
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
            <button style={closeBtn} onClick={() => toggle("taskBreakdown")}>×</button>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <input style={inputStyle} type="text" value={newSubTaskText} onChange={(e) => setNewSubTaskText(e.target.value)} placeholder="Enter a new step..." onKeyDown={(e) => e.key === 'Enter' && addSubTask()} />
              <button onClick={addSubTask} style={btnSage}>Add Step</button>
            </div>
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
                    <button onClick={(e) => { e.stopPropagation(); updateProfileField("subTasks", currentProfile.subTasks.filter(t => t.id !== task.id)); }} style={{ background: "none", border: "none", color: isTaskFocused ? "#fff" : C.muted, cursor: "pointer", fontSize: "16px" }}>×</button>
                  </div>
                );
              }) : <span style={{ color: C.muted, fontSize: "13px", fontStyle: "italic" }}>No visual steps added.</span>}
            </div>
          </div>
        )}

        {/* ── LOWER GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", width: "100%", boxSizing: "border-box" }}>

          {/* REPORT DRAFTING PANEL */}
          {showReportPanel && students.length > 0 && (
            <ReportDraftingPanel
              students={students}
              subjectProfiles={subjectProfiles}
              reportData={reportData}
              setReportData={setReportData}
              onClose={() => setShowReportPanel(false)}
            />
          )}
          {showReportPanel && students.length === 0 && (
            <div style={{ ...cardStyle, gridColumn: "span 2", background: "#fff", border: "2px dashed #000" }}>
              <button style={closeBtn} onClick={() => setShowReportPanel(false)}>×</button>
              <p style={{ color: C.muted, fontStyle: "italic", fontSize: "14px", margin: "24px 0 0" }}>
                No students in roster. Open <b>👥 Roster & Groups</b> and add students first.
              </p>
            </div>
          )}

          {/* PROGRESS TRACKER */}
          {visible.progressTracker && (
            <div style={{ gridColumn: widgetSpan.progressTracker ? "span 2" : "span 1" }}>
              <ProgressTrackerWidget students={students} subjectProfiles={subjectProfiles} setSubjectProfiles={setSubjectProfiles} headlineLessonId={headlineLessonId} toggle={toggle} />
            </div>
          )}

          {/* EMBEDDER */}
          {visible.embedder && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.embedder ? "span 2" : "span 1", background: "#fff", border: "2px solid #000" }}>
              <button style={closeBtn} onClick={() => toggle("embedder")}>×</button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "12px" }}>
                <button onClick={() => setIsEmbedInputCollapsed(!isEmbedInputCollapsed)} style={{ ...btnGhost, fontSize: "11px", padding: "4px 12px" }}>{isEmbedInputCollapsed ? "⚙️ Show Code Box" : "Hide Input Code Box"}</button>
              </div>
              {!isEmbedInputCollapsed && <textarea defaultValue={embedHtml} onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => setEmbedHtml(e.target.value)} placeholder="Paste iframe embed code..." style={{ ...inputStyle, height: "70px", fontFamily: "monospace", fontSize: "13px" }} />}
              {MemoizedIframeContainer}
            </div>
          )}

          {/* YOUTUBE */}
          {visible.youtubeWidget && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.youtubeWidget ? "span 2" : "span 1", background: "#fff", border: "2px solid #000" }}>
              <button style={closeBtn} onClick={() => toggle("youtubeWidget")}>×</button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "12px" }}>
                <button onClick={() => setIsYoutubeInputCollapsed(!isYoutubeInputCollapsed)} style={{ ...btnGhost, fontSize: "11px", padding: "4px 12px" }}>{isYoutubeInputCollapsed ? "⚙️ Show URL Input" : "Hide Link Input Box"}</button>
              </div>
              {!isYoutubeInputCollapsed && <input type="text" defaultValue={youtubeUrl} onBlur={(e: React.FocusEvent<HTMLInputElement>) => setYoutubeUrl(e.target.value)} placeholder="Paste YouTube URL..." style={inputStyle} />}
              {youtubeEmbedId ? (
                <div style={{ width: "100%", position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "12px", background: "#000", border: `2px solid ${C.cardBorder}` }}>
                  <iframe style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} src={`https://www.youtube.com/embed/${youtubeEmbedId}`} title="YouTube player" allowFullScreen />
                </div>
              ) : youtubeUrl.trim() && <span style={{ color: C.roseDark, fontSize: "13px", fontStyle: "italic" }}>Invalid YouTube link.</span>}
            </div>
          )}

          {/* TIMETABLE SETUP */}
          {visible.timetable && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.timetable ? "span 2" : "span 1" }}>
              <button style={closeBtn} onClick={() => toggle("timetable")}>×</button>
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

          {/* CLOCK */}
          {visible.clock && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.clock ? "span 2" : "span 1" }}>
              <button style={closeBtn} onClick={() => toggle("clock")}>×</button>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "220px" }}>
                <div style={{ fontSize: "74px", fontWeight: "800", letterSpacing: "-2px", color: C.text }}>{time.toLocaleTimeString()}</div>
              </div>
            </div>
          )}

          {/* TIMER */}
          {visible.timer && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.timer ? "span 2" : "span 1" }}>
              <button style={closeBtn} onClick={() => toggle("timer")}>×</button>
              <CircleTimer pct={seconds / (minutes * 60 || 1)} minutes={minutes} seconds={seconds} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", borderTop: `1px solid ${C.cardBorder}`, paddingTop: "14px" }}>
                <input type="number" value={minutes} min={1} onChange={(e) => { const v = Math.max(1, Number(e.target.value)); setMinutes(v); if (!running) setSeconds(v * 60); }} style={{ ...inputStyle, width: "85px", fontSize: "16px", fontWeight: "bold", textAlign: "center" }} />
                <button style={btnSage} onClick={() => setRunning(true)} disabled={running}>▶ START</button>
                <button style={btnRose} onClick={() => setRunning(false)}>⏸ STOP</button>
                <button style={btnGhost} onClick={() => { setRunning(false); setSeconds(minutes * 60); }}>↺ RESET</button>
              </div>
            </div>
          )}

          {/* STOPWATCH */}
          {visible.stopwatch && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.stopwatch ? "span 2" : "span 1" }}>
              <button style={closeBtn} onClick={() => toggle("stopwatch")}>×</button>
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
              <button style={closeBtn} onClick={() => toggle("workSymbols")}>×</button>
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
              <button style={closeBtn} onClick={() => toggle("dice")}>×</button>
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
              <button style={closeBtn} onClick={() => toggle("notes")}>×</button>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Type shared lesson summary notes here…" style={{ ...inputStyle, flex: 1, minHeight: "220px", resize: "none", marginTop: "12px" }} />
            </div>
          )}

          {/* CLASS ROSTER */}
          {visible.classList && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.classList ? "span 2" : "span 1" }}>
              <button style={closeBtn} onClick={() => toggle("classList")}>×</button>
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
              <div style={{ background: C.highlight, padding: "12px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
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
              <button style={{ ...btnAmber, alignSelf: "stretch" }} onClick={() => { const presentOnes = students.filter(s => s.present); if (presentOnes.length > 0) setChosenStudent(presentOnes[Math.floor(Math.random() * presentOnes.length)].name); }}>🎲 PICK RANDOM PRESENT STUDENT</button>
              {chosenStudent && <div style={{ background: "#dce8f5", padding: "12px", borderRadius: "10px", fontWeight: "800", fontSize: "18px", textAlign: "center" }}>⭐ {chosenStudent}</div>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "160px", overflowY: "auto", borderTop: `1px solid ${C.cardBorder}`, paddingTop: "8px" }}>
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

          {/* SCOREBOARD */}
          {visible.scoreboard && (
            <div style={{ ...cardStyle, gridColumn: widgetSpan.scoreboard ? "span 2" : "span 1" }}>
              <button style={closeBtn} onClick={() => toggle("scoreboard")}>×</button>
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
    </div>
  );
}