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
 *
 * SHEETS CREATED AUTOMATICALLY (on first request): Notes, Intentions, Students
 */

const SHEET_NOTES = "Notes";
const SHEET_INTENTIONS = "Intentions";
const SHEET_STUDENTS = "Students";

const NOTES_HEADERS = ["id", "createdAt", "date", "week", "studentName", "subject", "unitTitle", "learningIntention", "tags", "text"];
const INTENTIONS_HEADERS = ["subject", "centralIdea", "loi1", "loi2", "loi3", "learningObjective", "updatedAt"];
const STUDENTS_HEADERS = ["name", "present", "updatedAt"];

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
      sheet.appendRow([
        id, createdAt,
        payload.date || "", payload.week || "",
        payload.studentName || "", payload.subject || "",
        payload.unitTitle || "", payload.learningIntention || "",
        (payload.tags || []).join(","), payload.text || ""
      ]);
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
      const sheet = getOrCreateSheet_(SHEET_INTENTIONS, INTENTIONS_HEADERS);
      const values = sheet.getDataRange().getValues();
      const now = new Date().toISOString();
      Object.keys(payload).forEach(subject => {
        const data = payload[subject];
        let foundRow = -1;
        for (let r = 1; r < values.length; r++) {
          if (values[r][0] === subject) { foundRow = r + 1; break; }
        }
        const row = [subject, data.centralIdea || "", data.loi1 || "", data.loi2 || "", data.loi3 || "", data.learningObjective || "", now];
        if (foundRow > -1) {
          sheet.getRange(foundRow, 1, 1, row.length).setValues([row]);
        } else {
          sheet.appendRow(row);
        }
      });
      return jsonResponse_({ ok: true });
    }

    if (action === "setStudents") {
      const sheet = getOrCreateSheet_(SHEET_STUDENTS, STUDENTS_HEADERS);
      sheet.clearContents();
      sheet.appendRow(STUDENTS_HEADERS);
      const now = new Date().toISOString();
      (payload.students || []).forEach(s => {
        sheet.appendRow([s.name, s.present, now]);
      });
      return jsonResponse_({ ok: true });
    }

    if (action === "setActiveSubject") {
      const props = PropertiesService.getScriptProperties();
      props.setProperty("activeSubject", payload.subject || "");
      props.setProperty("activeSubjectUpdatedAt", new Date().toISOString());
      return jsonResponse_({ ok: true });
    }

    return jsonResponse_({ ok: false, error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}