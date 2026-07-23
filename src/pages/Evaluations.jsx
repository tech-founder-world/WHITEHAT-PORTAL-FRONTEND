import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../css/Evaluations.css";

export default function Evaluations() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' or 'asc'
  const [searchTerm, setSearchTerm] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch teacher's projects
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // console.log("Fetching projects...");
      const res = await api.get("/projects");
      // console.log("Projects response:", res.data);
      setProjects(res.data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      showToast(
        "Error loading projects: " +
          (err.response?.data?.message || err.message),
        "error",
      );
    }
  };

  // When project is selected, fetch its students
  useEffect(() => {
    if (!selectedProject) {
      setStudents([]);
      setScores({});
      return;
    }
    setLoading(true);
    api
      .get(`/projects/${selectedProject}`)
      .then((res) => {
        // console.log("Project data:", res.data);
        const project = res.data;
        const studentList = project.students || [];
        setStudents(studentList);
        const init = {};
        studentList.forEach((s) => {
          init[s._id] = {
            score: "",
            maxScore: project.maxScore || 100,
            remarks: "",
            existingId: null,
          };
        });
        setScores(init);
        // Reset search when project changes
        setSearchTerm("");
      })
      .catch((err) => {
        console.error("Error fetching project:", err);
        showToast(
          "Error fetching project data: " +
            (err.response?.data?.message || err.message),
          "error",
        );
        setStudents([]);
        setScores({});
      })
      .finally(() => setLoading(false));
  }, [selectedProject]);

  // Load existing evaluations
  useEffect(() => {
    if (!selectedProject || !date || students.length === 0) return;

    api
      .get(`/evaluations?projectId=${selectedProject}&date=${date}`)
      .then((res) => {
        // console.log("Existing evaluations:", res.data);
        setScores((prev) => {
          const updated = { ...prev };
          students.forEach((s) => {
            updated[s._id] = {
              score: "",
              maxScore: updated[s._id]?.maxScore || 100,
              remarks: "",
              existingId: null,
            };
          });
          res.data.forEach((rec) => {
            const sid = rec.student._id;
            if (updated[sid] !== undefined) {
              updated[sid] = {
                score: rec.score,
                maxScore: rec.maxScore,
                remarks: rec.remarks || "",
                existingId: rec._id,
              };
            }
          });
          return updated;
        });
      })
      .catch((err) => {
        console.error("Error fetching evaluations:", err);
      });
  }, [selectedProject, date, students]);

  const updateScore = (studentId, field, value) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!selectedProject) {
      showToast("Select a project", "error");
      return;
    }

    const records = students
      .filter(
        (s) => scores[s._id]?.score !== "" && scores[s._id]?.score !== null,
      )
      .map((s) => ({
        studentId: s._id,
        score: Number(scores[s._id].score),
        maxScore: Number(scores[s._id].maxScore) || 100,
        remarks: scores[s._id].remarks || "",
        evaluationType: "project",
      }));

    if (records.length === 0) {
      showToast("No scores entered", "error");
      return;
    }

    setSaving(true);
    try {
      await api.post("/evaluations/bulk", {
        records,
        projectId: selectedProject,
        date,
      });
      showToast(`Saved ${records.length} evaluations ✅`);

      const res = await api.get(
        `/evaluations?projectId=${selectedProject}&date=${date}`,
      );
      setScores((prev) => {
        const updated = { ...prev };
        res.data.forEach((rec) => {
          if (updated[rec.student._id]) {
            updated[rec.student._id].existingId = rec._id;
          }
        });
        return updated;
      });
    } catch (err) {
      console.error("Error saving:", err);
      showToast(err.response?.data?.message || "Error saving", "error");
    } finally {
      setSaving(false);
    }
  };

  // Filter students by search term
  const getFilteredStudents = () => {
    if (!searchTerm.trim()) {
      return students;
    }
    const search = searchTerm.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.rollNumber.toLowerCase().includes(search) ||
        (s.email && s.email.toLowerCase().includes(search)),
    );
  };

  // Get sorted students based on scores
  const getSortedStudents = (filteredStudents) => {
    return [...filteredStudents].sort((a, b) => {
      const scoreA = scores[a._id]?.score;
      const scoreB = scores[b._id]?.score;

      // Convert to numbers for comparison
      const numA = scoreA !== "" && scoreA !== null ? Number(scoreA) : -1;
      const numB = scoreB !== "" && scoreB !== null ? Number(scoreB) : -1;

      if (sortOrder === "desc") {
        return numB - numA; // Highest first
      } else {
        return numA - numB; // Lowest first
      }
    });
  };

  const filteredStudents = getFilteredStudents();
  const sortedStudents = getSortedStudents(filteredStudents);

  const filledCount = students.filter((s) => {
    const sc = scores[s._id]?.score;
    return sc !== "" && sc !== null;
  }).length;

  const isEditing = students.some((s) => scores[s._id]?.existingId);

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <h1 className="page-title">Project Evaluations</h1>
        <p className="page-subtitle">Evaluate students for their projects</p>
      </div>

      <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Select Project</label>
            <select
              className="form-control"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">— Select Project —</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.subject}) - {p.students?.length || 0} students
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              value={date}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {selectedProject && (
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "13px", color: "var(--gray-600)" }}>
              📚 Students enrolled: {students.length}
            </span>
            {isEditing && (
              <span
                style={{
                  padding: "3px 10px",
                  background: "var(--info-bg)",
                  color: "var(--info)",
                  borderRadius: "20px",
                  fontWeight: 600,
                  fontSize: "12px",
                }}
              >
                ✏️ Editing existing records
              </span>
            )}
            {filledCount > 0 && (
              <button
                className="btn btn-outline btn-sm"
                onClick={toggleSortOrder}
                style={{ fontSize: "12px" }}
              >
                {sortOrder === "desc" ? "⬇️ Highest First" : "⬆️ Lowest First"}
              </button>
            )}
          </div>
        )}
      </div>

      {selectedProject ? (
        loading ? (
          <div className="loading-wrapper">
            <div className="spinner" />
            <p>Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">👥</div>
            <p>No students enrolled in this project yet</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Go to Projects and add students to evaluate them
            </p>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div
              className="card"
              style={{ padding: "12px 16px", marginBottom: "12px" }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{ flex: 1, minWidth: "200px", position: "relative" }}
                >
                  <input
                    className="form-control"
                    placeholder="🔍 Search students by name, roll number, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingRight: "40px" }}
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
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
                      Found <strong>{sortedStudents.length}</strong> of{" "}
                      {students.length} students
                      {filteredStudents.length !== students.length && (
                        <button
                          onClick={clearSearch}
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
                {searchTerm && sortedStudents.length === 0 && (
                  <span style={{ color: "var(--danger)", fontSize: "13px" }}>
                    No students found matching "{searchTerm}"
                  </span>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr 120px 1fr 72px 40px",
                  gap: "12px",
                  padding: "10px 20px",
                  borderBottom: "2px solid var(--gray-100)",
                  background: "var(--off-white)",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--gray-600)",
                  textTransform: "uppercase",
                }}
              >
                <div>#</div>
                <div>Student</div>
                <div style={{ textAlign: "center" }}>Score / Max</div>
                <div>Remarks</div>
                <div style={{ textAlign: "center" }}>%</div>
                <div style={{ textAlign: "center" }}>🏆</div>
              </div>

              {sortedStudents.length === 0 ? (
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
                    No students found matching "<strong>{searchTerm}</strong>"
                  </p>
                  <button
                    onClick={clearSearch}
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: "8px" }}
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                sortedStudents.map((s, i) => {
                  const entry = scores[s._id] || {
                    score: "",
                    maxScore: 100,
                    remarks: "",
                    existingId: null,
                  };
                  const scoreNum = Number(entry.score);
                  const maxNum = Number(entry.maxScore) || 100;
                  const hasScore = entry.score !== "" && entry.score !== null;
                  const pct = hasScore
                    ? ((scoreNum / maxNum) * 100).toFixed(0)
                    : null;
                  const pctColor =
                    pct === null
                      ? "var(--gray-400)"
                      : pct >= 70
                        ? "var(--success)"
                        : pct >= 40
                          ? "var(--warning)"
                          : "var(--danger)";

                  // Determine rank badge
                  let rankBadge = null;
                  if (hasScore && filledCount > 0) {
                    // Get all scores for ranking
                    const allScores = students
                      .filter((st) => {
                        const sc = scores[st._id]?.score;
                        return sc !== "" && sc !== null;
                      })
                      .map((st) => Number(scores[st._id].score))
                      .sort((a, b) => b - a);

                    const rank = allScores.indexOf(scoreNum) + 1;
                    const total = allScores.length;

                    if (rank === 1) {
                      rankBadge = "🥇";
                    } else if (rank === 2) {
                      rankBadge = "🥈";
                    } else if (rank === 3) {
                      rankBadge = "🥉";
                    } else if (rank <= total * 0.25) {
                      rankBadge = "⭐";
                    } else if (rank <= total * 0.5) {
                      rankBadge = "👍";
                    }
                  }

                  // Highlight search match
                  const highlightText = (text, search) => {
                    if (!search.trim()) return text;
                    const regex = new RegExp(`(${search.trim()})`, "gi");
                    const parts = text.split(regex);
                    return parts.map((part, i) =>
                      regex.test(part) ? (
                        <mark
                          key={i}
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
                    <div
                      key={s._id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "44px 1fr 120px 1fr 72px 40px",
                        gap: "12px",
                        alignItems: "center",
                        padding: "11px 20px",
                        borderBottom: "1px solid var(--gray-100)",
                        background: entry.existingId
                          ? "rgba(46,125,50,0.04)"
                          : "transparent",
                        transition: "background 0.2s",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--gray-600)",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {i + 1}
                      </div>

                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          {highlightText(s.name, searchTerm)}
                          {entry.existingId && (
                            <span
                              style={{
                                fontSize: "10px",
                                background: "var(--success-bg)",
                                color: "var(--success)",
                                padding: "1px 6px",
                                borderRadius: "10px",
                              }}
                            >
                              saved
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--gray-600)",
                            fontFamily: "monospace",
                          }}
                        >
                          {highlightText(s.rollNumber, searchTerm)}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Score"
                          value={entry.score}
                          min={0}
                          max={maxNum}
                          onChange={(e) =>
                            updateScore(s._id, "score", e.target.value)
                          }
                          style={{
                            textAlign: "center",
                            padding: "6px 4px",
                            fontSize: "13px",
                          }}
                        />
                        <span
                          style={{ color: "var(--gray-400)", fontSize: "12px" }}
                        >
                          /
                        </span>
                        <input
                          type="number"
                          className="form-control"
                          value={entry.maxScore}
                          min={1}
                          onChange={(e) =>
                            updateScore(s._id, "maxScore", e.target.value)
                          }
                          style={{
                            textAlign: "center",
                            padding: "6px 4px",
                            fontSize: "13px",
                            width: "52px",
                          }}
                        />
                      </div>

                      <input
                        type="text"
                        className="form-control"
                        placeholder="Remarks (optional)"
                        value={entry.remarks}
                        onChange={(e) =>
                          updateScore(s._id, "remarks", e.target.value)
                        }
                        style={{ fontSize: "13px" }}
                      />

                      <div
                        style={{
                          textAlign: "center",
                          fontWeight: 800,
                          fontSize: "14px",
                          color: pctColor,
                        }}
                      >
                        {pct !== null ? `${pct}%` : "—"}
                      </div>

                      <div style={{ textAlign: "center", fontSize: "20px" }}>
                        {rankBadge || "—"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div
              style={{
                marginTop: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "13px", color: "var(--gray-600)" }}>
                {filledCount} of {students.length} students evaluated
                {filledCount > 0 && (
                  <span style={{ marginLeft: "12px", fontSize: "12px" }}>
                    🏆 Top score:{" "}
                    {(() => {
                      const scoresList = students
                        .filter((st) => {
                          const sc = scores[st._id]?.score;
                          return sc !== "" && sc !== null;
                        })
                        .map((st) => Number(scores[st._id].score));
                      if (scoresList.length === 0) return "—";
                      const max = Math.max(...scoresList);
                      const student = students.find(
                        (st) => Number(scores[st._id]?.score) === max,
                      );
                      return `${student?.name || "—"} (${max})`;
                    })()}
                  </span>
                )}
                {searchTerm && sortedStudents.length !== students.length && (
                  <span style={{ marginLeft: "12px", color: "var(--primary)" }}>
                    🔍 Showing {sortedStudents.length} filtered results
                  </span>
                )}
              </span>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "✏️ Update Evaluations"
                    : "✅ Save Evaluations"}
              </button>
            </div>
          </>
        )
      ) : (
        <div className="empty-state" style={{ marginTop: "24px" }}>
          <div className="empty-icon">📝</div>
          <p>Select a project to evaluate students</p>
          {projects.length === 0 && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginTop: "8px",
              }}
            >
              Create a project first to start evaluating students
            </p>
          )}
        </div>
      )}
    </div>
  );
}
