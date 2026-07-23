import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../css/MarkAttendance.css";

export default function MarkAttendance() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState({});
  const [existingRecords, setExistingRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const subjects = user?.subjects || [];

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch only students assigned to this teacher with matching subjects
  useEffect(() => {
    if (!subject) {
      setStudents([]);
      setFilteredStudents([]);
      setAttendance({});
      return;
    }
    setLoading(true);
    api
      .get(`/students?subject=${encodeURIComponent(subject)}`)
      .then((r) => {
        // console.log("Students for subject:", r.data);
        // Filter to only show students assigned to this teacher
        const assignedStudents = r.data.filter(
          (s) => s.teacher?._id === user._id || s.teacher === user._id,
        );
        setStudents(assignedStudents);
        setFilteredStudents(assignedStudents);
        // Initialize attendance for all students
        const map = {};
        assignedStudents.forEach((s) => {
          map[s._id] = "absent";
        });
        setAttendance(map);
        // Reset search when subject changes
        setSearchTerm("");
      })
      .catch((err) => {
        console.error("Error fetching students:", err);
        showToast("Error fetching students", "error");
      })
      .finally(() => setLoading(false));
  }, [subject, user._id]);

  // Filter students when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
      return;
    }
    const search = searchTerm.toLowerCase().trim();
    const filtered = students.filter((s) => {
      return (
        s.name.toLowerCase().includes(search) ||
        s.email?.toLowerCase().includes(search) ||
        s.fatherName?.toLowerCase().includes(search) ||
        s.phone?.includes(search) ||
        s.rollNumber?.toLowerCase().includes(search)
      );
    });
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  // Load existing attendance when subject + date changes
  useEffect(() => {
    if (!subject || !date || students.length === 0) return;

    setLoading(true);
    api
      .get(`/attendance?subject=${encodeURIComponent(subject)}&date=${date}`)
      .then((r) => {
        // console.log("Existing attendance:", r.data);
        setExistingRecords(r.data);
        const map = {};
        // First set all to absent
        students.forEach((s) => {
          map[s._id] = "absent";
        });
        // Then override with existing records
        r.data.forEach((rec) => {
          if (rec.student && rec.student._id) {
            map[rec.student._id] = rec.status;
          }
        });
        setAttendance(map);
      })
      .catch((err) => {
        console.error("Error fetching attendance:", err);
      })
      .finally(() => setLoading(false));
  }, [subject, date, students]);

  const toggle = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const map = {};
    students.forEach((s) => {
      map[s._id] = status;
    });
    setAttendance(map);
  };

  const handleSubmit = async () => {
    if (!subject) {
      showToast("Please select a subject", "error");
      return;
    }
    if (!date) {
      showToast("Please select a date", "error");
      return;
    }
    if (students.length === 0) {
      showToast("No assigned students found for this subject", "error");
      return;
    }

    setSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s._id,
        status: attendance[s._id] || "absent",
      }));

      // console.log("Saving attendance:", { records, subject, date });

      const response = await api.post("/attendance/bulk", {
        records,
        subject,
        date,
      });

      // console.log("Save response:", response.data);
      showToast(
        `Attendance saved successfully ✅ (${response.data.records?.length || records.length} records)`,
        "success",
      );

      // Refresh the records to show saved status
      const refreshRes = await api.get(
        `/attendance?subject=${encodeURIComponent(subject)}&date=${date}`,
      );
      setExistingRecords(refreshRes.data);
    } catch (err) {
      console.error("Error saving attendance:", err);
      showToast(
        err.response?.data?.message || "Error saving attendance",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter(
    (s) => attendance[s._id] === "present",
  ).length;
  const absentCount = students.length - presentCount;
  const isEditing = existingRecords.length > 0;

  // Get filtered present/absent counts
  const filteredPresentCount = filteredStudents.filter(
    (s) => attendance[s._id] === "present",
  ).length;
  const filteredAbsentCount = filteredStudents.length - filteredPresentCount;

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <h1 className="page-title">Mark Attendance</h1>
        <p className="page-subtitle">
          Select a subject — only students assigned to you will appear
        </p>
      </div>

      {/* Controls */}
      <div className="card attendance-controls">
        <div className="controls-grid">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Subject</label>
            <select
              className="form-control"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">— Select Subject —</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Date</label>
            <input
              className="form-control"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        {isEditing && (
          <div className="editing-notice">
            ✏️ Editing existing attendance record for {date}
          </div>
        )}
      </div>

      {subject && (
        <>
          {loading ? (
            <div className="loading-wrapper">
              <div className="spinner" />
              <p>Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="empty-state" style={{ marginTop: "24px" }}>
              <div className="empty-icon">📋</div>
              <p>
                No students assigned to you for <strong>{subject}</strong>.
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Students need to be assigned to you by an admin and must have{" "}
                <strong>{subject}</strong> as a subject.
              </p>
            </div>
          ) : (
            <>
              {/* Summary bar with search */}
              <div className="attendance-summary">
                <div className="summary-stat">
                  <span className="summary-num">{students.length}</span>
                  <span className="summary-label">Assigned Students</span>
                </div>
                <div className="summary-stat present">
                  <span className="summary-num">{presentCount}</span>
                  <span className="summary-label">Present</span>
                </div>
                <div className="summary-stat absent">
                  <span className="summary-num">{absentCount}</span>
                  <span className="summary-label">Absent</span>
                </div>
                <div className="summary-actions">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => markAll("present")}
                  >
                    Mark All Present
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => markAll("absent")}
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              {/* 🆕 Search Bar */}
              <div
                className="card"
                style={{ padding: "12px 16px", marginBottom: "12px" }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{ flex: 1, minWidth: "200px", position: "relative" }}
                  >
                    <input
                      className="form-control"
                      placeholder="🔍 Search students by name, email, phone or roll number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingRight: "40px" }}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          fontSize: "16px",
                          cursor: "pointer",
                          color: "var(--gray-500)",
                          padding: "4px 8px",
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--gray-600)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {searchTerm ? (
                      <span>
                        Found <strong>{filteredStudents.length}</strong> of{" "}
                        {students.length} students
                        {filteredStudents.length !== students.length && (
                          <button
                            onClick={() => setSearchTerm("")}
                            style={{
                              marginLeft: "8px",
                              color: "var(--primary)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            Clear filter
                          </button>
                        )}
                      </span>
                    ) : (
                      <span>Showing all {students.length} students</span>
                    )}
                  </div>
                  {searchTerm && filteredStudents.length === 0 && (
                    <span style={{ color: "var(--danger)", fontSize: "13px" }}>
                      No students found matching "{searchTerm}"
                    </span>
                  )}
                </div>
                {/* 🆕 Filtered summary */}
                {searchTerm &&
                  filteredStudents.length > 0 &&
                  filteredStudents.length !== students.length && (
                    <div
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        gap: "16px",
                        fontSize: "12px",
                        color: "var(--gray-500)",
                      }}
                    >
                      <span>
                        Filtered: <strong>{filteredStudents.length}</strong>{" "}
                        students
                      </span>
                      <span>
                        Present:{" "}
                        <strong style={{ color: "var(--success)" }}>
                          {filteredPresentCount}
                        </strong>
                      </span>
                      <span>
                        Absent:{" "}
                        <strong style={{ color: "var(--danger)" }}>
                          {filteredAbsentCount}
                        </strong>
                      </span>
                    </div>
                  )}
              </div>

              {/* Student list */}
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="student-list">
                  {filteredStudents.length === 0 ? (
                    <div
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "var(--gray-500)",
                      }}
                    >
                      <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                        🔍
                      </div>
                      <p>
                        No students found matching "
                        <strong>{searchTerm}</strong>"
                      </p>
                      <button
                        onClick={() => setSearchTerm("")}
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: "8px" }}
                      >
                        Clear Search
                      </button>
                    </div>
                  ) : (
                    filteredStudents.map((s, i) => {
                      const status = attendance[s._id] || "absent";
                      // Highlight search match
                      const highlightText = (text, search) => {
                        if (!search.trim()) return text;
                        const regex = new RegExp(`(${search.trim()})`, "gi");
                        const parts = String(text).split(regex);
                        return parts.map((part, index) =>
                          regex.test(part) ? (
                            <mark
                              key={index}
                              style={{
                                background: "var(--primary-bg)",
                                padding: "0 2px",
                                borderRadius: "2px",
                              }}
                            >
                              {part}
                            </mark>
                          ) : (
                            part
                          ),
                        );
                      };

                      return (
                        <div key={s._id} className={`student-row ${status}`}>
                          <div className="student-index">{i + 1}</div>
                          <div className="student-info">
                            <div className="student-name">
                              {highlightText(s.name, searchTerm)}
                            </div>
                            <div className="student-meta">
                              <span className="roll-badge-sm">
                                {s.rollNumber || "N/A"}
                              </span>
                              <span style={{ marginLeft: "6px" }}>
                                {highlightText(s.email, searchTerm)}
                              </span>
                              {s.fatherName && (
                                <span
                                  style={{
                                    marginLeft: "6px",
                                    fontSize: "11px",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  • Father:{" "}
                                  {highlightText(s.fatherName, searchTerm)}
                                </span>
                              )}
                              {(s.subjects || []).filter(
                                (sub) => sub !== subject,
                              ).length > 0 && (
                                <span
                                  style={{
                                    marginLeft: "6px",
                                    fontSize: "11px",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  · Also:{" "}
                                  {(s.subjects || [])
                                    .filter((sub) => sub !== subject)
                                    .join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="attendance-toggle">
                            <button
                              className={`toggle-btn present-btn ${status === "present" ? "active" : ""}`}
                              onClick={() => toggle(s._id, "present")}
                            >
                              P
                            </button>
                            <button
                              className={`toggle-btn absent-btn ${status === "absent" ? "active" : ""}`}
                              onClick={() => toggle(s._id, "absent")}
                            >
                              A
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {students.length > 0 && (
                <div className="submit-row">
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : isEditing
                        ? "✏️ Update Attendance"
                        : "✅ Save Attendance"}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {!subject && (
        <div className="empty-state" style={{ marginTop: "24px" }}>
          <div className="empty-icon">📋</div>
          <p>Select a subject above to begin marking attendance.</p>
          {subjects.length === 0 && (
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              You have no subjects assigned. Contact your admin.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
