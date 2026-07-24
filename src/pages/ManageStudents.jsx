import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../css/ManageStudents.css";

const emptyForm = {
  name: "",
  fatherName: "",
  email: "",
  phone: "",
  subjects: [],
  batchType: "Premium",
  mode: "Online",
  totalFee: 0,
  paidAmount: 0,
};

// 🆕 Single dropdown with ALL options
const batchTypeOptions = [
  { value: "Premium", label: "👑 Premium", color: "#fef3c7", textColor: "#92400e" },
  { value: "Regular", label: "💎 Regular", color: "#e5e7eb", textColor: "#374151" },
  { value: "Diploma", label: "📜 Diploma", color: "#dbeafe", textColor: "#1e40af" },
  { value: "45 days", label: "📅 45 Days", color: "#d1fae5", textColor: "#065f46" },
  { value: "3 months", label: "📅 3 Months", color: "#e0e7ff", textColor: "#4338ca" },
  { value: "4 months", label: "📅 4 Months", color: "#fce4ec", textColor: "#9a3412" },
  { value: "6 months", label: "📅 6 Months", color: "#f3e5f5", textColor: "#6b21a8" },
];

const modeOptions = [
  { value: "Online", label: "🌐 Online" },
  { value: "Offline", label: "🏫 Offline" },
];

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
    setTimeout(() => setToast(null), 5000);
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
          s.email?.toLowerCase().includes(q) ||
          s.fatherName?.toLowerCase().includes(q) ||
          s.phone?.includes(q) ||
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
      name: s.name || "",
      fatherName: s.fatherName || "",
      email: s.email || "",
      phone: s.phone || "",
      subjects: s.subjects || [],
      batchType: s.batchType || "Premium",
      mode: s.mode || "Online",
      totalFee: s.totalFee || 0,
      paidAmount: s.paidAmount || 0,
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
    const capitalizedSub = sub.toUpperCase();
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(capitalizedSub)
        ? prev.subjects.filter((s) => s !== capitalizedSub)
        : [...prev.subjects, capitalizedSub],
    }));
  };

  const addCustomSubject = () => {
    const trimmed = subjectInput.trim();
    if (!trimmed) return;
    const capitalized = trimmed.toUpperCase();
    if (!form.subjects.includes(capitalized))
      setForm((prev) => ({ ...prev, subjects: [...prev.subjects, capitalized] }));
    setSubjectInput("");
  };

  const removeSubjectTag = (sub) =>
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== sub),
    }));

  const handleSave = async () => {
    if (!form.name || !form.fatherName || !form.email || !form.phone) {
      return showToast(
        "Name, father's name, email, and phone are required",
        "error",
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return showToast("Please enter a valid email address", "error");
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(form.phone)) {
      return showToast("Please enter a valid 10-digit phone number", "error");
    }

    setSaving(true);
    try {
      const cleanEmail = form.email.trim().toLowerCase();

      const existingStudent = students.find(
        (s) => s.email?.toLowerCase() === cleanEmail && s._id !== editId,
      );

      if (existingStudent) {
        showToast(
          `Email "${cleanEmail}" already exists for student "${existingStudent.name}". Please use a different email.`,
          "error",
        );
        setSaving(false);
        return;
      }

      const payload = {
        name: form.name.trim(),
        fatherName: form.fatherName.trim(),
        email: cleanEmail,
        phone: form.phone.trim(),
        subjects: form.subjects.map(s => s.toUpperCase()),
        batchType: form.batchType || "Premium",
        mode: form.mode || "Online",
        totalFee: form.totalFee || 0,
        paidAmount: form.paidAmount || 0,
      };

      let response;
      if (editId) {
        response = await api.put(`/students/${editId}`, payload);
        showToast(response.data.message || "Student updated successfully");
      } else {
        response = await api.post("/students", payload);
        showToast(response.data.message || "Student added successfully");
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      console.error("Error saving student:", err);
      let errorMessage = err.response?.data?.message || "Error saving student";
      showToast(errorMessage, "error");
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
      const response = await api.post("/admin/students/assign-teacher", {
        studentId: selectedStudent._id,
        teacherId: teacherId,
      });
      showToast(response.data.message || "Teacher assigned successfully");
      setShowAssignModal(false);
      fetchAll();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error assigning teacher";
      showToast(errorMsg, "error");
    }
  };

  const handleRemoveTeacher = async (student) => {
    if (!window.confirm(`Remove teacher "${student.teacher?.name}" from ${student.name}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/admin/students/${student._id}/teacher`);
      showToast(`✅ Teacher removed from ${student.name} successfully`);
      fetchAll();
    } catch (err) {
      console.error("Error removing teacher:", err);
      showToast(err.response?.data?.message || "Error removing teacher", "error");
    } finally {
      setLoading(false);
    }
  };

  // Export Functions
  const exportSingleCSV = async (student) => {
    try {
      const response = await api.get(`/export/student/${student._id}/csv`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${student.name}_data.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`✅ Downloaded ${student.name}'s data as CSV`, "success");
    } catch (err) {
      console.error("Error exporting CSV:", err);
      showToast("Error exporting CSV", "error");
    }
  };

  const exportSinglePDF = async (student) => {
    try {
      const response = await api.get(`/export/student/${student._id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${student.name}_data.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`✅ Downloaded ${student.name}'s data as PDF`, "success");
    } catch (err) {
      console.error("Error exporting PDF:", err);
      showToast("Error exporting PDF", "error");
    }
  };

  const exportAllCSV = async () => {
    try {
      const response = await api.get("/export/all-students/csv", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "all_students_data.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`✅ Downloaded all students data as CSV`, "success");
    } catch (err) {
      console.error("Error exporting all CSV:", err);
      showToast("Error exporting all CSV", "error");
    }
  };

  const exportAllPDF = async () => {
    try {
      const response = await api.get("/export/all-students/pdf", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "all_students_report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`✅ Downloaded all students report as PDF`, "success");
    } catch (err) {
      console.error("Error exporting all PDF:", err);
      showToast("Error exporting all PDF", "error");
    }
  };

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

  // Helper function to get batch type badge
  const getBatchTypeBadge = (type) => {
    const colors = {
      Premium: { bg: "#fef3c7", color: "#92400e", label: "👑 Premium" },
      Platinum: { bg: "#e5e7eb", color: "#374151", label: "💎 Platinum" },
      Diploma: { bg: "#dbeafe", color: "#1e40af", label: "📜 Diploma" },
      "45 days": { bg: "#d1fae5", color: "#065f46", label: "📅 45 Days" },
      "3 months": { bg: "#e0e7ff", color: "#4338ca", label: "📅 3 Months" },
      "4 months": { bg: "#fce4ec", color: "#9a3412", label: "📅 4 Months" },
      "6 months": { bg: "#f3e5f5", color: "#6b21a8", label: "📅 6 Months" },
    };
    return colors[type] || colors["Premium"];
  };

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "10px",
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
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {(isAdmin || isTeacher || isCounsellor) && students.length > 0 && (
            <>
              <button
                className="btn btn-success btn-sm"
                onClick={exportAllCSV}
                style={{ background: "#059669", color: "white" }}
              >
                📥 CSV All
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={exportAllPDF}
                style={{ background: "#2563eb", color: "white" }}
              >
                📄 PDF All
              </button>
            </>
          )}
          {canAddStudents && (
            <button className="btn btn-primary" onClick={openAdd}>
              + Add Student
            </button>
          )}
        </div>
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
            placeholder="🔍 Search by name, email, father name, or phone..."
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
                  <th>Name</th>
                  <th>Father's Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Batch Type</th>
                  <th>Mode</th>
                  <th>Enrolled Subjects</th>
                  <th>Fee Details</th>
                  <th>Added By</th>
                  <th>Created Date</th>
                  {isAdmin && <th>Assigned Teacher</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const batchBadge = getBatchTypeBadge(s.batchType);
                  return (
                    <tr key={s._id}>
                      <td>
                        <strong>{s.name}</strong>
                      </td>
                      <td>{s.fatherName || "N/A"}</td>
                      <td>{s.email}</td>
                      <td>{s.phone}</td>
                      <td>
                        <span style={{
                          background: batchBadge.bg,
                          color: batchBadge.color,
                          padding: "2px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          display: "inline-block",
                        }}>
                          {batchBadge.label}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: s.mode === "Online" ? "#dbeafe" : "#f3e5f5",
                          color: s.mode === "Online" ? "#1e40af" : "#6b21a8",
                          padding: "2px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}>
                          {s.mode === "Online" ? "🌐 Online" : "🏫 Offline"}
                        </span>
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
                          <div>
                            <span style={{ fontWeight: "600" }}>Total:</span> ₹
                            {s.totalFee || 0}
                          </div>
                          <div>
                            <span style={{ fontWeight: "600", color: "#16a34a" }}>
                              Paid:
                            </span>{" "}
                            ₹{s.paidAmount || 0}
                          </div>
                          <div>
                            <span
                              style={{
                                fontWeight: "600",
                                color: s.dueAmount > 0 ? "#dc2626" : "#16a34a",
                              }}
                            >
                              Due:
                            </span>
                            ₹{s.dueAmount || 0}
                          </div>
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
                            })
                          : "—"}
                      </td>
                      {isAdmin && (
                        <td>
                          {s.teacher ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "var(--success)",
                                  background: "#d1fae5",
                                  padding: "2px 10px",
                                  borderRadius: "12px",
                                }}
                              >
                                ✓ {s.teacher?.name || "Assigned"}
                              </span>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => openAssignTeacher(s)}
                                style={{ padding: "2px 6px", fontSize: "10px" }}
                                title="Change Teacher"
                              >
                                🔄 Change
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleRemoveTeacher(s)}
                                style={{ padding: "2px 6px", fontSize: "10px" }}
                                title="Remove Teacher"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => openAssignTeacher(s)}
                            >
                              Assign Teacher
                            </button>
                          )}
                        </td>
                      )}
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "4px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => exportSingleCSV(s)}
                            style={{
                              padding: "2px 8px",
                              fontSize: "11px",
                              background: "#059669",
                              color: "white",
                            }}
                            title="Download CSV"
                          >
                            📥 CSV
                          </button>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => exportSinglePDF(s)}
                            style={{
                              padding: "2px 8px",
                              fontSize: "11px",
                              background: "#2563eb",
                              color: "white",
                            }}
                            title="Download PDF"
                          >
                            📄 PDF
                          </button>
                          {canAddStudents && (
                            <>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => openEdit(s)}
                                style={{ padding: "2px 8px", fontSize: "11px" }}
                              >
                                Edit
                              </button>
                              {isAdmin && (
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDelete(s._id, s.name)}
                                  style={{ padding: "2px 8px", fontSize: "11px" }}
                                >
                                  Remove
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal - with Single Batch Type Dropdown and Mode */}
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
              <label className="form-label">Father's Name *</label>
              <input
                className="form-control"
                placeholder="e.g. Mr. Suresh Verma"
                value={form.fatherName}
                onChange={(e) =>
                  setForm({ ...form, fatherName: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                className="form-control"
                type="email"
                placeholder="student@email.com"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input
                className="form-control"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setForm({ ...form, phone: value });
                }}
                maxLength="10"
              />
            </div>

            {/* 🆕 Single Batch Type Dropdown - ALL options in one */}
            <div className="form-group">
              <label className="form-label">Batch Type *</label>
              <select
                className="form-control"
                value={form.batchType}
                onChange={(e) => setForm({ ...form, batchType: e.target.value })}
              >
                {batchTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 🆕 Mode Dropdown */}
            <div className="form-group">
              <label className="form-label">Mode *</label>
              <select
                className="form-control"
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
              >
                {modeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
                <label className="form-label">Total Fee (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 25000"
                  value={form.totalFee}
                  min="0"
                  onChange={(e) => {
                    const total = Number(e.target.value) || 0;
                    setForm({
                      ...form,
                      totalFee: total,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Paid Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 12500"
                  value={form.paidAmount}
                  min="0"
                  onChange={(e) => {
                    const paid = Number(e.target.value) || 0;
                    setForm({
                      ...form,
                      paidAmount: paid,
                    });
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Due Amount (₹)</label>
              <input
                type="number"
                className="form-control"
                value={(form.totalFee || 0) - (form.paidAmount || 0)}
                disabled
                style={{
                  background: "#f3f4f6",
                  fontWeight: "bold",
                  color:
                    (form.totalFee || 0) - (form.paidAmount || 0) > 0
                      ? "#dc2626"
                      : "#16a34a",
                }}
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
                Click to toggle subjects (auto-capitalized)
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
                  placeholder="Type a custom subject name (auto-capitalized)..."
                  value={subjectInput}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setSubjectInput(value);
                  }}
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

      {/* Assign/Change Teacher Modal */}
      {isAdmin && showAssignModal && selectedStudent && (
        <div
          className="modal-overlay"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "650px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedStudent.teacher ? "Change Teacher" : "Assign Teacher"} for {selectedStudent.name}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>

            {selectedStudent.teacher && (
              <div style={{ 
                padding: "10px 14px", 
                background: "#f0fdf4", 
                borderRadius: "8px",
                border: "1px solid #bbf7d0",
                marginBottom: "12px"
              }}>
                <strong>Current Teacher:</strong> 
                <span style={{ marginLeft: "8px", fontWeight: "600" }}>
                  {selectedStudent.teacher.name}
                </span>
                <span style={{ fontSize: "12px", color: "var(--gray-500)", marginLeft: "8px" }}>
                  ({selectedStudent.teacher.subjects?.join(", ") || "No subjects"})
                </span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={async () => {
                    if (window.confirm(`Remove teacher "${selectedStudent.teacher.name}" from ${selectedStudent.name}?`)) {
                      try {
                        await api.delete(`/admin/students/${selectedStudent._id}/teacher`);
                        showToast(`✅ Teacher removed from ${selectedStudent.name}`);
                        setShowAssignModal(false);
                        fetchAll();
                      } catch (err) {
                        showToast("Error removing teacher", "error");
                      }
                    }
                  }}
                  style={{ marginLeft: "12px", padding: "2px 10px", fontSize: "11px" }}
                >
                  ✕ Remove
                </button>
              </div>
            )}

            <div style={{ marginBottom: "12px" }}>
              <div style={{ 
                fontSize: "13px", 
                padding: "10px 14px", 
                background: "#f0fdf4", 
                borderRadius: "8px",
                border: "1px solid #bbf7d0",
                marginBottom: "8px"
              }}>
                <strong>📚 Student Subjects:</strong> 
                <span style={{ marginLeft: "8px" }}>
                  {selectedStudent.subjects?.length > 0 
                    ? selectedStudent.subjects.join(", ") 
                    : "No subjects assigned"}
                </span>
              </div>
              <div style={{ 
                fontSize: "12px", 
                padding: "8px 14px", 
                background: "#fef3c7", 
                borderRadius: "8px",
                border: "1px solid #fcd34d"
              }}>
                <strong>⚠️ Note:</strong> Only teachers with matching subjects will be shown.
                <br />
                <span style={{ fontSize: "11px", color: "var(--gray-500)" }}>
                  Teacher must have at least one subject that matches student's subjects.
                </span>
              </div>
            </div>

            <div className="form-group">
              <input
                className="form-control"
                placeholder="🔍 Search teachers by name..."
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
              
              <div style={{ 
                fontSize: "12px", 
                color: "var(--gray-500)", 
                marginBottom: "8px" 
              }}>
                Showing {teachers.filter(t => {
                  const studentSubjects = (selectedStudent.subjects || []).map(s => s.toUpperCase());
                  const teacherSubjects = (t.subjects || []).map(s => s.toUpperCase());
                  return studentSubjects.some(sub => teacherSubjects.includes(sub));
                }).length} matching teachers
              </div>

              <div style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid var(--gray-200)", borderRadius: "8px" }}>
                {teachers.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--gray-500)" }}>
                    No teachers available. Please add teachers first.
                  </div>
                ) : (
                  teachers
                    .filter((t) => t._id !== selectedStudent.teacher?._id)
                    .map((teacher) => {
                      const studentSubjects = (selectedStudent.subjects || []).map(s => s.toUpperCase().trim());
                      const teacherSubjects = (teacher.subjects || []).map(s => s.toUpperCase().trim());
                      
                      const matchingSubjects = studentSubjects.filter(sub => 
                        teacherSubjects.includes(sub)
                      );
                      const hasMatchingSubject = matchingSubjects.length > 0;
                      const isCurrentlyAssigned = selectedStudent.teacher?._id === teacher._id;
                      
                      return (
                        <div
                          key={teacher._id}
                          className="teacher-item"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            borderBottom: "1px solid var(--gray-100)",
                            cursor: hasMatchingSubject && !isCurrentlyAssigned ? "pointer" : "default",
                            opacity: isCurrentlyAssigned ? 0.6 : (hasMatchingSubject ? 1 : 0.5),
                            transition: "background 0.2s",
                            background: isCurrentlyAssigned ? "#f3f4f6" : (hasMatchingSubject ? "transparent" : "#fafafa"),
                          }}
                          onClick={() => {
                            if (hasMatchingSubject && !isCurrentlyAssigned) {
                              handleAssignTeacher(teacher._id);
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (hasMatchingSubject && !isCurrentlyAssigned) {
                              e.currentTarget.style.background = "var(--gray-50)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (hasMatchingSubject && !isCurrentlyAssigned) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                              {teacher.name}
                              {isCurrentlyAssigned && (
                                <span style={{ 
                                  fontSize: "11px", 
                                  color: "#16a34a", 
                                  background: "#d1fae5", 
                                  padding: "2px 10px", 
                                  borderRadius: "12px" 
                                }}>
                                  Currently Assigned
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--gray-500)", marginTop: "2px" }}>
                              <span style={{ fontWeight: "500" }}>Teaches:</span> 
                              {teacher.subjects?.length > 0 
                                ? teacher.subjects.join(", ") 
                                : "No subjects assigned"}
                            </div>
                            {hasMatchingSubject && !isCurrentlyAssigned && (
                              <div style={{ 
                                fontSize: "11px", 
                                color: "#16a34a", 
                                marginTop: "2px",
                                fontWeight: "500"
                              }}>
                                ✅ Matching subjects: {matchingSubjects.join(", ")}
                              </div>
                            )}
                            {!hasMatchingSubject && !isCurrentlyAssigned && (
                              <div style={{ 
                                fontSize: "11px", 
                                color: "#dc2626", 
                                marginTop: "2px"
                              }}>
                                ⚠️ No matching subjects
                                <span style={{ 
                                  fontSize: "10px", 
                                  color: "var(--gray-400)", 
                                  marginLeft: "4px",
                                  fontStyle: "italic"
                                }}>
                                  (Student: {studentSubjects.join(", ") || "None"})
                                </span>
                              </div>
                            )}
                          </div>
                          <button 
                            className={`btn ${isCurrentlyAssigned ? "btn-outline" : "btn-primary"} btn-sm`}
                            disabled={!hasMatchingSubject || isCurrentlyAssigned}
                            style={{
                              opacity: (hasMatchingSubject && !isCurrentlyAssigned) ? 1 : 0.5,
                              cursor: (hasMatchingSubject && !isCurrentlyAssigned) ? "pointer" : "not-allowed",
                              minWidth: "70px"
                            }}
                          >
                            {isCurrentlyAssigned ? "✅ Assigned" : (hasMatchingSubject ? "Assign" : "No Match")}
                          </button>
                        </div>
                      );
                    })
                )}
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