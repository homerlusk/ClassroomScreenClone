import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getApiUrl, setApiUrl, clearApiUrl, fetchIntentions, fetchStudents, fetchNotes,
  fetchActiveSubject, addNote, type Intention, type Note,
} from "../services/notes";

const RAG_TAGS = [
  { emoji: "🔴", label: "NS", color: "#c0433f" },
  { emoji: "🟡", label: "AE", color: "#c99a2e" },
  { emoji: "🟢", label: "ME", color: "#3f8a52" },
  { emoji: "🔵", label: "EE", color: "#3d6fa5" },
];

const QUICK_TAGS = [
  { emoji: "⭐", label: "Independent" },
  { emoji: "🤝", label: "Helpful" },
  { emoji: "💬", label: "Explained thinking" },
  { emoji: "📚", label: "Excellent effort" },
  { emoji: "💫", label: "Reflective" },
  { emoji: "👥", label: "Contributes to the team" },
];

// Quick-pick reasons shown after tapping a grade, so most observations need a
// tap instead of typing. "default" applies to any subject without its own
// entry below — add more subject-specific banks here the same way "maths" is.
const REASON_OPTIONS: Record<string, Record<string, string[]>> = {
  default: {
    NS: [
      "Doesn't grasp the concept yet",
      "Confused by the instructions",
      "Needs one-on-one support",
      "Not engaging with the task",
      "Struggling to focus",
      "Not contributing to group work",
    ],
    AE: [
      "Understands with support only",
      "Inconsistent — right sometimes, not others",
      "Needs more practice to solidify",
      "Hesitant to try independently",
      "Partial understanding of the concept",
      "Improving, but not yet reliable",
    ],
    ME: [
      "Solid, accurate understanding",
      "Works well independently",
      "Applies the concept correctly",
      "Collaborates well with peers",
      "Consistent effort",
      "Positive, engaged attitude",
    ],
    EE: [
      "Deep, flexible understanding",
      "Helps or mentors other students",
      "Applies the concept in new situations",
      "Shows initiative beyond the task",
      "Highly independent",
      "Overconfident — may skip steps or rush",
    ],
  },
  maths: {
    NS: [
      "Doesn't understand the operation",
      "Struggles with number facts",
      "Can't apply the strategy independently",
      "Confuses similar operations (e.g. + and −)",
      "Struggles to explain reasoning",
      "Careless calculation errors",
    ],
    AE: [
      "Right process, wrong answer",
      "Needs manipulatives or visual support",
      "Inconsistent with multi-step problems",
      "Can solve with prompting only",
      "Understands but slow to apply",
      "Mixes up steps in the method",
    ],
    ME: [
      "Solves accurately and independently",
      "Applies the correct strategy",
      "Explains reasoning clearly",
      "Checks own work",
      "Solves multi-step problems reliably",
      "Uses efficient strategies",
    ],
    EE: [
      "Solves in multiple ways",
      "Explains reasoning to others",
      "Applies concept to real-world problems",
      "Extends beyond the task independently",
      "Spots patterns and makes connections",
      "Moves quickly — check depth over speed",
    ],
  },
  sel: {
    NS: [
      "Disrupts the learning of others",
      "Struggles to follow classroom routines",
      "Difficulty managing frustration or anger",
      "Excludes or is unkind to peers",
      "Refuses to participate or engage",
      "Needs constant redirection to stay on task",
    ],
    AE: [
      "Follows routines with reminders",
      "Beginning to manage frustration, still needs support",
      "Occasionally struggles with sharing or turn-taking",
      "Inconsistent focus during independent work",
      "Working on accepting feedback gracefully",
      "Sometimes interrupts or talks out of turn",
    ],
    ME: [
      "Follows classroom routines independently",
      "Manages emotions appropriately",
      "Works well both independently and in groups",
      "Shows kindness and respect to peers",
      "Takes responsibility for own actions",
      "Stays on task with minimal reminders",
    ],
    EE: [
      "Models excellent behavior for peers",
      "Shows strong self-regulation under pressure",
      "Actively includes and supports classmates",
      "Takes initiative to help resolve conflicts",
      "Demonstrates leadership in group settings",
      "Reflects thoughtfully on own behavior and growth",
    ],
  },
};

function reasonsFor(subject: string, grade: string): string[] {
  return REASON_OPTIONS[subject]?.[grade] || REASON_OPTIONS.default[grade] || [];
}

// Only these ever need observations logged — other lesson types (art, PE,
// assembly, recess, etc.) can be active on the classroom screen without ever
// cluttering the phone's subject tabs.
const LOGGABLE_SUBJECTS = ["literacy", "spelling", "story", "maths", "uoi"];

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

// ── OFFLINE QUEUE ──
// If a save fails (dropped wifi, dead classroom dead-zone, etc.) the observation
// is queued locally instead of just being lost. It's retried automatically
// whenever the browser comes back online or the regular 20s poll fires.
type QueuedNote = {
  date: string; week: string; studentName: string; subject: string;
  unitTitle: string; learningIntention: string; tags: string[]; text: string;
  queuedAt: string;
};

function getQueue(): QueuedNote[] {
  try { return JSON.parse(localStorage.getItem("pendingNotesQueue") || "[]"); } catch { return []; }
}
function setQueueStorage(q: QueuedNote[]) {
  localStorage.setItem("pendingNotesQueue", JSON.stringify(q));
}

export default function Teacher() {
  const [apiUrlInput, setApiUrlInput] = useState(getApiUrl());
  const [connected, setConnected] = useState(!!getApiUrl());
  const [connectionError, setConnectionError] = useState("");

  const [intentions, setIntentions] = useState<Record<string, Intention>>({});
  const [students, setStudents] = useState<{ name: string; present: boolean }[]>([]);
  const [subject, setSubject] = useState<string>("");
  const [remoteSubject, setRemoteSubject] = useState<string>("");
  const lastSyncedRemoteRef = useRef<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [freeText, setFreeText] = useState("");
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [lastSavedTag, setLastSavedTag] = useState<string | null>(null);
  // Which grade's reason picker is currently expanded (null = none open).
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null);
  const [showAbsent, setShowAbsent] = useState(false);
  const [showMoreTags, setShowMoreTags] = useState(false);
  const [tagHintDismissed, setTagHintDismissed] = useState(() => localStorage.getItem("tagHintDismissed") === "1");
  const [showRecent, setShowRecent] = useState(false);
  const [queueCount, setQueueCount] = useState(() => getQueue().length);
  const [queuedFlash, setQueuedFlash] = useState(false);
  const [flushing, setFlushing] = useState(false);

  async function flushQueue() {
    const queue = getQueue();
    if (queue.length === 0 || flushing) return;
    setFlushing(true);
    const remaining: QueuedNote[] = [];
    for (const item of queue) {
      try {
        const { queuedAt, ...payload } = item;
        await addNote(payload);
      } catch {
        remaining.push(item);
      }
    }
    setQueueStorage(remaining);
    setQueueCount(remaining.length);
    setFlushing(false);
  }
  // Which reason chip was just picked, kept visible briefly so the save is
  // unmistakable before the panel closes — closing instantly made it unclear
  // whether the tap actually registered.
  const [justSavedReason, setJustSavedReason] = useState<string | null>(null);
  // Names of students who already have a note logged for today, in the
  // currently active subject — used to grey out the roster so it's easy to
  // see at a glance who hasn't been observed yet.
  const [allNotesCache, setAllNotesCache] = useState<Note[]>([]);

  // Which present students already have a note today, in the current subject.
  const observedToday = useMemo(() => {
    if (!subject) return new Set<string>();
    const todayStr = new Date().toISOString().slice(0, 10);
    return new Set(
      allNotesCache
        .filter(n => n.subject === subject && n.date?.slice(0, 10) === todayStr)
        .map(n => n.studentName)
    );
  }, [allNotesCache, subject]);

  // Days since each student's most recent note, across every subject — not
  // just today. null means "never observed at all", which is more urgent
  // than any specific day count.
  const daysSinceLastObserved = useMemo(() => {
    const map: Record<string, number | null> = {};
    students.forEach(s => { map[s.name] = null; });
    const todayMs = new Date(new Date().toISOString().slice(0, 10)).getTime();
    allNotesCache.forEach(n => {
      const dateStr = n.date?.slice(0, 10);
      if (!dateStr) return;
      const noteMs = new Date(dateStr).getTime();
      if (isNaN(noteMs)) return;
      const days = Math.round((todayMs - noteMs) / 86400000);
      const existing = map[n.studentName];
      if (existing === undefined || existing === null || days < existing) {
        map[n.studentName] = days;
      }
    });
    return map;
  }, [allNotesCache, students]);

  // Present students who haven't been observed in a while (3+ days, or never)
  // — ranked worst-first so it's obvious who to prioritize next.
  const needsAttention = useMemo(() => {
    return students
      .filter(s => s.present)
      .map(s => ({ name: s.name, days: daysSinceLastObserved[s.name] ?? null }))
      .filter(s => s.days === null || s.days >= 3)
      .sort((a, b) => {
        if (a.days === null && b.days === null) return 0;
        if (a.days === null) return -1;
        if (b.days === null) return 1;
        return b.days - a.days;
      });
  }, [students, daysSinceLastObserved]);
  const [showNeedsAttention, setShowNeedsAttention] = useState(false);

  const { start: startListening, listening, supported: micSupported } = useSpeechToText(
    (text) => setFreeText((prev) => (prev ? `${prev} ${text}` : text))
  );

  async function refreshAll() {
    try {
      const [intentionsData, studentsData, activeSubjectData] = await Promise.all([
        fetchIntentions(),
        fetchStudents(),
        fetchActiveSubject().catch(() => ({ subject: "", updatedAt: "" })),
      ]);
      setIntentions(intentionsData);
      setStudents(studentsData);
      setRemoteSubject(activeSubjectData.subject);
      if (
        activeSubjectData.subject &&
        activeSubjectData.subject !== lastSyncedRemoteRef.current &&
        intentionsData[activeSubjectData.subject] &&
        LOGGABLE_SUBJECTS.includes(activeSubjectData.subject)
      ) {
        lastSyncedRemoteRef.current = activeSubjectData.subject;
        setSubject(activeSubjectData.subject);
      }
      setConnected(true);
      setConnectionError("");
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : "Could not connect");
    }
    // Kept separate from the block above so a notes-fetch hiccup never blocks
    // the rest of refreshAll (subjects/roster/sync) from updating.
    fetchNotes().then(setAllNotesCache).catch(() => {});
  }

  useEffect(() => {
    if (!getApiUrl()) return;
    refreshAll();
    flushQueue();

    const interval = setInterval(() => { refreshAll(); flushQueue(); }, 20000);

    const onVisible = () => { if (document.visibilityState === "visible") { refreshAll(); flushQueue(); } };
    document.addEventListener("visibilitychange", onVisible);

    // The browser fires this the moment connectivity actually comes back —
    // no need to wait for the next 20s poll to retry queued notes.
    window.addEventListener("online", flushQueue);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", flushQueue);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchNotes(selectedStudent).then((notes) => {
        setRecentNotes(notes.slice(-5).reverse());
      }).catch(() => {});
    }
  }, [selectedStudent, savedFlash]);

  useEffect(() => {
    if (!getApiUrl()) { setAllNotesCache([]); return; }
    fetchNotes()
      .then(setAllNotesCache)
      .catch((err) => {
        console.error("Failed to fetch notes cache:", err);
        setConnectionError("Couldn't load notes: " + (err instanceof Error ? err.message : "unknown error"));
      });
  }, [savedFlash, subject]);

  useEffect(() => {
    setExpandedGrade(null);
    setShowRecent(false);
  }, [selectedStudent, subject]);

  const currentIntention = intentions[subject];

  const learningIntentionSummary = useMemo(() => {
    if (!currentIntention) return "";
    return [currentIntention.learningObjective, currentIntention.loi1, currentIntention.loi2, currentIntention.loi3]
      .filter(Boolean).join(" · ");
  }, [currentIntention]);

  async function saveObservation(text: string, tag?: string) {
    if (!selectedStudent) {
      setConnectionError("No student selected — tap a student chip above before logging an observation.");
      return;
    }
    if (!text.trim()) {
      setConnectionError("Nothing to save — type a note or pick a tag with text attached.");
      return;
    }
    setSaving(true);
    const now = new Date();
    const payload = {
      date: now.toISOString().slice(0, 10),
      week: isoWeek(now),
      studentName: selectedStudent,
      subject,
      unitTitle: currentIntention?.centralIdea || "",
      learningIntention: learningIntentionSummary,
      tags: tag ? [tag] : [],
      text,
    };
    try {
      await addNote(payload);
      setFreeText("");
      setSavedFlash(true);
      if (tag) {
        setLastSavedTag(tag);
        setTimeout(() => setLastSavedTag(null), 900);
      }
      // Bounce back to the roster after the confirmation has had time to
      // register — keeps you moving through the class instead of staying
      // "parked" on one student until you manually pick the next one.
      setTimeout(() => {
        setSavedFlash(false);
        setSelectedStudent("");
      }, 1200);
    } catch (err) {
      // Don't just lose the observation — queue it locally and keep going.
      // From the teacher's point of view this IS captured, it just hasn't
      // reached the sheet yet, so the flow continues as if it succeeded.
      const queue = getQueue();
      queue.push({ ...payload, queuedAt: now.toISOString() });
      setQueueStorage(queue);
      setQueueCount(queue.length);
      setFreeText("");
      setQueuedFlash(true);
      if (tag) {
        setLastSavedTag(tag);
        setTimeout(() => setLastSavedTag(null), 900);
      }
      setTimeout(() => {
        setQueuedFlash(false);
        setSelectedStudent("");
      }, 1800);
    } finally {
      setSaving(false);
    }
  }

  function pickReason(reasonText: string) {
    const grade = expandedGrade;
    if (!grade) return;
    const combined = freeText.trim() ? `${freeText.trim()} — ${reasonText}` : reasonText;
    saveObservation(combined, grade);
    setJustSavedReason(reasonText);
    setTimeout(() => {
      setExpandedGrade(null);
      setJustSavedReason(null);
    }, 900);
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
        <div style={{ display: "flex", gap: 12 }}>
          <button style={styles.linkButton} onClick={refreshAll}>Refresh</button>
          <button style={styles.linkButton} onClick={disconnect}>Change API URL</button>
        </div>
      </div>

      {queueCount > 0 && (
        <div style={styles.queueBadge}>
          <span>📡 {queueCount} note{queueCount === 1 ? "" : "s"} waiting to sync</span>
          <button style={styles.linkButtonInline} onClick={flushQueue} disabled={flushing}>
            {flushing ? "Syncing…" : "Retry now"}
          </button>
        </div>
      )}

      {connectionError && (
        <div style={styles.errorBox}>
          <p style={styles.error}>{connectionError}</p>
          <button style={styles.linkButton} onClick={disconnect}>Re-enter the API URL</button>
          <button style={styles.linkButton} onClick={refreshAll}>Try again</button>
        </div>
      )}

      <div style={styles.tabRow}>
        {Object.keys(intentions).filter(s => LOGGABLE_SUBJECTS.includes(s)).map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            style={{ ...styles.tab, ...(subject === s ? styles.tabActive : {}) }}
          >
            {intentions[s]?.label || s}
          </button>
        ))}
        {/* Always present, regardless of what's showing on the classroom screen —
            behavior observations aren't tied to a specific lesson being displayed. */}
        <button
          onClick={() => setSubject("sel")}
          style={{ ...styles.tab, ...(subject === "sel" ? styles.tabActive : {}) }}
        >
          🧠 SEL
        </button>
      </div>

      {remoteSubject && intentions[remoteSubject] && LOGGABLE_SUBJECTS.includes(remoteSubject) && (
        <div style={styles.syncRow}>
          <span>🖥️ Screen: <b>{intentions[remoteSubject]?.label || remoteSubject}</b></span>
          {subject !== remoteSubject && (
            <button
              onClick={() => { lastSyncedRemoteRef.current = remoteSubject; setSubject(remoteSubject); }}
              style={styles.syncButton}
            >
              ↺ Follow screen
            </button>
          )}
        </div>
      )}

      {!subject && !remoteSubject && Object.keys(intentions).length > 0 && (
        <div style={styles.subjectPrompt}>
          👆 Tap a subject above before logging observations — the classroom screen hasn't reported an active lesson yet.
        </div>
      )}

      {currentIntention && (
        <div style={styles.intentionBanner}>
          <div style={styles.intentionLabel}>Linked to what's on screen</div>
          <div>{learningIntentionSummary || "No learning intention set for this subject yet."}</div>
        </div>
      )}

      {subject && (
      <>
      {students.length > 0 && (
        <div style={styles.observedCount}>
          👀 {observedToday.size} of {students.filter(s => s.present).length} observed today in this subject
          {students.some(s => !s.present) && (
            <button style={styles.linkButtonInline} onClick={() => setShowAbsent(a => !a)}>
              {showAbsent ? "Hide" : "Show"} absent ({students.filter(s => !s.present).length})
            </button>
          )}
        </div>
      )}

      {needsAttention.length > 0 && (
        <div style={styles.attentionBox}>
          <button style={styles.attentionToggle} onClick={() => setShowNeedsAttention(v => !v)}>
            {showNeedsAttention ? "▲" : "▼"} ⚠️ {needsAttention.length} {needsAttention.length === 1 ? "student needs" : "students need"} attention
          </button>
          {showNeedsAttention && (
            <div style={styles.attentionList}>
              {needsAttention.map((s) => (
                <button key={s.name} style={styles.attentionRow} onClick={() => { setSelectedStudent(s.name); setShowNeedsAttention(false); }}>
                  <span>{s.name}</span>
                  <span style={styles.attentionDays}>{s.days === null ? "Never observed" : `${s.days} day${s.days === 1 ? "" : "s"} ago`}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div style={styles.studentGrid}>
        {students.filter(s => s.present || showAbsent).map((s) => {
          const isObserved = observedToday.has(s.name);
          const isActive = selectedStudent === s.name;
          return (
            <button
              key={s.name}
              onClick={() => setSelectedStudent(s.name)}
              style={{
                ...styles.studentChip,
                ...(!s.present ? styles.studentChipAbsent : {}),
                ...(isObserved && !isActive ? styles.studentChipObserved : {}),
                ...(isActive ? styles.studentChipActive : {}),
              }}
            >
              {isObserved && !isActive ? "✓ " : ""}{s.name}{!s.present ? " (absent)" : ""}
            </button>
          );
        })}
      </div>
      </>
      )}

      {selectedStudent && (
        <>
          <div style={{ ...styles.savedBanner, color: queuedFlash ? "#b8883a" : "#4e7a60" }}>
            {savedFlash ? "✓ Saved" : queuedFlash ? "📡 Saved offline — will sync automatically" : "\u00A0"}
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

          {!tagHintDismissed && (
            <div style={styles.tagHint}>
              Tap a grade below to pick a quick reason — or add your own note above first, then tap a grade to attach it.
              <button onClick={() => { localStorage.setItem("tagHintDismissed", "1"); setTagHintDismissed(true); }} style={styles.tagHintDismiss}>
                ✕
              </button>
            </div>
          )}

          <div style={styles.ragRow}>
            {RAG_TAGS.map((t) => {
              const isJustSaved = lastSavedTag === t.label;
              const isExpanded = expandedGrade === t.label;
              return (
                <button
                  key={t.label}
                  disabled={saving}
                  style={{
                    ...styles.ragButton,
                    borderColor: t.color,
                    color: isJustSaved ? "white" : t.color,
                    background: isJustSaved ? t.color : isExpanded ? "#f2ede4" : "white",
                    transform: isJustSaved ? "scale(0.96)" : "scale(1)",
                    boxShadow: isExpanded ? `0 0 0 2px ${t.color}` : "none",
                  }}
                  onClick={() => setExpandedGrade(isExpanded ? null : t.label)}
                >
                  <span style={{ fontSize: 26 }}>{isJustSaved ? "✓" : t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {expandedGrade && (
            <div style={styles.reasonPanel}>
              <div style={styles.reasonPanelHeader}>
                <span style={{ ...styles.intentionLabel, ...(justSavedReason ? { color: "#4e7a60", fontWeight: 700 } : {}) }}>
                  {justSavedReason
                    ? "✓ Saved"
                    : `${expandedGrade} reason${freeText.trim() ? " (will combine with your note above)" : ""}`}
                </span>
                {!justSavedReason && (
                  <button style={styles.linkButton} onClick={() => setExpandedGrade(null)}>Cancel</button>
                )}
              </div>
              <div style={styles.reasonGrid}>
                {reasonsFor(subject, expandedGrade).map((reason) => {
                  const isJustPicked = justSavedReason === reason;
                  return (
                    <button
                      key={reason}
                      disabled={saving || !!justSavedReason}
                      style={{
                        ...styles.reasonChip,
                        ...(isJustPicked ? { background: "#4e7a60", color: "white", borderColor: "#4e7a60" } : {}),
                      }}
                      onClick={() => pickReason(reason)}
                    >
                      {isJustPicked ? "✓ " : ""}{reason}
                    </button>
                  );
                })}
              </div>
              {!justSavedReason && (
                <button
                  style={styles.reasonSkip}
                  disabled={saving}
                  onClick={() => pickReason(expandedGrade)}
                >
                  None of these — just log "{expandedGrade}"
                </button>
              )}
            </div>
          )}

          <button style={styles.moreTagsToggle} onClick={() => setShowMoreTags(v => !v)}>
            {showMoreTags ? "▲ Fewer tags" : "▼ More tags"}
          </button>
          {showMoreTags && (
            <div style={styles.quickTagGrid}>
              {QUICK_TAGS.map((t) => {
                const isJustSaved = lastSavedTag === t.label;
                return (
                  <button
                    key={t.label}
                    disabled={saving}
                    style={{
                      ...styles.quickTagButton,
                      background: isJustSaved ? "#4e7a60" : "#ebe5d9",
                      color: isJustSaved ? "white" : "#2c2825",
                      transform: isJustSaved ? "scale(0.96)" : "scale(1)",
                    }}
                    onClick={() => saveObservation(freeText.trim() || t.label, t.label)}
                  >
                    <span style={{ fontSize: 22 }}>{isJustSaved ? "✓" : t.emoji}</span>
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {recentNotes.length > 0 && (
            <div style={styles.recentList}>
              <button style={styles.moreTagsToggle} onClick={() => setShowRecent(v => !v)}>
                {showRecent ? "▲ Hide recent" : `▼ Show recent for ${selectedStudent} (${recentNotes.length})`}
              </button>
              {showRecent && recentNotes.map((n) => (
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
  page: { maxWidth: 480, margin: "0 auto", padding: 16, fontFamily: "'Lexend', 'Century Gothic', 'Trebuchet MS', Arial, sans-serif", color: "#2c2825" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 },
  linkButton: { background: "none", border: "none", color: "#3d5a80", fontSize: 13, textDecoration: "underline", cursor: "pointer", padding: 4 },
  errorBox: { background: "#f6e6e6", borderRadius: 10, padding: 10, marginBottom: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 },
  queueBadge: { background: "#f6e6c9", border: "1.5px solid #c99a2e", borderRadius: 10, padding: "8px 10px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 12.5, color: "#5a4415", fontWeight: 600 },
  h1: { fontSize: 22, marginBottom: 8 },
  muted: { color: "#7a7068", fontSize: 14 },
  input: { width: "100%", padding: 12, borderRadius: 10, border: "1.5px solid #d9d2c5", marginBottom: 12, boxSizing: "border-box" },
  primaryButton: { padding: "12px 18px", borderRadius: 10, border: "none", background: "#4e7a60", color: "white", fontWeight: 600, cursor: "pointer" },
  error: { color: "#9e4f4f", fontSize: 13 },
  tabRow: { display: "flex", gap: 8, overflowX: "auto", marginBottom: 12 },
  tab: { padding: "8px 14px", borderRadius: 20, border: "1.5px solid #d9d2c5", background: "#ebe5d9", whiteSpace: "nowrap", cursor: "pointer", textTransform: "capitalize" },
  tabActive: { background: "#4e7a60", color: "white", borderColor: "#4e7a60" },
  intentionBanner: { background: "#e8e0cf", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 14 },
  subjectPrompt: { background: "#f6e6c9", border: "1.5px solid #c99a2e", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13.5, fontWeight: 600, color: "#5a4415" },
  syncRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "#eef1ea", borderRadius: 8, padding: "6px 10px", marginBottom: 12, fontSize: 12.5, color: "#4a5a4e" },
  syncButton: { background: "#4e7a60", color: "white", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" },
  tagHint: { fontSize: 11.5, color: "#7a7068", fontStyle: "italic", marginBottom: 8, textAlign: "center", position: "relative", padding: "0 20px" },
  tagHintDismiss: { position: "absolute", right: 0, top: -2, background: "none", border: "none", color: "#7a7068", fontSize: 13, cursor: "pointer", padding: 4 },
  intentionLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "#7a7068", marginBottom: 4 },
  studentGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  studentChip: { padding: "10px 14px", borderRadius: 20, border: "1.5px solid #d9d2c5", background: "#ebe5d9", color: "#2c2825", cursor: "pointer" },
  studentChipActive: { background: "#3d5a80", color: "white", borderColor: "#3d5a80" },
  studentChipObserved: { background: "#e3ddd0", borderColor: "#d3c9b8", color: "#5a5248" },
  studentChipAbsent: { background: "#f2ede4", borderStyle: "dashed", color: "#7a7068", fontStyle: "italic" },
  observedCount: { fontSize: 11.5, color: "#7a7068", marginBottom: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  linkButtonInline: { background: "none", border: "none", color: "#3d5a80", fontSize: 11, textDecoration: "underline", cursor: "pointer", padding: 0 },
  moreTagsToggle: { background: "none", border: "none", color: "#7a7068", fontSize: 12, cursor: "pointer", padding: "4px 0", marginBottom: 6, textAlign: "left" },
  attentionBox: { background: "#f6e6c9", border: "1.5px solid #c99a2e", borderRadius: 10, padding: "8px 10px", marginBottom: 10 },
  attentionToggle: { background: "none", border: "none", color: "#5a4415", fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0, width: "100%", textAlign: "left" },
  attentionList: { display: "flex", flexDirection: "column", gap: 4, marginTop: 8 },
  attentionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: "1px solid #e6d6a8", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, color: "#2c2825", cursor: "pointer", textAlign: "left" },
  attentionDays: { color: "#9e7a1f", fontSize: 11.5, fontWeight: 600 },
  quickTagGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 },
  quickTagButton: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 14, borderRadius: 14, border: "1.5px solid #d9d2c5", background: "#ebe5d9", cursor: "pointer", fontSize: 13, transition: "all 0.15s ease" },
  ragRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 10 },
  ragButton: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "16px 6px", borderRadius: 14, border: "2px solid", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s ease" },
  reasonPanel: { background: "#fff", border: "1.5px solid #d9d2c5", borderRadius: 14, padding: 12, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 },
  reasonPanelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  reasonGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  reasonChip: { padding: "10px 10px", borderRadius: 10, border: "1.5px solid #d9d2c5", background: "#f2ede4", color: "#2c2825", fontSize: 12.5, textAlign: "left", cursor: "pointer", lineHeight: 1.3 },
  reasonSkip: { padding: "8px 10px", borderRadius: 10, border: "1.5px dashed #d9d2c5", background: "none", color: "#7a7068", fontSize: 12, cursor: "pointer" },
  savedBanner: { textAlign: "center", fontWeight: 600, color: "#4e7a60", fontSize: 14, minHeight: 20, marginBottom: 6 },
  freeTextRow: { display: "flex", gap: 8, marginBottom: 8 },
  freeTextInput: { flex: 1, padding: 12, borderRadius: 10, border: "1.5px solid #d9d2c5", boxSizing: "border-box" },
  micButton: { padding: "0 14px", borderRadius: 10, border: "1.5px solid #d9d2c5", background: "#ebe5d9", cursor: "pointer", fontSize: 18 },
  micButtonActive: { background: "#c47b7b", color: "white" },
  savedFlash: { color: "#4e7a60", fontWeight: 600, marginBottom: 10 },
  recentList: { marginTop: 8 },
  recentItem: { fontSize: 13, padding: "6px 0", borderBottom: "1px solid #d9d2c5" },
  recentDate: { color: "#7a7068", marginRight: 6 },
};
