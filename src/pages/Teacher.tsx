import React, { useEffect, useMemo, useState } from "react";
import {
  getApiUrl, setApiUrl, clearApiUrl, fetchIntentions, fetchStudents, fetchNotes,
  addNote, type Intention, type Note,
} from "../services/notes";

const RAG_TAGS = [
  { emoji: "🔴", label: "Doesn't get it", color: "#c0433f" },
  { emoji: "🟡", label: "Getting it", color: "#c99a2e" },
  { emoji: "🟢", label: "Gets it", color: "#3f8a52" },
];

const QUICK_TAGS = [
  { emoji: "⭐", label: "Independent" },
  { emoji: "🤝", label: "Helpful" },
  { emoji: "💬", label: "Explained thinking" },
  { emoji: "📚", label: "Excellent effort" },
  { emoji: "⚠️", label: "Needs support" },
];

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// Basic cross-browser speech-to-text. Works in Chrome (desktop & Android).
// Safari/iOS support is inconsistent, so the mic button is hidden if the
// browser doesn't expose the API at all, rather than failing silently.
function useSpeechToText(onResult: (text: string) => void) {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const [listening, setListening] = useState(false);
  const supported = !!SpeechRecognition;

  const start = () => {
    if (!supported) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };
    recognition.start();
  };

  return { start, listening, supported };
}

export default function Teacher() {
  const [apiUrlInput, setApiUrlInput] = useState(getApiUrl());
  const [connected, setConnected] = useState(!!getApiUrl());
  const [connectionError, setConnectionError] = useState("");

  const [intentions, setIntentions] = useState<Record<string, Intention>>({});
  const [students, setStudents] = useState<{ name: string; present: boolean }[]>([]);
  const [subject, setSubject] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [freeText, setFreeText] = useState("");
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const { start: startListening, listening, supported: micSupported } = useSpeechToText(
    (text) => setFreeText((prev) => (prev ? `${prev} ${text}` : text))
  );

  async function refreshAll() {
    try {
      const [intentionsData, studentsData] = await Promise.all([fetchIntentions(), fetchStudents()]);
      setIntentions(intentionsData);
      setStudents(studentsData);
      const subjects = Object.keys(intentionsData);
      if (subjects.length && !subject) setSubject(subjects[0]);
      setConnected(true);
      setConnectionError("");
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : "Could not connect");
    }
  }

  useEffect(() => {
    if (getApiUrl()) refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchNotes(selectedStudent).then((notes) => {
        setRecentNotes(notes.slice(-5).reverse());
      }).catch(() => {});
    }
  }, [selectedStudent, savedFlash]);

  const currentIntention = intentions[subject];

  const learningIntentionSummary = useMemo(() => {
    if (!currentIntention) return "";
    return [currentIntention.learningObjective, currentIntention.loi1, currentIntention.loi2, currentIntention.loi3]
      .filter(Boolean).join(" · ");
  }, [currentIntention]);

  async function saveObservation(text: string, tag?: string) {
    if (!selectedStudent || !text.trim()) return;
    setSaving(true);
    try {
      const now = new Date();
      await addNote({
        date: now.toISOString().slice(0, 10),
        week: isoWeek(now),
        studentName: selectedStudent,
        subject,
        unitTitle: currentIntention?.centralIdea || "",
        learningIntention: learningIntentionSummary,
        tags: tag ? [tag] : [],
        text,
      });
      setFreeText("");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!connected) {
    return (
      <div style={styles.page}>
        <h1 style={styles.h1}>Connect to your class</h1>
        <p style={styles.muted}>
          Paste the Web app URL from your Apps Script deployment (see apps-script/Code.gs setup steps).
        </p>
        <input
          style={styles.input}
          placeholder="https://script.google.com/macros/s/.../exec"
          value={apiUrlInput}
          onChange={(e) => setApiUrlInput(e.target.value)}
        />
        <button
          style={styles.primaryButton}
          onClick={() => { setApiUrl(apiUrlInput); refreshAll(); }}
        >
          Connect
        </button>
        {connectionError && <p style={styles.error}>{connectionError}</p>}
      </div>
    );
  }

  function disconnect() {
    clearApiUrl();
    setConnected(false);
    setConnectionError("");
    setApiUrlInput("");
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.h1}>Observations</h1>
        <button style={styles.linkButton} onClick={disconnect}>Change API URL</button>
      </div>

      {connectionError && (
        <div style={styles.errorBox}>
          <p style={styles.error}>{connectionError}</p>
          <button style={styles.linkButton} onClick={disconnect}>Re-enter the API URL</button>
          <button style={styles.linkButton} onClick={refreshAll}>Try again</button>
        </div>
      )}

      <div style={styles.tabRow}>
        {Object.keys(intentions).map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            style={{ ...styles.tab, ...(subject === s ? styles.tabActive : {}) }}
          >
            {s}
          </button>
        ))}
      </div>

      {currentIntention && (
        <div style={styles.intentionBanner}>
          <div style={styles.intentionLabel}>Linked to what's on screen</div>
          <div>{learningIntentionSummary || "No learning intention set for this subject yet."}</div>
        </div>
      )}

      <div style={styles.studentGrid}>
        {students.map((s) => (
          <button
            key={s.name}
            onClick={() => setSelectedStudent(s.name)}
            style={{ ...styles.studentChip, ...(selectedStudent === s.name ? styles.studentChipActive : {}) }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {selectedStudent && (
        <>
          <div style={styles.ragRow}>
            {RAG_TAGS.map((t) => (
              <button
                key={t.label}
                disabled={saving}
                style={{ ...styles.ragButton, borderColor: t.color, color: t.color }}
                onClick={() => saveObservation(t.label, t.label)}
              >
                <span style={{ fontSize: 26 }}>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div style={styles.intentionLabel}>More</div>
          <div style={styles.quickTagGrid}>
            {QUICK_TAGS.map((t) => (
              <button
                key={t.label}
                disabled={saving}
                style={styles.quickTagButton}
                onClick={() => saveObservation(t.label, t.label)}
              >
                <span style={{ fontSize: 22 }}>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div style={styles.freeTextRow}>
            <input
              style={styles.freeTextInput}
              placeholder={`Note for ${selectedStudent}...`}
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
            />
            {micSupported && (
              <button
                style={{ ...styles.micButton, ...(listening ? styles.micButtonActive : {}) }}
                onClick={startListening}
                title="Voice note"
              >
                🎤
              </button>
            )}
            <button
              style={styles.primaryButton}
              disabled={saving || !freeText.trim()}
              onClick={() => saveObservation(freeText)}
            >
              Save
            </button>
          </div>

          {savedFlash && <div style={styles.savedFlash}>Saved ✓</div>}

          {recentNotes.length > 0 && (
            <div style={styles.recentList}>
              <div style={styles.intentionLabel}>Recent for {selectedStudent}</div>
              {recentNotes.map((n) => (
                <div key={n.id} style={styles.recentItem}>
                  <span style={styles.recentDate}>{n.date}</span> {n.text}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: "0 auto", padding: 16, fontFamily: "'Century Gothic', 'Trebuchet MS', Arial, sans-serif", color: "#2c2825" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 },
  linkButton: { background: "none", border: "none", color: "#3d5a80", fontSize: 13, textDecoration: "underline", cursor: "pointer", padding: 4 },
  errorBox: { background: "#f6e6e6", borderRadius: 10, padding: 10, marginBottom: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 },  h1: { fontSize: 22, marginBottom: 8 },
  muted: { color: "#7a7068", fontSize: 14 },
  input: { width: "100%", padding: 12, borderRadius: 10, border: "1.5px solid #d9d2c5", marginBottom: 12, boxSizing: "border-box" },
  primaryButton: { padding: "12px 18px", borderRadius: 10, border: "none", background: "#4e7a60", color: "white", fontWeight: 600, cursor: "pointer" },
  error: { color: "#9e4f4f", fontSize: 13 },
  tabRow: { display: "flex", gap: 8, overflowX: "auto", marginBottom: 12 },
  tab: { padding: "8px 14px", borderRadius: 20, border: "1.5px solid #d9d2c5", background: "#ebe5d9", whiteSpace: "nowrap", cursor: "pointer", textTransform: "capitalize" },
  tabActive: { background: "#4e7a60", color: "white", borderColor: "#4e7a60" },
  intentionBanner: { background: "#e8e0cf", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 14 },
  intentionLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "#7a7068", marginBottom: 4 },
  studentGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  studentChip: { padding: "10px 14px", borderRadius: 20, border: "1.5px solid #d9d2c5", background: "#ebe5d9", cursor: "pointer" },
  studentChipActive: { background: "#3d5a80", color: "white", borderColor: "#3d5a80" },
  quickTagGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 },
  quickTagButton: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 14, borderRadius: 14, border: "1.5px solid #d9d2c5", background: "#ebe5d9", cursor: "pointer", fontSize: 13 },
  ragRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 },
  ragButton: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "16px 6px", borderRadius: 14, border: "2px solid", background: "white", cursor: "pointer", fontSize: 12, fontWeight: 600 },
  freeTextRow: { display: "flex", gap: 8, marginBottom: 8 },
  freeTextInput: { flex: 1, padding: 12, borderRadius: 10, border: "1.5px solid #d9d2c5", boxSizing: "border-box" },
  micButton: { padding: "0 14px", borderRadius: 10, border: "1.5px solid #d9d2c5", background: "#ebe5d9", cursor: "pointer", fontSize: 18 },
  micButtonActive: { background: "#c47b7b", color: "white" },
  savedFlash: { color: "#4e7a60", fontWeight: 600, marginBottom: 10 },
  recentList: { marginTop: 8 },
  recentItem: { fontSize: 13, padding: "6px 0", borderBottom: "1px solid #d9d2c5" },
  recentDate: { color: "#7a7068", marginRight: 6 },
};
