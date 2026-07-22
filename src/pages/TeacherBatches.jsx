import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../css/Batches.css";

export default function TeacherBatches() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    timing: "",
    startDate: "",
    endDate: "",
    maxStudents: 30,
    fee: 0,
  });
  const [topicForm, setTopicForm] = useState({
    topic: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

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

      // 🆕 Filter students assigned to this teacher with matching subjects
      const assignedStudents = (studentsRes.data || []).filter(
        (s) => s.teacher?._id === user._id || s.teacher === user._id,
      );
      setStudents(assignedStudents);
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
      description: "",
      timing: "",
      startDate: "",
      endDate: "",
      maxStudents: 30,
      fee: 0,
    });
    setSelectedBatch(null);
    setShowModal(true);
  };

  const openEditBatch = (batch) => {
    setForm({
      name: batch.name,
      description: batch.description || "",
      timing: batch.timing || "",
      startDate: batch.startDate
        ? new Date(batch.startDate).toISOString().split("T")[0]
        : "",
      endDate: batch.endDate
        ? new Date(batch.endDate).toISOString().split("T")[0]
        : "",
      maxStudents: batch.maxStudents || 30,
      fee: batch.fee || 0,
    });
    setSelectedBatch(batch);
    setShowModal(true);
  };

  const openTopicModal = (batch) => {
    setSelectedBatch(batch);
    setTopicForm({
      topic: "",
      date: new Date().toISOString().split("T")[0],
    });
    setShowTopicModal(true);
  };

  const openStudentModal = (batch) => {
    setSelectedBatch(batch);
    // Pre-select students already in the batch
    const existingStudentIds = batch.students.map((s) => s._id || s);
    setSelectedStudents(existingStudentIds);
    setShowStudentModal(true);
  };

  const handleSaveBatch = async () => {
    if (!form.name) {
      showToast("Batch name is required", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        timing: form.timing,
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
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Error saving batch:", err);
      showToast(err.response?.data?.message || "Error saving batch", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTopic = async () => {
    if (!topicForm.topic) {
      showToast("Topic is required", "error");
      return;
    }

    try {
      await api.post(`/batches/${selectedBatch._id}/topics`, topicForm);
      showToast("Topic added successfully");
      setShowTopicModal(false);
      fetchData();
    } catch (err) {
      console.error("Error adding topic:", err);
      showToast("Error adding topic", "error");
    }
  };

  const handleAddStudentsToBatch = async () => {
    if (selectedStudents.length === 0) {
      showToast("Please select at least one student", "error");
      return;
    }

    try {
      setSaving(true);
      const response = await api.post(
        `/batches/${selectedBatch._id}/add-students`,
        {
          studentIds: selectedStudents,
        },
      );

      showToast(response.data.message || "Students added successfully");
      setShowStudentModal(false);
      fetchData();
    } catch (err) {
      console.error("Error adding students:", err);
      showToast(
        err.response?.data?.message || "Error adding students",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const handleDeleteBatch = async (id, name) => {
    if (!window.confirm(`Delete batch "${name}"?`)) return;
    try {
      await api.delete(`/batches/${id}`);
      showToast("Batch deleted");
      fetchData();
    } catch (err) {
      showToast("Error deleting batch", "error");
    }
  };

  const handleRemoveStudent = async (batchId, studentId, studentName) => {
    if (!window.confirm(`Remove "${studentName}" from this batch?`)) return;
    try {
      await api.delete(`/batches/${batchId}/students/${studentId}`);
      showToast(`Removed ${studentName} from batch`);
      fetchData();
    } catch (err) {
      showToast("Error removing student", "error");
    }
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
          <h1 className="page-title">My Batches</h1>
          <p className="page-subtitle">
            Create and manage your teaching batches
          </p>
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
          </div>
        ) : (
          <div className="batches-grid">
            {batches.map((batch) => (
              <div key={batch._id} className="batch-card">
                <div className="batch-header">
                  <h3 className="batch-name">{batch.name}</h3>
                  <span
                    className={`batch-status status-${batch.status || "active"}`}
                  >
                    {batch.status || "active"}
                  </span>
                </div>

                <div className="batch-details">
                  {batch.timing && (
                    <div className="batch-info-row">
                      <span>🕐 {batch.timing}</span>
                    </div>
                  )}
                  <div className="batch-info-row">
                    <span>
                      👥 {batch.students?.length || 0}/
                      {batch.maxStudents || "∞"} students
                    </span>
                    <span>💰 ₹{batch.fee || 0}</span>
                  </div>
                  {batch.description && (
                    <p className="batch-desc">{batch.description}</p>
                  )}
                  {batch.startDate && (
                    <div className="batch-dates">
                      📅 {new Date(batch.startDate).toLocaleDateString()} →{" "}
                      {batch.endDate
                        ? new Date(batch.endDate).toLocaleDateString()
                        : "Ongoing"}
                    </div>
                  )}

                  {/* Topics Section */}
                  <div className="batch-topics" style={{ marginTop: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <strong style={{ fontSize: "13px" }}>
                        📝 Topics Covered
                      </strong>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openTopicModal(batch)}
                      >
                        + Add Topic
                      </button>
                    </div>
                    {batch.topics?.length > 0 ? (
                      <div
                        style={{
                          marginTop: "8px",
                          maxHeight: "100px",
                          overflowY: "auto",
                        }}
                      >
                        {batch.topics.map((t, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: "12px",
                              padding: "4px 0",
                              borderBottom: "1px solid var(--gray-100)",
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{t.topic}</span>
                            <span
                              style={{
                                color: "var(--gray-500)",
                                marginLeft: "8px",
                              }}
                            >
                              {t.date
                                ? new Date(t.date).toLocaleDateString()
                                : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--gray-500)",
                          marginTop: "4px",
                        }}
                      >
                        No topics added yet
                      </p>
                    )}
                  </div>

                  {/* Student List */}
                  {batch.students && batch.students.length > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      <strong style={{ fontSize: "13px" }}>👨‍🎓 Students:</strong>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                          marginTop: "4px",
                        }}
                      >
                        {batch.students.map((student) => (
                          <span
                            key={student._id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#f3f4f6",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                            }}
                          >
                            {student.name}
                            <button
                              onClick={() =>
                                handleRemoveStudent(
                                  batch._id,
                                  student._id,
                                  student.name,
                                )
                              }
                              style={{
                                background: "none",
                                border: "none",
                                color: "#dc2626",
                                cursor: "pointer",
                                fontSize: "14px",
                                padding: "0 2px",
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="batch-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => openStudentModal(batch)}
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
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Batch Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
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
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Batch Name *</label>
              <input
                className="form-control"
                placeholder="e.g. MERN Stack Batch 2026"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Timing</label>
              <input
                className="form-control"
                placeholder="e.g. Mon-Fri, 6 PM - 8 PM"
                value={form.timing}
                onChange={(e) => setForm({ ...form, timing: e.target.value })}
              />
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
                    setForm({ ...form, maxStudents: Number(e.target.value) })
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
                    setForm({ ...form, fee: Number(e.target.value) })
                  }
                />
              </div>
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

      {/* Add Topic Modal */}
      {showTopicModal && selectedBatch && (
        <div className="modal-overlay" onClick={() => setShowTopicModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "450px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                Add Topic to "{selectedBatch.name}"
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowTopicModal(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Topic *</label>
              <input
                className="form-control"
                placeholder="e.g. Introduction to React"
                value={topicForm.topic}
                onChange={(e) =>
                  setTopicForm({ ...topicForm, topic: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                value={topicForm.date}
                onChange={(e) =>
                  setTopicForm({ ...topicForm, date: e.target.value })
                }
              />
            </div>

            <div className="form-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowTopicModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddTopic}>
                Add Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Students Modal */}
      {showStudentModal && selectedBatch && (
        <div
          className="modal-overlay"
          onClick={() => setShowStudentModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "700px" }}
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

            <div className="modal-body">
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Select students to add to this batch.
                  <strong> Only students assigned to you are shown.</strong>
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      const allStudentIds = students.map((s) => s._id);
                      setSelectedStudents(allStudentIds);
                    }}
                  >
                    Select All
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelectedStudents([])}
                  >
                    Clear All
                  </button>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--gray-500)",
                      marginLeft: "8px",
                    }}
                  >
                    {selectedStudents.length} selected
                  </span>
                </div>
              </div>

              {students.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    padding: "20px",
                  }}
                >
                  No students assigned to you yet.
                  <br />
                  <span style={{ fontSize: "12px" }}>
                    (Students need to be assigned to you by an admin before you
                    can add them to batches)
                  </span>
                </p>
              ) : (
                <div
                  style={{
                    maxHeight: "400px",
                    overflowY: "auto",
                    border: "1px solid var(--gray-200)",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                >
                  {students.map((student) => {
                    const isInBatch = selectedBatch.students?.some(
                      (s) => s._id === student._id,
                    );
                    const isSelected = selectedStudents.includes(student._id);

                    return (
                      <label
                        key={student._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderBottom: "1px solid #eee",
                          cursor: isInBatch ? "not-allowed" : "pointer",
                          background: isInBatch
                            ? "#f3f4f6"
                            : isSelected
                              ? "#e0f2fe"
                              : "transparent",
                          borderRadius: "4px",
                          marginBottom: "2px",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleStudent(student._id)}
                          disabled={isInBatch}
                          style={{ marginRight: "10px" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{ fontWeight: isInBatch ? "normal" : "500" }}
                          >
                            {student.name}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--gray-500)",
                            }}
                          >
                            {student.email} • {student.phone}
                            {student.subjects &&
                              student.subjects.length > 0 &&
                              ` • ${student.subjects.join(", ")}`}
                          </div>
                        </div>
                        {isInBatch && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#16a34a",
                              fontWeight: "600",
                            }}
                          >
                            ✅ Already in batch
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowStudentModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddStudentsToBatch}
                disabled={saving || selectedStudents.length === 0}
              >
                {saving
                  ? "Adding..."
                  : `Add ${selectedStudents.length} Students`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
