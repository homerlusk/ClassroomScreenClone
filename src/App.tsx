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

const cardStyle: React.CSSProperties = {
  background: C.card,
  borderRadius: "18px",
  padding: "24px",
  border: `1.5px solid ${C.cardBorder}`,
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  position: "relative",
  width: "100%",
  boxSizing: "border-box",
};

const btnBase: React.CSSProperties = {
  border: "none",
  borderRadius: "50px",
  padding: "11px 22px",
  fontWeight: "700",
  fontSize: "15px",
  cursor: "pointer",
  fontFamily: font,
  letterSpacing: "0.3px",
  lineHeight: 1.3,
};

const btnSage: React.CSSProperties = { ...btnBase, background: C.sage, color: "#fff" };
const btnRose: React.CSSProperties = { ...btnBase, background: C.roses, color: "#fff" };
const btnSlate: React.CSSProperties = { ...btnBase, background: C.slate, color: "#fff" };
const btnAmber: React.CSSProperties = { ...btnBase, background: C.amber, color: "#fff" };
const btnLavender: React.CSSProperties = { ...btnBase, background: C.lavender, color: "#fff" };
const btnGhost: React.CSSProperties = {
  ...btnBase,
  background: C.highlight,
  color: C.text,
  border: `1.5px solid ${C.cardBorder}`,
};

const inputStyle: React.CSSProperties = {
  background: C.bg,
  border: `1.5px solid ${C.cardBorder}`,
  borderRadius: "12px",
  padding: "10px 14px",
  color: C.text,
  fontSize: "15px",
  fontFamily: font,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  lineHeight: 1.6,
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "1.8px",
  textTransform: "uppercase",
  color: C.muted,
};

const closeBtn: React.CSSProperties = {
  position: "absolute",
  top: "12px",
  right: "14px",
  background: "none",
  border: "none",
  fontSize: "20px",
  color: C.muted,
  cursor: "pointer",
  lineHeight: 1,
  fontFamily: font,
  zIndex: 10,
};

const WIDGETS = [
  "timetable", "taskBreakdown", "progressTracker", "clock", "timer", "stopwatch", "notes",
  "classList", "scoreboard", "dice", "workSymbols", "embedder", "youtubeWidget"
] as const;
type Widget = typeof WIDGETS[number];

const WIDGET_LABELS: Record<Widget, string> = {
  timetable: "📅 Timetable Setup",
  taskBreakdown: "📋 Task Steps",
  progressTracker: "📊 Progress Tracker",
  clock: "🕒 Clock",
  timer: "⏲ Timer",
  stopwatch: "⏱ Stopwatch",
  notes: "📝 Notes",
  classList: "👥 Roster & Groups",
  scoreboard: "🏆 Scores",
  dice: "🎲 Dice",
  workSymbols: "🔇 Work Mode",
  embedder: "🔗 Web Embed Link",
  youtubeWidget: "📺 YouTube Video"
};

const WIDGET_GROUPS: { label: string; emoji: string; widgets: Widget[] }[] = [
  { label: "Timers", emoji: "⏱️", widgets: ["clock", "timer", "stopwatch"] },
  { label: "Class Tools", emoji: "👥", widgets: [ "workSymbols", "dice", "classList", "scoreboard"] },
  { label: "Lesson", emoji: "📚", widgets: ["timetable", "taskBreakdown", "progressTracker", "notes"] },
  { label: "Content", emoji: "🖥️", widgets: ["embedder", "youtubeWidget"] },
];

const PALETTES = {
  specialists: { color: "#2e4361", bg: "#dbe3ed" }, 
  breaks: { color: "#2d543d", bg: "#e2f0e6" },      
  others: { color: "#1a4d6e", bg: "#e1f1fc" }       
};

interface Presets {
  centralIdea: string;
  loi1: string;
  loi2: string;
  loi3: string;
}

const DEFAULT_THEME_PRESETS: Record<string, Presets> = {
  "Who we are": { centralIdea: "Human body systems are interconnected and impact health.", loi1: "Systems function", loi2: "Interconnectedness", loi3: "Health choices" },
  "Where we are in place and time": { centralIdea: "Human migration is a response to challenges.", loi1: "Changes over time", loi2: "Impacts", loi3: "Reasons why people move" },
  "How we express ourselves": { centralIdea: "Creativity offers pathways to uncover identity.", loi1: "Design spaces", loi2: "History inside profiles", loi3: "Expressions" },
  "How the world works": { centralIdea: "Scientific principles drive technological progress.", loi1: "Forces", loi2: "Discovery methods", loi3: "Modern applications" },
  "How we organize ourselves": { centralIdea: "Interconnected networks support societal progress.", loi1: "Organizations", loi2: "Communication/Transport", loi3: "Responsibilities" },
  "Sharing the planet": { centralIdea: "Biodiversity depends on sustainable choices.", loi1: "Ecosystem balance", loi2: "Resource impacts", loi3: "Environmental actions" }
};

interface TimetableItem { id: number; lessonId: string; time: string; done: boolean; note: string; }
interface ScoreTeam { id: number; name: string; score: number; color: string; }
interface SubTask { id: number; text: string; done: boolean; }
interface Student { name: string; present: boolean; }
interface StudentObservation { status: "green" | "amber" | "red" | "none" | "absent"; notes: string; }

interface SubjectProfile {
  materials: Record<string, boolean>;
  learningObjective: string;
  centralIdea?: string;
  loi1?: string;
  loi2?: string;
  loi3?: string;
  activeLoiHighlight?: number;
  atls: string;
  subTasks: SubTask[];
  observations?: Record<string, StudentObservation>;
  activeTaskId?: number | null;
}

interface LessonType { id: string; label: string; color: string; bg: string; }

const LESSON_TYPES: LessonType[] = [
  { id: "art", label: "Art", ...PALETTES.specialists },
  { id: "pe", label: "PE", ...PALETTES.specialists },
  { id: "music", label: "Music", ...PALETTES.specialists },
  { id: "drama", label: "Performing Arts",...PALETTES.specialists },
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
  { id: "uoi", label: "Unit of Inquiry",...PALETTES.others },
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
        {pct > 0.001 && (
          pct >= 0.999
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
      {DICE_DOTS[value]?.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={8} fill={C.text} />
      ))}
    </svg>
  );
}

const DICE_DOTS: Record<number, [number, number][]> = { 1: [[50, 50]], 2: [[25, 25], [75, 75]], 3: [[25, 25], [50, 50], [75, 75]], 4: [[25, 25], [75, 25], [25, 75], [75, 75]], 5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]], 6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]] };
const WORK_MODES = [ { id: "silent", icon: "🔇", label: "Silent Work", color: C.roses, bg: "#f5c6c6" }, { id: "whisper", icon: "🤫", label: "Whisper Only", color: C.amber, bg: "#fff3cd" }, { id: "partner", icon: "🗣️", label: "Partner Talk", color: C.sage, bg: "#c8e6c9" }, { id: "group", icon: "👥", label: "Group Work", color: C.slate, bg: "#dce8f5" }, { id: "free", icon: "🎉", label: "Free Time", color: C.lavender, bg: "#ede8f5" } ];
;

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
    try {
      const stored = localStorage.getItem("classListObjects");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
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
    try {
      const saved = localStorage.getItem("uoiThemePresetsRegistry");
      return saved ? JSON.parse(saved) : DEFAULT_THEME_PRESETS;
    } catch { return DEFAULT_THEME_PRESETS; }
  });
  const [teams, setTeams] = useState<ScoreTeam[]>([ { id: 1, name: "Team A", score: 0, color: C.sage }, { id: 2, name: "Team B", score: 0, color: C.slate } ]);
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
    timetable: true, taskBreakdown: false, progressTracker: false, clock: false, timer: false, stopwatch: false, notes: false, classList: false, scoreboard: false, dice: false, workSymbols: false, embedder: false, youtubeWidget: false
  });

  const playTimerChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
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
  
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);

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

  const currentProfile: SubjectProfile = subjectProfiles[headlineLessonId] || {
  materials: {},
  learningObjective: headlineLessonId === "uoi"
    ? ""
    : "🎯 We are learning to... ",
  centralIdea: "",
  loi1: "",
  loi2: "",
  loi3: "",
  activeLoiHighlight: 0,
  atls: "",
  subTasks: [],
  observations: {},
  activeTaskId: null,
};
console.log("Current profile:", currentProfile);
console.log("Current subtasks:", currentProfile.subTasks);
 const updateProfileField = (field: keyof SubjectProfile, val: any) => {
  // Removed the console.log(updatedTasks) from here because updatedTasks doesn't exist in this scope!
  setSubjectProfiles(prev => ({
    ...prev,
    [headlineLessonId]: {
      ...((prev[headlineLessonId] || { materials: {}, learningObjective: "", centralIdea: "", loi1: "", loi2: "", loi3: "", activeLoiHighlight: 0, atls: "", subTasks: [], observations: {}, activeTaskId: null }) as SubjectProfile),
      [field]: val
    }
  }));
};

  const updateStudentObservation = (studentName: string, status: "green" | "amber" | "red" | "none" | "absent", notesStr: string) => {
    const currentObs = currentProfile.observations || {};
    const updatedObs = {
      ...currentObs,
      [studentName]: { status, notes: notesStr }
    };
    updateProfileField("observations", updatedObs);
  };

  const updatePresetField = (themeKey: string, field: keyof Presets, val: string) => {
    setThemePresets(prev => ({
      ...prev,
      [themeKey]: { ...prev[themeKey], [field]: val }
    }));
  };

  const applyUoiPreset = (themeKey: string) => {
    const data = themePresets[themeKey];
    if (!data) return;
    setSubjectProfiles(prev => ({
      ...prev,
      uoi: {
        ...((prev.uoi || { materials: {}, learningObjective: "", atls: "", subTasks: [], observations: {}, activeTaskId: null }) as SubjectProfile),
        centralIdea: data.centralIdea,
        loi1: data.loi1,
        loi2: data.loi2,
        loi3: data.loi3,
        activeLoiHighlight: 0
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
  
  const updatedTasks = [
    ...(currentProfile.subTasks ?? []),
    {
      id: Date.now(),
      text: newSubTaskText.trim(),
      done: false,
    },
  ];

  // Save the updated tasks array back to the state profile
  updateProfileField("subTasks", updatedTasks);
  
  // Clear out the text input field after adding
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
    while (presentList.length > 0) {
      groupsArray.push(presentList.splice(0, groupSize));
    }
    setGeneratedGroups(groupsArray);
  };

  const youtubeEmbedId = useMemo(() => {
    if (!youtubeUrl.trim()) return "";
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = youtubeUrl.match(regExp);
      return (match && match[2].length === 11) ? match[2] : "";
    } catch (e) { return ""; }
  }, [youtubeUrl]);

  const downloadWeeklySummaryReport = () => {
    let summaryText = `======= CLASSROOM WEEKLY COMPILATION SUMMARY PLAN =======\n`;
    summaryText += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    summaryText += `📝 SHARED GENERAL SESSION NOTES:\n${notes || "No general notes captured."}\n\n`;
    summaryText += `===========================================================================\n\n`;
    
    LESSON_TYPES.forEach((lesson) => {
      const profile = subjectProfiles[lesson.id];
      if (profile && (profile.learningObjective?.trim() || profile.subTasks.length > 0 || profile.centralIdea?.trim() || (profile.observations && Object.keys(profile.observations).length > 0))) {
        summaryText += `📚 SUBJECT: ${lesson.label.toUpperCase()}\n`;
        summaryText += `-----------------------------------------------------------------\n`;
        if (lesson.id === "uoi") {
          summaryText += `❓ GUIDING QUESTION:\n ${profile.learningObjective?.trim() || "None mapped."}\n\n`;
          summaryText += `💡 CENTRAL IDEA:\n ${profile.centralIdea?.trim() || "None mapped."}\n\n`;
          summaryText += `🔍 LOI 1: ${profile.loi1?.trim() || "None"}\n`;
          summaryText += `🔍 LOI 2: ${profile.loi2?.trim() || "None"}\n`;
          summaryText += `🔍 LOI 3: ${profile.loi3?.trim() || "None"}\n\n`;
        } else {
          summaryText += `🎯 LEARNING OBJECTIVE:\n ${profile.learningObjective?.trim() || "None mapped."}\n\n`;
        }
        
        if (headlineLessonId === lesson.id && embedHtml.trim()) {
          summaryText += `🔗 ACTIVE GOOGLE SLIDES / WEB EMBED MARKUP:\n ${embedHtml.trim()}\n\n`;
        }

        if (profile.subTasks.length > 0) {
          summaryText += `📋 DETAILED PACING STEP TASKS:\n`;
          profile.subTasks.forEach((t, i) => {
            summaryText += ` [${t.done ? "✓" : " "}] ${i + 1}. ${t.text}\n`;
          });
          summaryText += '\n';
        }

        if (profile.observations && Object.keys(profile.observations).length > 0) {
          summaryText += `📊 FORMATIVE ROSTER OBSERVATIONS & LEARNING STATUSES:\n`;
          Object.entries(profile.observations).forEach(([name, obs]) => {
            if (obs.status !== "none" || obs.notes.trim()) {
              const sym = obs.status === "green" ? "🟢 [Mastered]" : obs.status === "amber" ? "🟡 [Progressing]" : obs.status === "red" ? "🔴 [Needs Support]" : "⚪ [Not Tracked]";
              summaryText += `  • ${name}: ${sym} ${obs.notes ? `-> ${obs.notes}` : ""}\n`;
            }
          });
          summaryText += '\n';
        }

        summaryText += `===========================================================================\n\n`;
      }
    });
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `weekly-classroom-plan-summary.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const showSidebar = timetable.length > 0;
  const weekdayFull = time.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase();
  const monthFull = time.toLocaleDateString(undefined, { month: "long" }).toUpperCase();
  const dayNum = time.getDate();
  const yearNum = time.getFullYear();
  const customSpelledDate = `${weekdayFull}, ${monthFull} ${dayNum}, ${yearNum}`;

  const ALL_MATERIALS = [
    { id: "whiteboard", name: "Whiteboard" }, { id: "pen", name: "Pen / Pencil" }, { id: "ipad", name: "iPad" },
    { id: "writing_book", name: "Writing Book" }, { id: "math_notebook", name: "Math Notebook" },
    { id: "reading_book", name: "Reading Book" }, { id: "library_book", name: "Library Book" }, { id: "refill_water", name: "Refill Water" },
  ];

  const MemoizedIframeContainer = useMemo(() => {
    if (!embedHtml.trim()) return null;
    return (
      <div 
        style={{ width: "100%", minHeight: "450px", border: `2px solid ${C.cardBorder}`, borderRadius: "12px", overflow: "hidden", background: C.bg }}
        dangerouslySetInnerHTML={{ __html: embedHtml }} 
      />
    );
  }, [embedHtml]);

  return (
    <div style={{ display: "flex", width: "100vw", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: font, boxSizing: "border-box", margin: 0, padding: 0, overflowX: "hidden", maxWidth: "100%" }}>
      
      {/* ── LEFT SIDEBAR STRIP ── */}
      {showSidebar && (
        <div style={{ width: "110px", borderRight: `2px solid ${C.cardBorder}`, background: C.card, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", boxSizing: "border-box", overflowY: "auto", height: "100vh", position: "sticky", top: 0, flexShrink: 0 }}>
          {confirmClearActive ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", background: "#f8d7da", border: `1px solid ${C.roses}`, padding: "6px", borderRadius: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "bold", textAlign: "center", color: C.roseDark }}>Confirm?</span>
              <button onClick={() => { setTimetable([]); setConfirmClearActive(false); }} style={{ ...btnRose, padding: "4px", fontSize: "11px", borderRadius: "6px" }}>Yes</button>
              <button onClick={() => setConfirmClearActive(false)} style={{ ...btnGhost, padding: "4px", fontSize: "11px", borderRadius: "6px" }}>No</button>
            </div>
          ) : (
            <button 
              onClick={() => setConfirmClearActive(true)}
              style={{ ...btnGhost, fontSize: "11px", padding: "6px 8px", borderRadius: "10px", width: "100%", whiteSpace: "nowrap" }}
            >
              🗑️ Clear All
            </button>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", alignItems: "center" }}>
            {timetable.map((item) => {
              const lt = LESSON_TYPES.find((l) => l.id === item.lessonId) || LESSON_TYPES[LESSON_TYPES.length - 1];
              const isCurrentHeadline = headlineLessonId === item.lessonId;
              const isHovered = hoveredSidebarId === item.id;
              
              return (
                <div key={item.id} onMouseEnter={() => setHoveredSidebarId(item.id)} onMouseLeave={() => setHoveredSidebarId(null)} style={{ position: "relative" }}>
                  <button 
                    onClick={() => setHeadlineLessonId(item.lessonId)} 
                    title={lt.label}
                    style={{
                      background: isCurrentHeadline ? C.highlight : lt.bg,
                      border: isCurrentHeadline ? "3px solid #000" : `2px solid ${lt.color}`,
                      boxShadow: isCurrentHeadline ? "0 0 12px rgba(0,0,0,0.15)" : "none",
                      borderRadius: "14px", width: "68px", height: "68px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", boxSizing: "border-box", opacity: item.done ? 0.4 : 1, transition: "all 0.15s"
                    }}
                  >
                    <LessonIcon id={lt.id} size={32} />
                  </button>
                  {isHovered && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setTimetable(timetable.filter(t => t.id !== item.id)); }}
                      style={{ position: "absolute", top: "-6px", right: "-6px", background: C.roses, color: "#fff", border: "1.5px solid #000", borderRadius: "50%", width: "20px", height: "20px", fontSize: "12px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}
                    >×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, padding: "12px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "24px", minWidth: 0, maxWidth: "100%" }}>
        
        {/* Change 1: Compact Categorized Group Menu Workspace */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", background: C.card, padding: "12px 18px", borderRadius: "16px", border: `1.5px solid ${C.cardBorder}`, alignItems: "center", width: "100%", boxSizing: "border-box", position: "relative" }}>
          {WIDGET_GROUPS.map((group) => {
            const isMenuOpen = activeGroupMenu === group.label;
            return (
              <div key={group.label} style={{ position: "relative" }}>
                <button 
                  onClick={() => setActiveGroupMenu(isMenuOpen ? null : group.label)} 
                  style={{ ...btnGhost, fontSize: "14px", padding: "8px 16px", background: isMenuOpen ? C.highlight : C.bg, border: isMenuOpen ? "1.5px solid #000" : `1.5px solid ${C.cardBorder}`, borderRadius: "12px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span>{group.emoji}</span>
                  <span style={{ fontWeight: "700" }}>{group.label}</span>
                  <span style={{ fontSize: "10px", opacity: 0.7 }}>{isMenuOpen ? "▲" : "▼"}</span>
                </button>
                {isMenuOpen && (
                  <div style={{ position: "absolute", top: "45px", left: 0, background: "#fff", border: `1.5px solid ${C.cardBorder}`, borderRadius: "12px", padding: "8px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "0 6px 16px rgba(0,0,0,0.1)", zIndex: 99, minWidth: "190px" }}>
                    {group.widgets.map((wKey) => (
                      <button 
                        key={wKey} 
                        onClick={() => { toggle(wKey); setActiveGroupMenu(null); }} 
                        style={{ ...btnBase, padding: "8px 12px", fontSize: "13px", textAlign: "left", width: "100%", background: visible[wKey] ? C.highlight : "none", borderRadius: "8px", color: C.text, display: "flex", alignItems: "center", justifyContent: "space-between" }}
                      >
                        <span>{WIDGET_LABELS[wKey].split(" ").slice(1).join(" ")}</span>
                        <span>{visible[wKey] ? "🟢" : "⚪"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          <div style={{ height: "24px", width: "1.5px", background: C.cardBorder, margin: "0 4px" }} />

          <button onClick={() => { setIsEditingMaterials(!isEditingMaterials); setIsEditingPresets(false); }} style={{ ...btnGhost, fontWeight: "700", fontSize: "13px", padding: "8px 14px", borderRadius: "12px", border: isEditingMaterials ? "1.5px solid #000" : "1.5px dashed #000", background: isEditingMaterials ? C.highlight : "none" }}>
            {isEditingMaterials ? "🔒 Lock Materials" : "🛠️ Desk Setup"}
          </button>
          <button onClick={() => { setIsEditingPresets(!isEditingPresets); setIsEditingMaterials(false); }} style={{ ...btnGhost, fontWeight: "700", fontSize: "13px", padding: "8px 14px", borderRadius: "12px", border: isEditingPresets ? "1.5px solid #000" : "1.5px dashed #000", background: isEditingPresets ? C.highlight : "none" }}>
            🌍 Theme Presets
          </button>
          <button onClick={downloadWeeklySummaryReport} style={{ ...btnSage, fontSize: "13px", padding: "8px 16px", marginLeft: "auto", background: "#4e7a60" }}>
            📥 Export File Summary
          </button>
        </div>

        {/* MATERIAL PREVIEW SELECTION PANEL */}
        {isEditingMaterials && (
          <div style={{ ...cardStyle, background: "#fff", border: "2px dashed #000", padding: "16px", gap: "10px" }}>
            <span style={{ ...labelStyle, fontSize: "11px" }}>Configure Dashboard Active Student Desk Items:</span>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {ALL_MATERIALS.map((m) => {
                const isSelected = !!currentProfile.materials[m.id];
                return (
                  <button 
                    key={m.id} onClick={() => updateProfileField("materials", { ...currentProfile.materials, [m.id]: !isSelected })} 
                    style={{ ...btnBase, borderRadius: "12px", padding: "8px 14px", fontSize: "13px", background: isSelected ? "#dbe3ed" : C.bg, border: `2.5px solid ${isSelected ? "#000" : C.cardBorder}`, display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <MaterialIcon id={m.id} size={18} />
                    <span style={{ color: "#000", fontWeight: "700" }}>{isSelected ? `✓ ${m.name}` : m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TRANSDISCIPLINARY THEME PRESETS */}
        {isEditingPresets && (
          <div style={{ ...cardStyle, background: "#fff", border: "2px dashed #000", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <span style={{ ...labelStyle, fontSize: "11px" }}>Load or Customize UOI Transdisciplinary Theme Presets:</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", borderBottom: `1.5px solid ${C.cardBorder}`, paddingBottom: "10px" }}>
              {Object.keys(themePresets).map((theme) => (
                <button key={theme} onClick={() => setSelectedPresetToEdit(theme)} style={{ ...btnBase, fontSize: "11px", padding: "6px 12px", borderRadius: "8px", background: selectedPresetToEdit === theme ? C.slate : C.highlight, color: selectedPresetToEdit === theme ? "#fff" : C.text }}>
                  {theme}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", background: C.bg, padding: "14px", borderRadius: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: C.text }}>💡 Central Idea:</span>
                  <textarea value={themePresets[selectedPresetToEdit].centralIdea} onChange={(e) => updatePresetField(selectedPresetToEdit, "centralIdea", e.target.value)} style={{ ...inputStyle, background: "#fff", height: "60px", fontSize: "13px", resize: "none" }} />
                </div>
                <button onClick={() => applyUoiPreset(selectedPresetToEdit)} style={{ ...btnSage, fontSize: "13px", padding: "8px 16px" }}>🚀 Apply & Load Preset to Board</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: C.text }}>🔍 Lines of Inquiry Setup:</span>
                {[1, 2, 3].map((num) => {
                  const key = `loi${num}` as keyof Presets;
                  return <input key={num} value={themePresets[selectedPresetToEdit][key]} onChange={(e) => updatePresetField(selectedPresetToEdit, key, e.target.value)} placeholder={`Line of Inquiry ${num}`} style={{ ...inputStyle, background: "#fff", fontSize: "13px", padding: "6px 12px" }} />;
                })}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE HERO WORKSPACE (Displays only if a timetable entry exists) */}
        {timetable.length > 0 && activeHeadlineItem && (() => {
          const isMaths = headlineLessonId === "maths";
          const isUoi = headlineLessonId === "uoi";
          const mathDate = `${time.getDate().toString().padStart(2, '0')}/${(time.getMonth() + 1).toString().padStart(2, '0')}/${time.getFullYear().toString().slice(-2)}`;
          
          return (
            <>
              <div style={{ ...cardStyle, background: activeHeadlineItem.bg, border: `2.5px solid ${activeHeadlineItem.color}` }}>
                {/* Fixed Alignment Header Container */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr auto 1fr", 
                  alignItems: "center", 
                  gap: "20px", 
                  borderBottom: `2px solid ${activeHeadlineItem.color}`, 
                  paddingBottom: "18px", 
                  width: "100%",
                  boxSizing: "border-box"
                }}>
                  {/* Left Column: Subject & Icon */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", justifySelf: "start" }}>
                    <LessonIcon id={activeHeadlineItem.id} size={48} />
                    <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "800", color: "#000", letterSpacing: "-0.5px", textTransform: "uppercase" }}>
                      {activeHeadlineItem.label}
                    </h1>
                  </div>

                  {/* Center Column: Desk Materials */}
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

                  {/* Right Column: Date Representation */}
                  <div style={{ justifySelf: "end" }}>
                    <span style={{ fontFamily: font, fontSize: "24px", fontWeight: "700", color: C.text, whiteSpace: "nowrap" }}>
                      {isMaths ? mathDate : customSpelledDate}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
{isUoi && <span style={{ ...labelStyle, fontSize: "11px", color: "#000" }}>🎯 Guiding Question:</span>}                  <textarea value={currentProfile.learningObjective} onChange={(e) => updateProfileField("learningObjective", e.target.value)} style={{ ...inputStyle, background: "#fff", border: "2.5px solid #000", padding: "14px 18px", color: "#000", fontSize: "20px", fontWeight: "700", height: "85px", resize: "none" }} />
                </div>

                {isUoi && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "4px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ ...labelStyle, fontSize: "11px", color: "#000" }}>💡 Central Idea:</span>
                      <textarea value={currentProfile.centralIdea || ""} onChange={(e) => updateProfileField("centralIdea", e.target.value)} style={{ ...inputStyle, background: "#fff", border: "2.5px solid #000", padding: "14px 18px", color: "#000", fontSize: "18px", fontWeight: "700", height: "65px", resize: "none" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ ...labelStyle, fontSize: "11px", color: "#000" }}>🔍 Lines of Inquiry (Click to spotlight active target):</span>
                      {[1, 2, 3].map((num) => {
                        const loiKey = `loi${num}` as keyof SubjectProfile;
                        const isHighlighted = currentProfile.activeLoiHighlight === num;
                        return (
                          <div 
                            key={num} 
                            onClick={() => updateProfileField("activeLoiHighlight", isHighlighted ? 0 : num)} 
                            style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "14px", 
                              background: isHighlighted ? `${activeHeadlineItem.color}15` : "#fff", 
                              padding: "14px 18px", 
                              borderRadius: "14px", 
                              border: isHighlighted ? `3px solid ${activeHeadlineItem.color}` : `1.5px solid ${C.cardBorder}`, 
                              cursor: "pointer", 
                              width: "100%", 
                              boxSizing: "border-box",
                              boxShadow: isHighlighted ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
                              transition: "all 0.15s ease-in-out"
                            }}
                          >
                            <span style={{ fontWeight: "900", fontSize: "15px", color: activeHeadlineItem.color, whiteSpace: "nowrap" }}>LOI {num}:</span>
                            <input 
                              value={(currentProfile[loiKey] as string) || ""} 
                              onChange={(e) => { e.stopPropagation(); updateProfileField(loiKey, e.target.value); }} 
                              onClick={(e) => e.stopPropagation()} 
                              style={{ 
                                background: "none", 
                                border: "none", 
                                outline: "none", 
                                width: "100%", 
                                fontSize: "16px", 
                                fontWeight: isHighlighted ? "800" : "700", 
                                color: "#000", 
                                fontFamily: font 
                              }} 
                            />
                            {isHighlighted && <span style={{ fontSize: "18px", flexShrink: 0 }}>🎯</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* OPTIONAL STUDENT PROGRESS TRACKER WIDGET */}
              {visible.progressTracker && (
                <div style={{ ...cardStyle, background: "#fff", border: `2.5px solid ${activeHeadlineItem.color}`, marginTop: "-12px" }}>
                  <button style={closeBtn} onClick={() => toggle("progressTracker")}>×</button>
                  <span style={{ ...labelStyle, fontSize: "11px", color: "#000", marginTop: "4px", display: "block" }}>📋 Student Progress Tracker ({activeHeadlineItem.label}):</span>
                  {students.filter(s => s.present).length === 0 ? (
                    <span style={{ fontSize: "13px", color: C.muted, fontStyle: "italic" }}>No present students in class roster to capture profiles for. Populate names in the Roster widget below.</span>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", width: "100%" }}>
                      {students.filter(s => s.present).map((student) => {
                        const obs = (currentProfile.observations || {})[student.name] || { status: "none", notes: "" };
                        return (
                          <div key={student.name} style={{ display: "flex", flexDirection: "column", gap: "8px", background: C.bg, padding: "12px", borderRadius: "12px", border: `1.5px solid ${C.cardBorder}` }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ fontWeight: "800", fontSize: "14px", color: "#000" }}>{student.name}</span>
                              <div style={{ display: "flex", gap: "4px" }}>
                                <button title="Needs Support" onClick={() => updateStudentObservation(student.name, obs.status === "red" ? "none" : "red", obs.notes)} style={{ background: obs.status === "red" ? C.roses : "none", border: "1px solid #000", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontSize: "11px", padding: 0 }}>🔴</button>
                                <button title="Progressing" onClick={() => updateStudentObservation(student.name, obs.status === "amber" ? "none" : "amber", obs.notes)} style={{ background: obs.status === "amber" ? "#ffeeba" : "none", border: "1px solid #000", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontSize: "11px", padding: 0 }}>🟡</button>
                                <button title="Mastered" onClick={() => updateStudentObservation(student.name, obs.status === "green" ? "none" : "green", obs.notes)} style={{ background: obs.status === "green" ? "#d4edda" : "none", border: "1px solid #000", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontSize: "11px", padding: 0 }}>🟢</button>
                                <button title="Absent" onClick={() => updateStudentObservation(student.name, obs.status === "absent" ? "none" : "absent", obs.notes)} style={{ background: obs.status === "absent" ? "#e0e0e0" : "none", border: "1px solid #000", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontSize: "11px", fontWeight: "900", padding: 0, color: "#555" }}>A</button>
                              </div>
                            </div>
                            <input 
                              value={obs.notes} 
                              onChange={(e) => updateStudentObservation(student.name, obs.status, e.target.value)} 
                              placeholder="Add quick status observations..." 
                              style={{ ...inputStyle, background: "#fff", padding: "6px 10px", fontSize: "12px", borderRadius: "8px" }} 
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}

        {/* PACING STEPS */}
        {visible.taskBreakdown && (
          <div style={{ ...cardStyle, border: timetable.length > 0 && activeHeadlineItem ? `2.5px solid ${activeHeadlineItem.color}` : `1.5px solid ${C.cardBorder}`, background: "#fff" }}>
            <button style={closeBtn} onClick={() => toggle("taskBreakdown")}>×</button>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
             <input 
  style={inputStyle}
  type="text" 
  value={newSubTaskText} 
  onChange={(e) => setNewSubTaskText(e.target.value)} 
  placeholder="Enter a new step..."
  onKeyDown={(e) => e.key === 'Enter' && addSubTask()}
/>
<button onClick={addSubTask} style={btnSage}>Add Step</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
            {(currentProfile?.subTasks?.length ?? 0) > 0 ? (
                  currentProfile.subTasks.map((task) => {
                  const isTaskFocused = currentProfile.activeTaskId === task.id;
                  const activeAccent = activeHeadlineItem?.color || C.slate;
                  return (
                    <div 
                      key={task.id} 
                      onClick={() => updateProfileField("activeTaskId", isTaskFocused ? null : task.id)}
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "14px", 
                        background: task.done ? C.highlight : isTaskFocused ? activeAccent : C.bg, 
                        padding: isTaskFocused ? "16px 20px" : "10px 16px", 
                        borderRadius: "12px", 
                        opacity: task.done ? 0.5 : 1,
                        border: isTaskFocused ? "2.5px solid #000" : `1px solid ${C.cardBorder}`,
                        boxShadow: isTaskFocused ? "0 4px 12px rgba(0,0,0,0.12)" : "none",
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={task.done} 
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => updateProfileField("subTasks", currentProfile.subTasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t))} 
                        style={{ width: "20px", height: "20px", cursor: "pointer" }} 
                      />
                      <span style={{ fontSize: isTaskFocused ? "19px" : "16px", fontWeight: "700", color: isTaskFocused && !task.done ? "#fff" : "#000", textDecoration: task.done ? "line-through" : "none", flex: 1, transition: "font-size 0.2s" }}>{task.text}</span>
                      {isTaskFocused && !task.done && <span style={{ fontSize: "14px", color: "#fff", background: "rgba(0,0,0,0.2)", padding: "4px 8px", borderRadius: "6px", fontWeight: "bold" }}>CURRENT STEP 🎯</span>}
                      <button onClick={(e) => { e.stopPropagation(); updateProfileField("subTasks", currentProfile.subTasks.filter(t => t.id !== task.id)); }} style={{ background: "none", border: "none", color: isTaskFocused ? "#fff" : C.muted, cursor: "pointer", fontSize: "16px" }}>×</button>
                    </div>
                  );
                })
              ) : (
                <span style={{ color: C.muted, fontSize: "13px", fontStyle: "italic" }}>No visual steps added.</span>
              )}
            </div>
          </div>
        )}

        {/* ── LOWER GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", width: "100%", boxSizing: "border-box" }}>
          
          {/* EMBEDDER */}
          {visible.embedder && (
            <div style={{ ...cardStyle, gridColumn: "span 1", background: "#fff", border: "2px solid #000" }}>
              <button style={closeBtn} onClick={() => toggle("embedder")}>×</button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "12px" }}>
                <button onClick={() => setIsEmbedInputCollapsed(!isEmbedInputCollapsed)} style={{ ...btnGhost, fontSize: "11px", padding: "4px 12px" }}>{isEmbedInputCollapsed ? "⚙️ Show Code Box" : "Hide Input Code Box"}</button>
              </div>
              {!isEmbedInputCollapsed && <textarea defaultValue={embedHtml} onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => setEmbedHtml(e.target.value)} placeholder="Paste iframe embed code target framework..." style={{ ...inputStyle, height: "70px", fontFamily: "monospace", fontSize: "13px" }} />}
              {MemoizedIframeContainer}
            </div>
          )}

          {/* YOUTUBE */}
          {visible.youtubeWidget && (
            <div style={{ ...cardStyle, gridColumn: "span 1", background: "#fff", border: "2px solid #000" }}>
              <button style={closeBtn} onClick={() => toggle("youtubeWidget")}>×</button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "12px" }}>
                <button onClick={() => setIsYoutubeInputCollapsed(!isYoutubeInputCollapsed)} style={{ ...btnGhost, fontSize: "11px", padding: "4px 12px" }}>{isYoutubeInputCollapsed ? "⚙️ Show URL Input" : "Hide Link Input Box"}</button>
              </div>
              {!isYoutubeInputCollapsed && <input type="text" defaultValue={youtubeUrl} onBlur={(e: React.FocusEvent<HTMLInputElement>) => setYoutubeUrl(e.target.value)} placeholder="Paste standard YouTube video URL share link..." style={inputStyle} />}
              {youtubeEmbedId ? (
                <div style={{ width: "100%", position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "12px", background: "#000", border: `2px solid ${C.cardBorder}` }}>
                  <iframe style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} src={`https://www.youtube.com/embed/${youtubeEmbedId}`} title="YouTube player" allowFullScreen />
                </div>
              ) : youtubeUrl.trim() && <span style={{ color: C.roseDark, fontSize: "13px", fontStyle: "italic" }}>Invalid YouTube link target parsed.</span>}
            </div>
          )}

          {/* TIMETABLE SETUP */}
          {visible.timetable && (
            <div style={cardStyle}>
              <button style={closeBtn} onClick={() => toggle("timetable")}>×</button>
              <div style={{ background: C.highlight, padding: "12px", borderRadius: "14px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginTop: "12px" }}>
                <select onChange={(e: React.ChangeEvent<HTMLSelectElement>) => loadTemplate(e.target.value)} defaultValue="" style={{ ...inputStyle, width: "auto", flex: 1, padding: "6px 10px", fontSize: "14px" }}>
                  <option value="" disabled>-- Load Saved Template --</option>
                  {Object.keys(templates).map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <div style={{ display: "flex", gap: "6px", flex: "1 1 180px" }}>
                  <input value={newTemplateName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTemplateName(e.target.value)} placeholder="Name Plan..." style={{ ...inputStyle, padding: "6px 10px", fontSize: "13px" }} />
                  <button style={{ ...btnSage, padding: "6px 12px", fontSize: "12px", borderRadius: "10px" }} onClick={saveCurrentAsTemplate}>Save</button>
                </div>
              </div>
              <div style={{ borderTop: `1.5px solid ${C.cardBorder}`, paddingTop: "12px", marginTop: "4px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                  {LESSON_TYPES.map((lt) => (
                    <button 
                      key={lt.id} 
                      onClick={() => {
                        const newItem = { id: Date.now(), lessonId: lt.id, time: "", done: false, note: "" };
                        setTimetable([...timetable, newItem]);
                        setHeadlineLessonId(lt.id);
                      }} 
                      style={{ ...btnBase, padding: "10px 6px", fontSize: "12px", borderRadius: "10px", background: lt.bg, color: C.text, border: `1.5px solid ${lt.color}`, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}
                    >
                      {lt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CLOCK */}
          {visible.clock && (
            <div style={cardStyle}>
              <button style={closeBtn} onClick={() => toggle("clock")}>×</button>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "220px" }}>
                <div style={{ fontSize: "74px", fontWeight: "800", letterSpacing: "-2px", color: C.text }}>{time.toLocaleTimeString()}</div>
              </div>
            </div>
          )}

          {/* TIMER */}
          {visible.timer && (
            <div style={cardStyle}>
              <button style={closeBtn} onClick={() => toggle("timer")}>×</button>
              <CircleTimer pct={seconds / (minutes * 60 || 1)} minutes={minutes} seconds={seconds} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", borderTop: `1px solid ${C.cardBorder}`, paddingTop: "14px" }}>
                <input type="number" value={minutes} min={1} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const v = Math.max(1, Number(e.target.value)); setMinutes(v); if (!running) setSeconds(v * 60); }} style={{ ...inputStyle, width: "85px", fontSize: "16px", fontWeight: "bold", textAlign: "center" }} />
                <button style={btnSage} onClick={() => setRunning(true)} disabled={running}>▶ START</button>
                <button style={btnRose} onClick={() => setRunning(false)}>⏸ STOP</button>
                <button style={btnGhost} onClick={() => { setRunning(false); setSeconds(minutes * 60); }}>↺ RESET</button>
              </div>
            </div>
          )}

          {/* STOPWATCH */}
          {visible.stopwatch && (
            <div style={cardStyle}>
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
            <div style={{ ...cardStyle }}>
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
            <div style={cardStyle}>
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
            <div style={cardStyle}>
              <button style={closeBtn} onClick={() => toggle("notes")}>×</button>
              <textarea value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} placeholder="Type shared lesson summary notes here…" style={{ ...inputStyle, flex: 1, minHeight: "220px", resize: "none", marginTop: "12px" }} />
            </div>
          )}

          {/* CLASS ROSTER */}
          {visible.classList && (
            <div style={cardStyle}>
              <button style={closeBtn} onClick={() => toggle("classList")}>×</button>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <input value={studentName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStudentName(e.target.value)} placeholder="Name…" onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" && studentName.trim()) { e.preventDefault(); setStudents([...students, { name: studentName.trim(), present: true }]); setStudentName(""); } }} style={inputStyle} />
                <button style={btnSlate} onClick={() => { if (studentName.trim()) { setStudents([...students, { name: studentName.trim(), present: true }]); setStudentName(""); } }}>+</button>
              </div>
              
              <div style={{ display: "flex", gap: "6px" }}>
                <button style={{ ...btnGhost, fontSize: "11px", padding: "6px 10px", flex: 1, border: "1px dashed #000" }} onClick={() => { if (students.length === 0) return alert("List is empty!"); const textData = students.map(s => s.name).join("\n"); const blob = new Blob([textData], { type: "text/plain" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "class-list.txt"; link.click(); URL.revokeObjectURL(url); }}>💾 Save File</button>
                <label style={{ ...btnGhost, fontSize: "11px", padding: "6px 10px", flex: 1, border: "1px dashed #000", textAlign: "center", cursor: "pointer" }}>📂 Load File
                  <input type="file" accept=".txt" style={{ display: "none" }} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (evt) => { const text = evt.target?.result as string; if (text) { const names = text.split("\n").map(n => n.trim()).filter(n => n.length > 0); if (names.length > 0) setStudents(names.map(name => ({ name, present: true }))); } }; reader.readAsText(file); }} />
                </label>
              </div>
              <div style={{ background: C.highlight, padding: "12px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "bold" }}>Group Size:</span>
                  <input type="number" min={2} max={10} value={groupSize} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGroupSize(Math.max(2, Number(e.target.value)))} style={{ ...inputStyle, width: "65px", padding: "4px 8px" }} />
                  <button onClick={generateClassGroups} style={{ ...btnSage, padding: "6px 14px", fontSize: "12px", borderRadius: "8px", flex: 1 }}>👥 Generate Groups</button>
                </div>
                {generatedGroups.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto", background: "#fff", padding: "10px", borderRadius: "8px", border: `1.5px solid ${C.cardBorder}` }}>
                    {generatedGroups.map((grp: string[], gIdx: number) => (
                      <div key={gIdx} style={{ fontSize: "13px", fontWeight: "700", color: "#000", borderBottom: "1px solid #f2ede4", paddingBottom: "4px" }}>
                        Team {gIdx + 1}: <span style={{ fontWeight: "normal", color: C.text }}>{grp.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button style={{ ...btnAmber, alignSelf: "stretch" }} onClick={() => { const presentOnes = students.filter(s => s.present); if (presentOnes.length > 0) setChosenStudent(presentOnes[Math.floor(Math.random() * presentOnes.length)].name); }}>🎲 PICK RANDOM PRESENT STUDENT</button>
              {chosenStudent && <div style={{ background: "#dce8f5", padding: "12px", borderRadius: "10px", fontWeight: "800", fontSize: "18px", textAlign: "center" }}>⭐ {chosenStudent}</div>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "100px", overflowY: "auto", borderTop: `1px solid ${C.cardBorder}`, paddingTop: "8px" }}>
                {students.map((s: Student, i: number) => (
                  <span key={i} style={{ background: s.present ? C.highlight : "#f5c6c6", border: s.present ? `1px solid ${C.cardBorder}` : `1px solid ${C.roses}`, padding: "4px 8px", borderRadius: "8px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px", opacity: s.present ? 1 : 0.6 }}>
                    <input type="checkbox" checked={s.present} onChange={() => setStudents(students.map((st: Student, idx: number) => idx === i ? { ...st, present: !st.present } : st))} style={{ cursor: "pointer" }} />
                    <span style={{ fontWeight: "700", textDecoration: s.present ? "none" : "line-through" }}>{s.name}</span>
                    <button onClick={() => setStudents(students.filter((_, idx: number) => idx !== i))} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}>×</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SCOREBOARD */}
          {visible.scoreboard && (
            <div style={cardStyle}>
              <button style={closeBtn} onClick={() => toggle("scoreboard")}>×</button>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1, alignItems: "center", marginTop: "12px" }}>
                {teams.map((team: ScoreTeam) => (
                  <div key={team.id} style={{ flex: "1 1 100px", background: C.bg, border: `2px solid ${team.color}`, borderRadius: "14px", padding: "10px", textAlign: "center" }}>
                    <input value={team.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeams(teams.map(t => t.id === team.id ? { ...t, name: e.target.value } : t))} style={{ fontWeight: "700", color: team.color, fontSize: "14px", background: "none", border: "none", textAlign: "center", width: "100%", outline: "none", fontFamily: font }} />
                    <div style={{ fontSize: "36px", fontWeight: "800", margin: "4px 0" }}>{team.score}</div>
                    <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                      <button onClick={() => setTeams(teams.map((t: ScoreTeam) => t.id === team.id ? { ...t, score: t.score + 1 } : t))} style={{ ...btnBase, padding: "4px 10px" }}>+</button>
                      <button onClick={() => setTeams(teams.map((t: ScoreTeam) => t.id === team.id ? { ...t, score: Math.max(0, t.score - 1) } : t))} style={{ ...btnGhost, padding: "4px 10px" }}>-</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                <input value={newTeamName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeamName(e.target.value)} placeholder="New team name…" onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" && newTeamName.trim()) { e.preventDefault(); setTeams([...teams, { id: Date.now(), name: newTeamName.trim(), score: 0, color: TEAM_COLORS[teams.length % TEAM_COLORS.length] }]); setNewTeamName(""); } }} style={{ ...inputStyle, padding: "6px 10px" }} />
                <button style={btnLavender} onClick={() => { if (newTeamName.trim()) { setTeams([...teams, { id: Date.now(), name: newTeamName.trim(), score: 0, color: TEAM_COLORS[teams.length % TEAM_COLORS.length] }]); setNewTeamName(""); } }}>+</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}