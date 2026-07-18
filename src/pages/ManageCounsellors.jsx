import { useState, useEffect } from "react";
import api from "../api";
import "../css/ManageCounsellors.css";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  specialization: "",
};

export default function ManageCounsellors() {
  const [counsellors, setCounsellors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [expandedCounsellor, setExpandedCounsellor] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const counsellorsRes = await api.get("/admin/counsellors");
      setCounsellors(counsellorsRes.data);
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
    });
    setEditId(c._id);
    setShowModal(true);
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

  const toggleExpand = (counsellorId) => {
    setExpandedCounsellor(
      expandedCounsellor === counsellorId ? null : counsellorId,
    );
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
            Manage counsellor accounts - Counsellors will add their own students
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
                  <th>Students Added</th>
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
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => toggleExpand(c._id)}
                      >
                        {c.students?.length || 0} Students{" "}
                        {expandedCounsellor === c._id ? "▲" : "▼"}
                      </button>
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

            {/* Expanded student list for each counsellor */}
            {expandedCounsellor && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  background: "var(--gray-50)",
                  borderRadius: "var(--border-radius)",
                }}
              >
                <h4 style={{ marginBottom: "12px" }}>
                  Students added by{" "}
                  {counsellors.find((c) => c._id === expandedCounsellor)?.name}
                </h4>
                {counsellors.find((c) => c._id === expandedCounsellor)?.students
                  ?.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "8px",
                    }}
                  >
                    {counsellors
                      .find((c) => c._id === expandedCounsellor)
                      ?.students.map((student) => (
                        <div
                          key={student._id}
                          style={{
                            padding: "8px 12px",
                            background: "var(--white)",
                            borderRadius: "6px",
                            border: "1px solid var(--gray-200)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>{student.name}</span>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--gray-500)",
                            }}
                          >
                            {student.rollNumber}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--gray-500)", fontSize: "13px" }}>
                    No students added yet
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal - Removed student assignment */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px" }}
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

            <div
              style={{
                padding: "12px",
                background: "var(--info-bg)",
                borderRadius: "var(--border-radius)",
                marginBottom: "16px",
                fontSize: "13px",
                color: "var(--info)",
              }}
            >
              ℹ️ Counsellors will add their own students. They cannot be
              assigned students by admin.
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
