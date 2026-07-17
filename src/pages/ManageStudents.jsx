import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../css/ManageStudents.css";

const emptyForm = {
  name: "",
  rollNumber: "",
  email: "",
  subjects: [],
  phone: "",
  class: "",
  section: "",
};

export default function ManageStudents() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isCounsellor = user?.role === "counsellor";
  const isTeacher = user?.role === "teacher";

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterAddedBy, setFilterAddedBy] = useState("");
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const canAddStudents = isAdmin || isCounsellor;

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [subjectInput, setSubjectInput] = useState("");
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [stuRes, teacherRes] = await Promise.all([
          api.get("/admin/students"),
          api.get("/admin/teachers"),
        ]);
        setStudents(stuRes.data);
        setTeachers(teacherRes.data);
        const subjectSet = new Set();
        stuRes.data.forEach((s) =>
          s.subjects?.forEach((sub) => subjectSet.add(sub)),
        );
        setAllSubjects([...subjectSet].sort());
      } else if (isCounsellor) {
        const stuRes = await api.get("/students");
        setStudents(stuRes.data);
        const subjectSet = new Set();
        stuRes.data.forEach((s) =>
          s.subjects?.forEach((sub) => subjectSet.add(sub)),
        );
        setAllSubjects([...subjectSet].sort());
      } else {
        const teacherSubjects = user?.subjects || [];
        setAllSubjects(teacherSubjects);

        if (teacherSubjects.length === 0) {
          setStudents([]);
        } else {
          const results = await Promise.all(
            teacherSubjects.map((sub) =>
              api.get(`/students?subject=${encodeURIComponent(sub)}`),
            ),
          );
          const seen = new Set();
          const combined = [];
          results.forEach((r) => {
            r.data.forEach((s) => {
              if (!seen.has(s._id)) {
                seen.add(s._id);
                combined.push(s);
              }
            });
          });
          combined.sort((a, b) => a.name.localeCompare(b.name));
          setStudents(combined);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading students", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Filter locally
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      students.filter((s) => {
        const matchSubject =
          !filterSubject || (s.subjects || []).includes(filterSubject);
        const matchAddedBy = !filterAddedBy || s.addedBy?._id === filterAddedBy;
        const matchSearch =
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          (s.subjects || []).some((sub) => sub.toLowerCase().includes(q));
        return matchSubject && matchAddedBy && matchSearch;
      }),
    );
  }, [search, filterSubject, filterAddedBy, students]);

  // ── Modal helpers ──────────────────────────────────────
  const openAdd = () => {
    setForm(emptyForm);
    setSubjectInput("");
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (s) => {
    if (!canAddStudents) return;
    setForm({
      name: s.name,
      rollNumber: s.rollNumber,
      email: s.email || "",
      subjects: s.subjects || [],
      phone: s.phone || "",
      class: s.class || "",
      section: s.section || "",
    });
    setSubjectInput("");
    setEditId(s._id);
    setShowModal(true);
  };

  const openAssignTeacher = (student) => {
    setSelectedStudent(student);
    setShowAssignModal(true);
  };

  const toggleSubject = (sub) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(sub)
        ? prev.subjects.filter((s) => s !== sub)
        : [...prev.subjects, sub],
    }));
  };

  const addCustomSubject = () => {
    const trimmed = subjectInput.trim();
    if (!trimmed) return;
    if (!form.subjects.includes(trimmed))
      setForm((prev) => ({ ...prev, subjects: [...prev.subjects, trimmed] }));
    setSubjectInput("");
  };

  const removeSubjectTag = (sub) =>
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== sub),
    }));

  const handleSave = async () => {
    if (!form.name || !form.rollNumber)
      return showToast("Name and roll number required", "error");
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        rollNumber: form.rollNumber,
        email: form.email,
        subjects: form.subjects,
        phone: form.phone,
        class: form.class,
        section: form.section,
      };
      if (editId) {
        await api.put(`/students/${editId}`, payload);
        showToast("Student updated");
      } else {
        await api.post("/students", payload);
        showToast("Student added");
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Error saving student", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!canAddStudents) return;
    if (
      !window.confirm(
        `Remove "${name}"? Their attendance and evaluation records will also be deleted.`,
      )
    )
      return;
    try {
      await api.delete(`/students/${id}`);
      showToast("Student removed");
      fetchAll();
    } catch {
      showToast("Error removing student", "error");
    }
  };

  const handleAssignTeacher = async (teacherId) => {
    try {
      await api.post("/admin/students/assign-teacher", {
        studentId: selectedStudent._id,
        teacherId: teacherId,
      });
      showToast("Teacher assigned successfully");
      setShowAssignModal(false);
      fetchAll();
    } catch (err) {
      showToast("Error assigning teacher", "error");
    }
  };

  // Get unique list of users who added students
  const addedByOptions = [
    ...new Set(students.map((s) => s.addedBy?._id).filter(Boolean)),
  ].map((id) => {
    const student = students.find((s) => s.addedBy?._id === id);
    return {
      id: student.addedBy._id,
      name: student.addedBy.name,
      role: student.addedBy.role,
    };
  });

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">
            {isAdmin &&
              `${students.length} student${students.length !== 1 ? "s" : ""} in the system`}
            {isCounsellor &&
              `${students.length} student${students.length !== 1 ? "s" : ""} registered`}
            {isTeacher &&
              `Students enrolled in your subject${(user?.subjects || []).length !== 1 ? "s" : ""}: ${(user?.subjects || []).join(", ")}`}
          </p>
        </div>
        {canAddStudents && (
          <button className="btn btn-primary" onClick={openAdd}>
            + Add Student
          </button>
        )}
      </div>

      <div className="card">
        {/* Filters */}
        <div
          className="filters-row"
          style={{
            marginBottom: "16px",
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            className="form-control"
            placeholder="🔍 Search by name, roll no, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: "280px" }}
          />

          {allSubjects.length > 0 && (
            <select
              className="form-control"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              style={{ maxWidth: "200px" }}
            >
              <option value="">All Subjects</option>
              {allSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {/* Admin filter for "Added By" */}
          {isAdmin && addedByOptions.length > 0 && (
            <select
              className="form-control"
              value={filterAddedBy}
              onChange={(e) => setFilterAddedBy(e.target.value)}
              style={{ maxWidth: "200px" }}
            >
              <option value="">All Added By</option>
              {addedByOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name} ({opt.role})
                </option>
              ))}
            </select>
          )}

          {(search || filterSubject || filterAddedBy) && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setSearch("");
                setFilterSubject("");
                setFilterAddedBy("");
              }}
            >
              Clear
            </button>
          )}

          <span className="text-muted" style={{ fontSize: "13px" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="loading-wrapper">
            <div className="spinner" />
            <p>Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <p>
              {search || filterSubject || filterAddedBy
                ? "No students match your filters."
                : canAddStudents
                  ? "No students yet. Add your first student."
                  : "No students enrolled in your subjects yet."}
            </p>
            {canAddStudents && (
              <button
                className="btn btn-primary"
                onClick={openAdd}
                style={{ marginTop: "12px" }}
              >
                + Add Student
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Name</th>
                  <th>Enrolled Subjects</th>
                  <th>Added By</th>
                  <th>Created Date</th>
                  {isAdmin && <th>Assigned Teacher</th>}
                  {canAddStudents && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <span className="roll-badge">{s.rollNumber}</span>
                    </td>
                    <td>
                      <strong>{s.name}</strong>
                      {s.class && (
                        <div
                          style={{ fontSize: "11px", color: "var(--gray-500)" }}
                        >
                          Class: {s.class}
                          {s.section ? `-${s.section}` : ""}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="subject-tags-inline">
                        {(s.subjects || []).length > 0 ? (
                          (s.subjects || []).map((sub) => (
                            <span
                              key={sub}
                              className="subject-tag"
                              style={{
                                opacity:
                                  !isTeacher ||
                                  (user?.subjects || []).includes(sub)
                                    ? 1
                                    : 0.45,
                              }}
                            >
                              {sub}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px" }}>
                        <div>{s.addedBy?.name || "Unknown"}</div>
                        <div
                          style={{ fontSize: "11px", color: "var(--gray-500)" }}
                        >
                          ({s.addedBy?.role || "N/A"})
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--gray-500)" }}>
                      {s.createdAt
                        ? new Date(s.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    {isAdmin && (
                      <td>
                        {s.teacher ? (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "var(--success)",
                            }}
                          >
                            ✓ {s.teacher?.name || "Assigned"}
                          </span>
                        ) : (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openAssignTeacher(s)}
                          >
                            Assign Teacher
                          </button>
                        )}
                      </td>
                    )}
                    {canAddStudents && (
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openEdit(s)}
                          >
                            Edit
                          </button>
                          {isAdmin && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(s._id, s.name)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {canAddStudents && showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editId ? "Edit Student" : "Add Student"}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="form-control"
                placeholder="e.g. Rahul Verma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Roll Number *</label>
              <input
                className="form-control"
                placeholder="e.g. CS2024001"
                value={form.rollNumber}
                onChange={(e) =>
                  setForm({ ...form, rollNumber: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email (optional)</label>
              <input
                className="form-control"
                type="email"
                placeholder="student@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div
              className="form-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div className="form-group">
                <label className="form-label">Class</label>
                <input
                  className="form-control"
                  placeholder="e.g. 10th"
                  value={form.class}
                  onChange={(e) => setForm({ ...form, class: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Section</label>
                <input
                  className="form-control"
                  placeholder="e.g. A"
                  value={form.section}
                  onChange={(e) =>
                    setForm({ ...form, section: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-control"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Enrolled Subjects</label>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                }}
              >
                Click to toggle subjects
              </p>

              {allSubjects.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginBottom: "10px",
                  }}
                >
                  {allSubjects.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        border: "1.5px solid",
                        borderColor: form.subjects.includes(sub)
                          ? "var(--primary)"
                          : "var(--border)",
                        background: form.subjects.includes(sub)
                          ? "var(--primary)"
                          : "transparent",
                        color: form.subjects.includes(sub)
                          ? "#fff"
                          : "var(--text)",
                        cursor: "pointer",
                        fontSize: "13px",
                        transition: "all 0.15s",
                      }}
                    >
                      {form.subjects.includes(sub) ? "✓ " : ""}
                      {sub}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  className="form-control"
                  placeholder="Type a custom subject name..."
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), addCustomSubject())
                  }
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  onClick={addCustomSubject}
                >
                  Add
                </button>
              </div>

              {form.subjects.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginTop: "10px",
                  }}
                >
                  {form.subjects.map((sub) => (
                    <span
                      key={sub}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        background: "var(--primary-light, #e8f0fe)",
                        color: "var(--primary)",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      {sub}
                      <button
                        onClick={() => removeSubjectTag(sub)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "inherit",
                          padding: 0,
                          lineHeight: 1,
                          fontSize: "15px",
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : editId ? "Save Changes" : "Add Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {isAdmin && showAssignModal && selectedStudent && (
        <div
          className="modal-overlay"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                Assign Teacher to {selectedStudent.name}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>

            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginBottom: "12px",
              }}
            >
              Select a teacher to assign to this student
            </p>

            <div className="form-group">
              <input
                className="form-control"
                placeholder="🔍 Search teachers..."
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase();
                  const teacherItems =
                    document.querySelectorAll(".teacher-item");
                  teacherItems.forEach((item) => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(searchTerm)
                      ? "flex"
                      : "none";
                  });
                }}
                style={{ marginBottom: "12px" }}
              />
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {teachers
                  .filter((t) => t._id !== selectedStudent.teacher?._id)
                  .map((teacher) => (
                    <div
                      key={teacher._id}
                      className="teacher-item"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--gray-100)",
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                      onClick={() => handleAssignTeacher(teacher._id)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--gray-50)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{teacher.name}</div>
                        <div
                          style={{ fontSize: "12px", color: "var(--gray-500)" }}
                        >
                          {teacher.subjects?.join(", ") || "No subjects"}
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm">Assign</button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="form-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
