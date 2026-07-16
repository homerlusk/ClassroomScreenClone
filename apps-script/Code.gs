/**
 * Teacher Dashboard API — backed by a Google Sheet.
 *
 * SETUP
 * 1. Create a new Google Sheet (this will be your class's database).
 * 2. Extensions -> Apps Script. Delete any starter code, paste this whole file in.
 * 3. Deploy -> New deployment -> type: Web app.
 *      Execute as: Me
 *      Who has access: Anyone
 *    (This does NOT make your data public — it just means no Google login prompt
 *    interrupts fetch() calls from your app. The URL itself is your secret; anyone
 *    without it cannot reach your sheet. Don't post the URL publicly.)
 * 4. Copy the Web app URL it gives you — that's the value you paste into the
 *    "Teacher API URL" field on the /teacher page and in the classroom screen settings.
 * 5. Re-run "Deploy -> Manage deployments -> Edit -> New version" any time you
 *    change this file, or your URL's behaviour won't update.
 * 6. This version can create Google Docs (for report export), which needs a
 *    new permission scope. Redeploying does NOT trigger the permission
 *    prompt by itself — after pasting this code in, select
 *    "authorizeDocsAccess" in the function dropdown (top toolbar, next to
 *    Run) and click Run once. Approve the permission prompt that appears
 *    (Advanced -> Go to [project] (unsafe) is expected for your own script).
 *    It creates a test doc you can delete afterward — that's the only way
 *    to grant the scope the web app needs for report export to work.
 *
 * SHEETS CREATED AUTOMATICALLY (on first request): Notes, Intentions, Students, AppConfig
 *
 * OPTIONAL — "ClassList" tab: create this one yourself (it's NOT auto-created,
 *   since it's meant for you to hand-edit). Column A: one student name per
 *   row. Column B (optional): pronoun — he, she, or they. A header row is
 *   fine and gets skipped automatically. The app can then import it into the
 *   roster on demand ("Import from Class List" in the Roster widget) — new
 *   names get added, and pronouns sync for everyone (including students
 *   already on the roster), but present/absent status is never touched by
 *   import, since that's managed day-to-day in the app. This tab is never
 *   written to by the app, only read, so your edits there are always safe.
 */

const SHEET_NOTES = "Notes";
const SHEET_INTENTIONS = "Intentions";
const SHEET_STUDENTS = "Students";
const SHEET_CONFIG = "AppConfig";

const NOTES_HEADERS = ["id", "createdAt", "date", "week", "studentName", "subject", "unitTitle", "learningIntention", "tags", "text"];
const INTENTIONS_HEADERS = ["subject", "centralIdea", "loi1", "loi2", "loi3", "learningObjective", "updatedAt"];
const STUDENTS_HEADERS = ["name", "present", "pronoun", "updatedAt"];
// Generic key-value backup store — one row per key, value is a JSON string the
// client serializes/parses itself. Used to back up timetable, theme presets,
// and report drafts so they survive a cleared browser or a new device.
const CONFIG_HEADERS = ["key", "value", "updatedAt"];

function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function sheetToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(cell => cell !== ""))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === "notes") {
      const sheet = getOrCreateSheet_(SHEET_NOTES, NOTES_HEADERS);
      let notes = sheetToObjects_(sheet);
      if (e.parameter.studentName) {
        notes = notes.filter(n => n.studentName === e.parameter.studentName);
      }
      return jsonResponse_({ ok: true, notes });
    }
    if (action === "intentions") {
      const sheet = getOrCreateSheet_(SHEET_INTENTIONS, INTENTIONS_HEADERS);
      const rows = sheetToObjects_(sheet);
      const bySubject = {};
      rows.forEach(r => { bySubject[r.subject] = r; });
      return jsonResponse_({ ok: true, intentions: bySubject });
    }
    if (action === "students") {
      const sheet = getOrCreateSheet_(SHEET_STUDENTS, STUDENTS_HEADERS);
      const students = sheetToObjects_(sheet);
      return jsonResponse_({ ok: true, students });
    }
    if (action === "activeSubject") {
      // What's currently the headline lesson on the classroom screen. Stored as a
      // script property (not a sheet row) since it's a single always-changing value,
      // not a log — this is how the /teacher page can auto-follow the big screen.
      const props = PropertiesService.getScriptProperties();
      return jsonResponse_({
        ok: true,
        subject: props.getProperty("activeSubject") || "",
        updatedAt: props.getProperty("activeSubjectUpdatedAt") || "",
      });
    }
    if (action === "appConfig") {
      const sheet = getOrCreateSheet_(SHEET_CONFIG, CONFIG_HEADERS);
      const rows = sheetToObjects_(sheet);
      const config = {};
      rows.forEach(r => { config[r.key] = r.value; });
      return jsonResponse_({ ok: true, config });
    }
    if (action === "classList") {
      // Deliberately read-only, and a SEPARATE tab from "Students" — the app
      // fully overwrites Students on every roster change, so a tab meant for
      // the teacher to hand-edit needs to be somewhere the app never writes to,
      // or edits would just get wiped out on the next sync.
      // Column A: name. Column B (optional): pronoun — he / she / they.
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName("ClassList");
      if (!sheet || sheet.getLastRow() === 0) {
        return jsonResponse_({ ok: true, students: [] });
      }
      const values = sheet.getRange(1, 1, sheet.getLastRow(), 2).getValues();
      const skipWords = ["name", "names", "student", "students", "class list", "classlist"];
      const validPronouns = ["he", "she", "they"];
      const students = values
        .map(row => ({
          name: String(row[0] || "").trim(),
          pronoun: String(row[1] || "").trim().toLowerCase(),
        }))
        .filter(s => s.name && !skipWords.includes(s.name.toLowerCase()))
        .map(s => ({ name: s.name, pronoun: validPronouns.indexOf(s.pronoun) > -1 ? s.pronoun : "" }));
      return jsonResponse_({ ok: true, students });
    }
    return jsonResponse_({ ok: false, error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const payload = body.payload || {};

    if (action === "addNote") {
      const sheet = getOrCreateSheet_(SHEET_NOTES, NOTES_HEADERS);
      const id = Utilities.getUuid();
      const createdAt = new Date().toISOString();
      const row = [
        id, createdAt,
        payload.date || "", payload.week || "",
        payload.studentName || "", payload.subject || "",
        payload.unitTitle || "", payload.learningIntention || "",
        (payload.tags || ""), payload.text || ""
      ];
      // Setting the range to plain-text format BEFORE writing stops Sheets from
      // auto-detecting the "date" column as a real date and silently converting
      // it (which can shift the value by a day depending on the sheet's
      // timezone). appendRow alone doesn't give this protection.
      const nextRow = sheet.getLastRow() + 1;
      const range = sheet.getRange(nextRow, 1, 1, row.length);
      range.setNumberFormat("@");
      range.setValues([row]);
      return jsonResponse_({ ok: true, id, createdAt });
    }

    if (action === "updateNote") {
      const sheet = getOrCreateSheet_(SHEET_NOTES, NOTES_HEADERS);
      const values = sheet.getDataRange().getValues();
      const idCol = 0;
      for (let r = 1; r < values.length; r++) {
        if (values[r][idCol] === payload.id) {
          if (payload.text !== undefined) sheet.getRange(r + 1, NOTES_HEADERS.indexOf("text") + 1).setValue(payload.text);
          if (payload.tags !== undefined) sheet.getRange(r + 1, NOTES_HEADERS.indexOf("tags") + 1).setValue(payload.tags.join(","));
          return jsonResponse_({ ok: true });
        }
      }
      return jsonResponse_({ ok: false, error: "Note not found" });
    }

    if (action === "deleteNote") {
      const sheet = getOrCreateSheet_(SHEET_NOTES, NOTES_HEADERS);
      const values = sheet.getDataRange().getValues();
      for (let r = 1; r < values.length; r++) {
        if (values[r][0] === payload.id) {
          sheet.deleteRow(r + 1);
          return jsonResponse_({ ok: true });
        }
      }
      return jsonResponse_({ ok: false, error: "Note not found" });
    }

    if (action === "setIntentions") {
      // Full replace each push (same pattern as setStudents below) — otherwise
      // subjects removed from today's timetable never disappear from the phone,
      // since the old merge-only logic never deleted a row.
      const sheet = getOrCreateSheet_(SHEET_INTENTIONS, INTENTIONS_HEADERS);
      sheet.clearContents();
      sheet.appendRow(INTENTIONS_HEADERS);
      const now = new Date().toISOString();
      Object.keys(payload).forEach(subject => {
        const data = payload[subject];
        sheet.appendRow([subject, data.centralIdea || "", data.loi1 || "", data.loi2 || "", data.loi3 || "", data.learningObjective || "", now]);
      });
      return jsonResponse_({ ok: true });
    }

    if (action === "setStudents") {
      const sheet = getOrCreateSheet_(SHEET_STUDENTS, STUDENTS_HEADERS);
      sheet.clearContents();
      sheet.appendRow(STUDENTS_HEADERS);
      const now = new Date().toISOString();
      (payload.students || []).forEach(s => {
        sheet.appendRow([s.name, s.present, s.pronoun || "they", now]);
      });
      return jsonResponse_({ ok: true });
    }

    if (action === "setActiveSubject") {
      const props = PropertiesService.getScriptProperties();
      props.setProperty("activeSubject", payload.subject || "");
      props.setProperty("activeSubjectUpdatedAt", new Date().toISOString());
      return jsonResponse_({ ok: true });
    }

    if (action === "setAppConfig") {
      // Upsert by key — unlike setStudents/setIntentions this does NOT clear
      // the whole sheet, since different config keys (timetable, presets,
      // report data) get pushed independently and shouldn't wipe each other.
      const sheet = getOrCreateSheet_(SHEET_CONFIG, CONFIG_HEADERS);
      const values = sheet.getDataRange().getValues();
      const now = new Date().toISOString();
      let foundRow = -1;
      for (let r = 1; r < values.length; r++) {
        if (values[r][0] === payload.key) { foundRow = r + 1; break; }
      }
      const row = [payload.key, payload.value || "", now];
      if (foundRow > -1) {
        sheet.getRange(foundRow, 1, 1, row.length).setValues([row]);
      } else {
        sheet.appendRow(row);
      }
      return jsonResponse_({ ok: true });
    }

    if (action === "exportReportsToDoc") {
      // Builds a formatted Google Doc from report content assembled client-side
      // (the client already has all the drafts/achievement/growth data in
      // memory) — one heading per student, one sub-section per subject.
      const title = payload.title || ("Reports — " + new Date().toISOString().slice(0, 10));
      const doc = DocumentApp.create(title);
      const body = doc.getBody();
      body.setMarginTop(36).setMarginBottom(36).setMarginLeft(54).setMarginRight(54);

      (payload.students || []).forEach((student, i) => {
        if (i > 0) body.appendPageBreak();
        body.appendParagraph(student.name).setHeading(DocumentApp.ParagraphHeading.TITLE);
        (student.sections || []).forEach(section => {
          body.appendParagraph(section.label).setHeading(DocumentApp.ParagraphHeading.HEADING2);
          body.appendParagraph(section.text || "(No content yet)");
        });
      });

      doc.saveAndClose();
      const url = doc.getUrl();
      return jsonResponse_({ ok: true, url, id: doc.getId() });
    }

    return jsonResponse_({ ok: false, error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Run this ONCE manually from the Apps Script editor — select
 * "authorizeDocsAccess" in the dropdown next to the Run button (top toolbar),
 * then click Run. This is the only way to trigger Google's permission prompt
 * for Docs access; redeploying the web app does NOT do this automatically,
 * since the deployed version keeps using whatever scopes were already granted
 * until something actually exercises the new one from inside the editor.
 * Safe to delete the "DELETE ME" doc it creates afterward — this function's
 * only purpose is to force the prompt once.
 */
function authorizeDocsAccess() {
  const doc = DocumentApp.create("DELETE ME - permission test");
  Logger.log("Created " + doc.getUrl() + " — you can delete this file now.");
}