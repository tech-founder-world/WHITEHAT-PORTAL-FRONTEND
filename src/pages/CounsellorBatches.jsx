import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../css/Batches.css";

export default function CounsellorBatches() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showBatchDetailsModal, setShowBatchDetailsModal] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "custom",
    duration: "",
    durationType: "days",
    description: "",
    startDate: "",
    endDate: "",
    maxStudents: 30,
    fee: 0,
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const categoryOptions = [
    { value: "silver", label: "Silver", duration: 45, durationType: "days" },
    {
      value: "platinum",
      label: "Platinum",
      duration: 3,
      durationType: "months",
    },
    { value: "premium", label: "Premium", duration: 6, durationType: "months" },
    { value: "custom", label: "Custom", duration: "", durationType: "days" },
  ];

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchesRes, studentsRes] = await Promise.all([
        api.get("/batches"),
        api.get("/students"),
      ]);
      setBatches(batchesRes.data || []);
      setAllStudents(studentsRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      showToast("Error loading data", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreateBatch = () => {
    setForm({
      name: "",
      category: "custom",
      duration: "",
      durationType: "days",
      description: "",
      startDate: "",
      endDate: "",
      maxStudents: 30,
      fee: 0,
    });
    setSelectedBatch(null);
    setShowBatchModal(true);
  };

  const openEditBatch = (batch) => {
    setForm({
      name: batch.name,
      category: batch.category || "custom",
      duration: batch.duration || "",
      durationType: batch.durationType || "days",
      description: batch.description || "",
      startDate: batch.startDate || "",
      endDate: batch.endDate || "",
      maxStudents: batch.maxStudents || 30,
      fee: batch.fee || 0,
    });
    setSelectedBatch(batch);
    setShowBatchModal(true);
  };

  const openBatchDetails = (batch) => {
    setSelectedBatch(batch);
    setShowBatchDetailsModal(true);
  };

  const openAddStudents = (batch) => {
    setSelectedBatch(batch);
    setShowStudentModal(true);
  };

  const handleCategoryChange = (category) => {
    const selected = categoryOptions.find((opt) => opt.value === category);
    setForm((prev) => ({
      ...prev,
      category: category,
      duration: selected?.duration || "",
      durationType: selected?.durationType || "days",
      name: category !== "custom" ? `${selected?.label} Batch` : prev.name,
    }));
  };

  const handleSaveBatch = async () => {
    if (!form.name || !form.duration) {
      showToast("Batch name and duration required", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        duration: Number(form.duration),
        durationType: form.durationType,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        maxStudents: Number(form.maxStudents),
        fee: Number(form.fee),
      };

      if (selectedBatch) {
        await api.put(`/batches/${selectedBatch._id}`, payload);
        showToast("Batch updated successfully");
      } else {
        await api.post("/batches", payload);
        showToast("Batch created successfully");
      }

      setShowBatchModal(false);
      await fetchData();
    } catch (err) {
      console.error("Error saving batch:", err);
      showToast(err.response?.data?.message || "Error saving batch", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddStudents = async () => {
    try {
      const checkboxes = document.querySelectorAll(".student-checkbox:checked");
      const selectedIds = Array.from(checkboxes).map((cb) => cb.value);

      if (selectedIds.length === 0) {
        showToast("Please select at least one student", "error");
        return;
      }

      await api.put(`/batches/${selectedBatch._id}`, {
        studentIds: selectedIds,
      });

      showToast("Students added successfully");
      setShowStudentModal(false);
      fetchData();
    } catch (err) {
      console.error("Error adding students:", err);
      showToast(
        err.response?.data?.message || "Error adding students",
        "error",
      );
    }
  };

  const handleDeleteBatch = async (id, name) => {
    if (
      !window.confirm(
        `Delete batch "${name}"? This will remove all students from this batch.`,
      )
    )
      return;
    try {
      await api.delete(`/batches/${id}`);
      showToast("Batch deleted");
      fetchData();
    } catch (err) {
      showToast("Error deleting batch", "error");
    }
  };

  const getDurationDisplay = (batch) => {
    if (batch.durationType === "months") {
      return `${batch.duration} month${batch.duration > 1 ? "s" : ""}`;
    }
    return `${batch.duration} day${batch.duration > 1 ? "s" : ""}`;
  };

  const getCategoryBadge = (category) => {
    const colors = {
      silver: "#C0C0C0",
      platinum: "#E5E4E2",
      premium: "#FFD700",
    };
    const labels = {
      silver: "🥈 Silver",
      platinum: "🥇 Platinum",
      premium: "👑 Premium",
      custom: "📌 Custom",
    };
    return {
      color: colors[category] || "#666",
      label: labels[category] || "Custom",
    };
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
          <h1 className="page-title">Batches</h1>
          <p className="page-subtitle">Create and manage student batches</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateBatch}>
          + New Batch
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-wrapper">
            <div className="spinner" />
            <p>Loading...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p>No batches created yet</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Create your first batch to start organizing students
            </p>
            <button
              className="btn btn-primary"
              onClick={openCreateBatch}
              style={{ marginTop: "12px" }}
            >
              Create Batch
            </button>
          </div>
        ) : (
          <div className="batches-grid">
            {batches.map((batch) => {
              const category = getCategoryBadge(batch.category);
              return (
                <div
                  key={batch._id}
                  className="batch-card"
                  style={{ borderTop: `4px solid ${category.color}` }}
                >
                  <div className="batch-header">
                    <div>
                      <h3 className="batch-name">{batch.name}</h3>
                      <span
                        className="batch-category"
                        style={{ color: category.color }}
                      >
                        {category.label}
                      </span>
                    </div>
                    <span
                      className={`batch-status status-${batch.status || "active"}`}
                    >
                      {batch.status || "active"}
                    </span>
                  </div>

                  <div className="batch-details">
                    <div className="batch-info-row">
                      <span>⏱️ {getDurationDisplay(batch)}</span>
                      <span>
                        👥 {batch.students?.length || 0}/
                        {batch.maxStudents || "∞"}
                      </span>
                    </div>

                    {batch.description && (
                      <p className="batch-desc">{batch.description}</p>
                    )}
                    {batch.startDate && (
                      <div className="batch-dates">
                        📅 {batch.startDate} → {batch.endDate || "Ongoing"}
                      </div>
                    )}
                    {batch.fee > 0 && (
                      <div className="batch-fee">💰 ₹{batch.fee}</div>
                    )}
                  </div>

                  <div className="batch-actions">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => openBatchDetails(batch)}
                    >
                      👁️ View Students
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openAddStudents(batch)}
                    >
                      ➕ Add Students
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => openEditBatch(batch)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteBatch(batch._id, batch.name)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE/EDIT BATCH MODAL */}
      {showBatchModal && (
        <div className="modal-overlay" onClick={() => setShowBatchModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedBatch ? "Edit Batch" : "Create New Batch"}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowBatchModal(false)}
              >
                ×
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-control"
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Batch Name *</label>
              <input
                className="form-control"
                placeholder="e.g. MERN Stack Batch"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                <label className="form-label">Duration *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 45"
                  value={form.duration}
                  min={1}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration Type</label>
                <select
                  className="form-control"
                  value={form.durationType}
                  onChange={(e) =>
                    setForm({ ...form, durationType: e.target.value })
                  }
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                placeholder="Batch description..."
                rows="2"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
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
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>
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
                <label className="form-label">Max Students</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.maxStudents}
                  min={1}
                  onChange={(e) =>
                    setForm({ ...form, maxStudents: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fee (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.fee}
                  min={0}
                  onChange={(e) =>
                    setForm({ ...form, fee: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="form-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowBatchModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveBatch}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : selectedBatch
                    ? "Update Batch"
                    : "Create Batch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STUDENTS TO BATCH MODAL */}
      {showStudentModal && selectedBatch && (
        <div
          className="modal-overlay"
          onClick={() => setShowStudentModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                Add Students to "{selectedBatch.name}"
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowStudentModal(false)}
              >
                ×
              </button>
            </div>
            <div
              className="modal-body"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginBottom: "12px",
                }}
              >
                Select students to add to this batch.
              </p>
              {allStudents.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  No students found in the system.
                </p>
              ) : (
                allStudents.map((student) => {
                  const isAlreadyInBatch = selectedBatch.students?.some(
                    (s) => s._id === student._id,
                  );
                  return (
                    <label
                      key={student._id}
                      data-student-id={student._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "8px",
                        borderBottom: "1px solid #eee",
                        cursor: isAlreadyInBatch ? "not-allowed" : "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        className="student-checkbox"
                        value={student._id}
                        disabled={isAlreadyInBatch}
                        defaultChecked={isAlreadyInBatch}
                      />
                      <span
                        style={{
                          marginLeft: "10px",
                          fontWeight: isAlreadyInBatch ? "bold" : "normal",
                        }}
                      >
                        {student.name} ({student.email})
                      </span>
                      {isAlreadyInBatch && (
                        <span
                          style={{
                            marginLeft: "10px",
                            fontSize: "12px",
                            color: "green",
                          }}
                        >
                          ✅ Already in batch
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
            <div className="form-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowStudentModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddStudents}>
                Add Students
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW BATCH DETAILS MODAL */}
      {showBatchDetailsModal && selectedBatch && (
        <div
          className="modal-overlay"
          onClick={() => setShowBatchDetailsModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "1100px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                📋 Students in "{selectedBatch.name}"
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowBatchDetailsModal(false)}
              >
                ×
              </button>
            </div>
            <div
              className="modal-body"
              style={{ maxHeight: "500px", overflowY: "auto" }}
            >
              {selectedBatch.students?.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  No students added to this batch yet.
                </p>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "2px solid #e5e7eb",
                        background: "#f9fafb",
                      }}
                    >
                      <th style={{ padding: "12px", textAlign: "left" }}>#</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Name
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Father's Name
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Email
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Phone
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Course
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Fee Details
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBatch.students?.map((student, index) => (
                      <tr
                        key={student._id}
                        style={{ borderBottom: "1px solid #f3f4f6" }}
                      >
                        <td style={{ padding: "12px", color: "#6b7280" }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600" }}>
                          {student.name}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {student.fatherName || "N/A"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {student.email || "N/A"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {student.phone || "N/A"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            className={`course-pill ${student.courseType?.toLowerCase() || "silver"}`}
                          >
                            {student.courseType || "Silver"}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontSize: "13px" }}>
                            <div>
                              <span style={{ fontWeight: "600" }}>Total:</span>{" "}
                              ₹{student.totalFee || 0}
                            </div>
                            <div style={{ color: "#16a34a" }}>
                              <span style={{ fontWeight: "600" }}>Paid:</span> ₹
                              {student.paidAmount || 0}
                            </div>
                            <div
                              style={{
                                color:
                                  student.dueAmount > 0 ? "#dc2626" : "#16a34a",
                              }}
                            >
                              <span style={{ fontWeight: "600" }}>Due:</span> ₹
                              {student.dueAmount || 0}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            className={`status-pill ${student.status || "active"}`}
                          >
                            {student.status || "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="form-actions">
              {/* CSV Download Button */}
              <button
                className="btn btn-outline"
                onClick={() => {
                  const headers = [
                    "#",
                    "Name",
                    "Father's Name",
                    "Email",
                    "Phone",
                    "Course",
                    "Total Fee",
                    "Paid Amount",
                    "Due Amount",
                    "Status",
                  ];
                  const rows = selectedBatch.students.map((s, i) => [
                    i + 1,
                    `"${s.name}"`,
                    `"${s.fatherName || ""}"`,
                    `"${s.email || ""}"`,
                    `"${s.phone || ""}"`,
                    `"${s.courseType || "Silver"}"`,
                    s.totalFee || 0,
                    s.paidAmount || 0,
                    s.dueAmount || 0,
                    `"${s.status || "active"}"`,
                  ]);
                  const csvContent = [headers, ...rows]
                    .map((row) => row.join(","))
                    .join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${selectedBatch.name}_Students.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
              >
                📥 Download CSV
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setShowBatchDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
