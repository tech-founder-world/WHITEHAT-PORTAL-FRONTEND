import { useState, useEffect } from "react";
import api from "../api";
import "../css/ManageCounsellors.css";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  specialization: "",
  students: [],
};

export default function ManageCounsellors() {
  const [counsellors, setCounsellors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [counsellorsRes, studentsRes] = await Promise.all([
        api.get("/admin/counsellors"),
        api.get("/students"),
      ]);
      setCounsellors(counsellorsRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error(err);
      showToast("Error loading data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setForm({
      name: c.name,
      email: c.email,
      password: "",
      specialization: c.specialization || "",
      students: c.students?.map((s) => s._id) || [],
    });
    setEditId(c._id);
    setShowModal(true);
  };

  const toggleStudent = (studentId) => {
    setForm((prev) => ({
      ...prev,
      students: prev.students.includes(studentId)
        ? prev.students.filter((id) => id !== studentId)
        : [...prev.students, studentId],
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.email)
      return showToast("Name and email required", "error");
    if (!editId && !form.password)
      return showToast("Password required for new counsellor", "error");

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        specialization: form.specialization,
        students: form.students,
        ...(form.password && { password: form.password }),
      };

      if (editId) {
        await api.put(`/admin/counsellors/${editId}`, payload);
        showToast("Counsellor updated successfully");
      } else {
        await api.post("/admin/counsellors", payload);
        showToast("Counsellor created successfully");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Error saving counsellor",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete counsellor "${name}"? This cannot be undone.`))
      return;
    try {
      await api.delete(`/admin/counsellors/${id}`);
      showToast("Counsellor deleted");
      fetchData();
    } catch (err) {
      showToast("Error deleting counsellor", "error");
    }
  };

  // Get assigned student names
  const getAssignedStudentNames = (studentIds) => {
    if (!studentIds || studentIds.length === 0) return "No students assigned";
    const names = studentIds.map((id) => {
      const student = students.find((s) => s._id === id);
      return student ? student.name : "Unknown";
    });
    return names.join(", ");
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
        }}
      >
        <div>
          <h1 className="page-title">Counsellors</h1>
          <p className="page-subtitle">
            Manage counsellor accounts and their assigned students
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Counsellor
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-wrapper">
            <div className="spinner" />
            <p>Loading...</p>
          </div>
        ) : counsellors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧑‍🏫</div>
            <p>No counsellors yet. Add your first counsellor to get started.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Specialization</th>
                  <th>Assigned Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {counsellors.map((c, i) => (
                  <tr key={c._id}>
                    <td className="text-muted">{i + 1}</td>
                    <td>
                      <div className="counsellor-name-cell">
                        <div className="counsellor-avatar">
                          {c.name[0].toUpperCase()}
                        </div>
                        <strong>{c.name}</strong>
                      </div>
                    </td>
                    <td className="text-muted">{c.email}</td>
                    <td>
                      <span className="specialization-tag">
                        {c.specialization || "General"}
                      </span>
                    </td>
                    <td>
                      <div className="assigned-students-cell">
                        {c.students && c.students.length > 0 ? (
                          <span className="student-count-badge">
                            {c.students.length} student
                            {c.students.length !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(c._id, c.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editId ? "Edit Counsellor" : "Add Counsellor"}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-control"
                placeholder="e.g. Dr. Anjali Mehta"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                placeholder="counsellor@school.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {editId ? "New Password (leave blank to keep)" : "Password"}
              </label>
              <input
                className="form-control"
                type="password"
                placeholder={editId ? "Leave blank to keep" : "Set password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input
                className="form-control"
                placeholder="e.g. Academic, Career, Mental Health"
                value={form.specialization}
                onChange={(e) =>
                  setForm({ ...form, specialization: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assign Students</label>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                }}
              >
                Select students this counsellor will be responsible for
              </p>

              {students.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  No students available. Add students first.
                </p>
              ) : (
                <div className="student-select-grid">
                  {students.map((student) => (
                    <label key={student._id} className="student-checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.students.includes(student._id)}
                        onChange={() => toggleStudent(student._id)}
                      />
                      <span>{student.name}</span>
                      <span className="roll-number">{student.rollNumber}</span>
                    </label>
                  ))}
                </div>
              )}

              {form.students.length > 0 && (
                <div className="selected-count">
                  Selected: <strong>{form.students.length}</strong> student
                  {form.students.length !== 1 ? "s" : ""}
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
                {saving
                  ? "Saving..."
                  : editId
                    ? "Save Changes"
                    : "Create Counsellor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
