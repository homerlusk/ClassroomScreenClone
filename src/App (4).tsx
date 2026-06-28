import { useEffect, useState } from "react";

const C = {
  bg: "#f2ede4",
  card: "#ebe5d9",
  cardBorder: "#d9d2c5",
  text: "#2c2825",
  muted: "#7a7068",
  sage: "#7a9e87",
  sageDark: "#4e7a60",
  rose: "#c47b7b",
  roseDark: "#9e4f4f",
  slate: "#6b82a8",
  slateDark: "#3d5a80",
  amber: "#b8883a",
  amberDark: "#7a5520",
  highlight: "#e8e0cf",
};

const font = "'Century Gothic', 'Trebuchet MS', Arial, sans-serif";

const cardStyle: React.CSSProperties = {
  background: C.card,
  borderRadius: "18px",
  padding: "24px",
  border: `1.5px solid ${C.cardBorder}`,
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  position: "relative",
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
const btnRose: React.CSSProperties = { ...btnBase, background: C.rose, color: "#fff" };
const btnSlate: React.CSSProperties = { ...btnBase, background: C.slate, color: "#fff" };
const btnAmber: React.CSSProperties = { ...btnBase, background: C.amber, color: "#fff" };
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
};

const WIDGETS = ["clock", "timer", "notes", "traffic", "classList"] as const;
type Widget = typeof WIDGETS[number];

const WIDGET_LABELS: Record<Widget, string> = {
  clock: "🕒 Clock",
  timer: "⏲ Timer",
  notes: "📝 Notes",
  traffic: "🚦 Traffic Light",
  classList: "👥 Class List",
};

// Visual timer: SVG pie/arc
function CircleTimer({ pct, minutes, seconds }: { pct: number; minutes: number; seconds: number }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 80;
  const stroke = 14;

  // Arc goes clockwise from top
  const angle = pct * 2 * Math.PI;
  const x = cx + r * Math.sin(angle);
  const y = cy - r * Math.cos(angle);
  const largeArc = angle > Math.PI ? 1 : 0;

  const trackColor = C.cardBorder;
  const fillColor = pct > 0.5 ? C.sage : pct > 0.2 ? C.amber : C.rose;

  const timeLabel = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <svg width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      {/* Progress arc — only draw if pct > 0 */}
      {pct > 0.001 && (
        pct >= 0.999
          ? <circle cx={cx} cy={cy} r={r} fill="none" stroke={fillColor} strokeWidth={stroke} />
          : <path
              d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`}
              fill="none"
              stroke={fillColor}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
      )}
      {/* Time label */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="32"
        fontWeight="700"
        fill={C.text}
        fontFamily={font}
      >
        {timeLabel}
      </text>
      {/* Minutes label */}
      <text
        x={cx}
        y={cy + 22}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="13"
        fill={C.muted}
        fontFamily={font}
      >
        {minutes} min
      </text>
    </svg>
  );
}

function App() {
  const [time, setTime] = useState<Date>(new Date());
  const [seconds, setSeconds] = useState<number>(300);
  const [running, setRunning] = useState<boolean>(false);
  const [minutes, setMinutes] = useState<number>(5);
  const [notes, setNotes] = useState<string>("");
  const [light, setLight] = useState<"go" | "slow" | "stop">("go");
  const [students, setStudents] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("classList");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [studentName, setStudentName] = useState<string>("");
  const [chosenStudent, setChosenStudent] = useState<string>("");
  const [visible, setVisible] = useState<Record<Widget, boolean>>({
    clock: true, timer: true, notes: true, traffic: true, classList: true,
  });

  const toggle = (key: Widget) => setVisible((v) => ({ ...v, [key]: !v[key] }));

  useEffect(() => {
    const clock = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSeconds((old) => {
        if (old <= 1) { setRunning(false); return 0; }
        return old - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    localStorage.setItem("classList", JSON.stringify(students));
  }, [students]);

  const timerPct = seconds / (minutes * 60 || 1);

  const lightConfig = {
    go:   { bg: "#c8e6c9", border: C.sage,  textColor: "#2d4a33", label: "All good — carry on" },
    slow: { bg: "#fff3cd", border: C.amber, textColor: "#4a3800", label: "Slow down, please" },
    stop: { bg: "#f5c6c6", border: C.rose,  textColor: "#4a1c1c", label: "Stop and listen" },
  };
  const lc = lightConfig[light];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, padding: "32px", fontFamily: font, boxSizing: "border-box" }}>

      {/* TOGGLE BAR */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
        {WIDGETS.map((key) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            style={{
              ...btnGhost,
              fontSize: "13px",
              padding: "7px 16px",
              opacity: visible[key] ? 1 : 0.45,
              textDecoration: visible[key] ? "none" : "line-through",
            }}
          >
            {WIDGET_LABELS[key]}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>

        {/* CLOCK */}
        {visible.clock && (
          <div style={cardStyle}>
            <button style={closeBtn} onClick={() => toggle("clock")} title="Close">×</button>
            <div style={labelStyle}>🕒 Clock</div>
            <div style={{ fontSize: "50px", fontWeight: "700", lineHeight: 1, color: C.text, letterSpacing: "-1px" }}>
              {time.toLocaleTimeString()}
            </div>
            <div style={{ color: C.muted, fontSize: "15px", lineHeight: 1.6 }}>
              {time.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </div>
          </div>
        )}

        {/* TIMER */}
        {visible.timer && (
          <div style={cardStyle}>
            <button style={closeBtn} onClick={() => toggle("timer")} title="Close">×</button>
            <div style={labelStyle}>⏲ Timer</div>

            <CircleTimer pct={timerPct} minutes={minutes} seconds={seconds} />

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="number"
                value={minutes}
                min={1}
                onChange={(e) => {
                  const value = Math.max(1, Number(e.target.value));
                  setMinutes(value);
                  if (!running) setSeconds(value * 60);
                }}
                style={{ ...inputStyle, width: "72px" }}
              />
              <span style={{ color: C.muted, fontSize: "15px" }}>minutes</span>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button style={btnSage} onClick={() => setRunning(true)} disabled={running}>▶ Start</button>
              <button style={btnRose} onClick={() => setRunning(false)}>⏸ Stop</button>
              <button style={btnGhost} onClick={() => { setRunning(false); setSeconds(minutes * 60); }}>↺ Reset</button>
            </div>
          </div>
        )}

        {/* NOTES */}
        {visible.notes && (
          <div style={cardStyle}>
            <button style={closeBtn} onClick={() => toggle("notes")} title="Close">×</button>
            <div style={labelStyle}>📝 Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type notes here…"
              style={{ ...inputStyle, height: "148px", resize: "vertical" }}
            />
          </div>
        )}

        {/* TRAFFIC LIGHT */}
        {visible.traffic && (
          <div style={cardStyle}>
            <button style={closeBtn} onClick={() => toggle("traffic")} title="Close">×</button>
            <div style={labelStyle}>🚦 Traffic Light</div>
            <div style={{
              background: lc.bg,
              border: `2px solid ${lc.border}`,
              borderRadius: "14px",
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              transition: "background 0.5s, border 0.5s",
            }}>
              <span style={{ fontSize: "28px", color: lc.border }}>●</span>
              <span style={{ fontWeight: "700", fontSize: "16px", color: lc.textColor, lineHeight: 1.4 }}>
                {lc.label}
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={btnSage} onClick={() => setLight("go")}>Go</button>
              <button style={btnAmber} onClick={() => setLight("slow")}>Slow</button>
              <button style={btnRose} onClick={() => setLight("stop")}>Stop</button>
            </div>
          </div>
        )}

        {/* CLASS LIST */}
        {visible.classList && (
          <div style={{ ...cardStyle, gridColumn: "span 2" }}>
            <button style={closeBtn} onClick={() => toggle("classList")} title="Close">×</button>
            <div style={labelStyle}>👥 Class List</div>

            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student name…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && studentName.trim()) {
                    setStudents([...students, studentName.trim()]);
                    setStudentName("");
                  }
                }}
                style={inputStyle}
              />
              <button
                style={btnSlate}
                onClick={() => {
                  if (studentName.trim()) {
                    setStudents([...students, studentName.trim()]);
                    setStudentName("");
                  }
                }}
              >
                + Add
              </button>
            </div>

            <button
              style={{ ...btnAmber, alignSelf: "flex-start" }}
              onClick={() => {
                if (students.length > 0) {
                  const pick = students[Math.floor(Math.random() * students.length)];
                  setChosenStudent(pick);
                }
              }}
            >
              🎲 Pick Random Student
            </button>

            {chosenStudent && (
              <div style={{
                background: "#dce8f5",
                border: "2px solid #6b82a8",
                borderRadius: "14px",
                padding: "14px 20px",
                fontWeight: "700",
                fontSize: "18px",
                color: C.slateDark,
                lineHeight: 1.4,
              }}>
                ⭐ {chosenStudent}
              </div>
            )}

            {students.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {students.map((s, i) => (
                  <li key={i} style={{
                    background: C.highlight,
                    border: `1.5px solid ${C.cardBorder}`,
                    borderRadius: "50px",
                    padding: "7px 16px",
                    fontSize: "15px",
                    color: C.text,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    lineHeight: 1.4,
                  }}>
                    {s}
                    <button
                      onClick={() => setStudents(students.filter((_, idx) => idx !== i))}
                      style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "16px", padding: "0", lineHeight: 1 }}
                      title="Remove"
                    >×</button>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: C.muted, fontSize: "15px", lineHeight: 1.6 }}>
                No students yet — add one above!
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
