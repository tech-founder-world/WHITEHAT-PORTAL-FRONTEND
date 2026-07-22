import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../css/Batches.css";

export default function AdminBatches() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Modal States
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showBatchDetailsModal, setShowBatchDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "custom",
    duration: "",
    durationType: "days",
    description: "",
    startDate: "",
    endDate: "",
    maxStudents: 30,
    createdBy: "",
    status: "active",
  });
  const [topicForm, setTopicForm] = useState({
    topic: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [editingTopicIndex, setEditingTopicIndex] = useState(null);

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

  // Helper: Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Helper: Format date for input field
  const formatDateForInput = (date) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter students when search changes
  useEffect(() => {
    if (!studentSearch.trim()) {
      setFilteredStudents(allStudents);
      return;
    }
    const search = studentSearch.toLowerCase().trim();
    const filtered = allStudents.filter((s) => {
      return (
        s.name.toLowerCase().includes(search) ||
        s.email?.toLowerCase().includes(search) ||
        s.fatherName?.toLowerCase().includes(search) ||
        s.phone?.includes(search)
      );
    });
    setFilteredStudents(filtered);
  }, [studentSearch, allStudents]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("📡 Fetching data...");

      const [batchesRes, studentsRes, teachersRes] = await Promise.all([
        api.get("/batches"),
        api.get("/students"),
        api.get("/admin/teachers"),
      ]);

      console.log("✅ Batches loaded:", batchesRes.data?.length || 0);
      console.log("✅ Students loaded:", studentsRes.data?.length || 0);
      console.log("✅ Teachers loaded:", teachersRes.data?.length || 0);

      setBatches(batchesRes.data || []);
      setAllStudents(studentsRes.data || []);
      setFilteredStudents(studentsRes.data || []);
      setAllTeachers(teachersRes.data || []);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
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
      createdBy: "",
      status: "active",
    });
    setSelectedBatch(null);
    setShowBatchModal(true);
  };

  const openEditBatch = (batch) => {
    console.log("✏️ Editing batch:", batch);
    console.log(
      "👨‍🏫 Current teacher ID:",
      batch.createdBy?._id || batch.createdBy,
    );

    setForm({
      name: batch.name || "",
      category: batch.category || "custom",
      duration: batch.duration?.toString() || "",
      durationType: batch.durationType || "days",
      description: batch.description || "",
      startDate: formatDateForInput(batch.startDate),
      endDate: formatDateForInput(batch.endDate),
      maxStudents: batch.maxStudents || 30,
      createdBy: batch.createdBy?._id || batch.createdBy || "",
      status: batch.status || "active",
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
    const existingIds = (batch.students || []).map((s) => s._id || s);
    setSelectedStudents(existingIds);
    setStudentSearch("");
    setShowStudentModal(true);
  };

  const openTopicModal = (batch, topicIndex = null) => {
    setSelectedBatch(batch);
    if (topicIndex !== null && batch.topics && batch.topics[topicIndex]) {
      setEditingTopicIndex(topicIndex);
      setTopicForm({
        topic: batch.topics[topicIndex].topic,
        date:
          batch.topics[topicIndex].date ||
          new Date().toISOString().split("T")[0],
      });
    } else {
      setEditingTopicIndex(null);
      setTopicForm({
        topic: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
    setShowTopicModal(true);
  };

  const handleCategoryChange = (category) => {
    const selected = categoryOptions.find((opt) => opt.value === category);
    setForm((prev) => ({
      ...prev,
      category: category,
      duration: selected?.duration?.toString() || "",
      durationType: selected?.durationType || "days",
      name: category !== "custom" ? `${selected?.label} Batch` : prev.name,
    }));
  };

  const handleSaveBatch = async () => {
    if (!form.name || !form.name.trim()) {
      showToast("Batch name is required", "error");
      return;
    }

    if (!form.duration || form.duration <= 0) {
      showToast("Duration is required and must be greater than 0", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        duration: Number(form.duration),
        durationType: form.durationType,
        description: form.description || "",
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        maxStudents: Number(form.maxStudents) || 30,
        createdBy: form.createdBy || null,
        status: form.status || "active",
      };

      console.log("📦 Sending payload:", payload);

      if (selectedBatch) {
        const response = await api.put(
          `/batches/${selectedBatch._id}`,
          payload,
        );
        console.log("✅ Update response:", response.data);
        showToast("Batch updated successfully");
      } else {
        const response = await api.post("/batches", payload);
        console.log("✅ Create response:", response.data);
        showToast("Batch created successfully");
      }

      setShowBatchModal(false);
      await fetchData();
    } catch (err) {
      console.error("❌ Error saving batch:", err);
      console.error("❌ Error response:", err.response?.data);
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
      if (editingTopicIndex !== null) {
        // Update existing topic
        const updatedTopics = [...selectedBatch.topics];
        updatedTopics[editingTopicIndex] = {
          topic: topicForm.topic,
          date: topicForm.date,
        };
        await api.put(`/batches/${selectedBatch._id}`, {
          topics: updatedTopics,
        });
        showToast("Topic updated successfully");
      } else {
        // Add new topic
        await api.post(`/batches/${selectedBatch._id}/topics`, topicForm);
        showToast("Topic added successfully");
      }
      setShowTopicModal(false);
      fetchData();
    } catch (err) {
      console.error("Error saving topic:", err);
      showToast("Error saving topic", "error");
    }
  };

  const handleDeleteTopic = async (batchId, topicIndex) => {
    if (!window.confirm("Delete this topic?")) return;
    try {
      const batch = batches.find((b) => b._id === batchId);
      if (!batch) return;

      const updatedTopics = batch.topics.filter((_, i) => i !== topicIndex);
      await api.put(`/batches/${batchId}`, { topics: updatedTopics });
      showToast("Topic deleted successfully");
      fetchData();
    } catch (err) {
      console.error("Error deleting topic:", err);
      showToast("Error deleting topic", "error");
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) {
      showToast("Please select at least one student", "error");
      return;
    }

    try {
      await api.put(`/batches/${selectedBatch._id}`, {
        studentIds: selectedStudents,
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

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;
    try {
      await api.delete(`/batches/${batchToDelete._id}`);
      showToast("Batch deleted successfully");
      setShowDeleteConfirm(false);
      setBatchToDelete(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Error deleting batch", "error");
    }
  };

  const confirmDelete = (batch) => {
    setBatchToDelete(batch);
    setShowDeleteConfirm(true);
  };

  const getDurationDisplay = (batch) => {
    if (!batch) return "Not specified";
    if (batch.duration === undefined || batch.duration === null) {
      return "Not specified";
    }
    const durationNum = Number(batch.duration);
    if (isNaN(durationNum) || durationNum === 0) {
      return "Not specified";
    }
    if (batch.durationType === "months") {
      return `${durationNum} month${durationNum > 1 ? "s" : ""}`;
    }
    return `${durationNum} day${durationNum > 1 ? "s" : ""}`;
  };

  const getCategoryBadge = (category) => {
    const colors = {
      silver: "#C0C0C0",
      platinum: "#E5E4E2",
      premium: "#FFD700",
      custom: "#666",
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

  const getFilteredBatches = () => {
    if (filterStatus === "all") return batches;
    return batches.filter((b) => b.status === filterStatus);
  };

  const getTeacherName = (batch) => {
    if (!batch.createdBy) return "Not assigned";
    if (typeof batch.createdBy === "object" && batch.createdBy.name) {
      return batch.createdBy.name;
    }
    const teacher = allTeachers.find((t) => t._id === batch.createdBy);
    return teacher ? teacher.name : "Unknown";
  };

  const downloadCSV = (batch) => {
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
    const rows =
      batch.students?.map((s, i) => [
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
      ]) || [];

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batch.name}_Students.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate stats
  const stats = {
    total: batches.length,
    active: batches.filter((b) => b.status === "active").length,
    completed: batches.filter((b) => b.status === "completed").length,
    archived: batches.filter((b) => b.status === "archived").length,
    totalStudents: batches.reduce(
      (sum, b) => sum + (b.students?.length || 0),
      0,
    ),
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
          <h1 className="page-title">Batch Management</h1>
          <p className="page-subtitle">
            Manage all batches across the institution
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateBatch}>
          + New Batch
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-label">Total Batches</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #4caf50" }}>
          <div className="stat-label">Active</div>
          <div className="stat-value" style={{ color: "#4caf50" }}>
            {stats.active}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #2196f3" }}>
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: "#2196f3" }}>
            {stats.completed}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #ff9800" }}>
          <div className="stat-label">Total Students</div>
          <div className="stat-value" style={{ color: "#ff9800" }}>
            {stats.totalStudents}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            className={`btn ${filterStatus === "all" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilterStatus("all")}
          >
            All ({stats.total})
          </button>
          <button
            className={`btn ${filterStatus === "active" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilterStatus("active")}
          >
            Active ({stats.active})
          </button>
          <button
            className={`btn ${filterStatus === "completed" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilterStatus("completed")}
          >
            Completed ({stats.completed})
          </button>
          <button
            className={`btn ${filterStatus === "archived" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilterStatus("archived")}
          >
            Archived ({stats.archived})
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-wrapper">
            <div className="spinner" />
            <p>Loading...</p>
          </div>
        ) : getFilteredBatches().length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p>No batches found</p>
            <button
              className="btn btn-primary"
              onClick={openCreateBatch}
              style={{ marginTop: "12px" }}
            >
              Create your first batch
            </button>
          </div>
        ) : (
          <div className="batches-grid">
            {getFilteredBatches().map((batch) => {
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
                      <span>👥 {batch.students?.length || 0} students</span>
                      <span>📋 Max: {batch.maxStudents || "∞"}</span>
                    </div>

                    {batch.description && (
                      <p className="batch-desc">{batch.description}</p>
                    )}
                    {batch.startDate && (
                      <div className="batch-dates">
                        📅 {formatDate(batch.startDate)} →{" "}
                        {batch.endDate ? formatDate(batch.endDate) : "Ongoing"}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text-muted)",
                        marginTop: "4px",
                      }}
                    >
                      👨‍🏫 Teacher: {getTeacherName(batch)}
                    </div>

                    {/* Topics Section - Now Editable */}
                    <div className="batch-topics" style={{ marginTop: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <strong style={{ fontSize: "13px" }}>
                          📝 Topics Covered ({batch.topics?.length || 0})
                        </strong>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openTopicModal(batch)}
                        >
                          + Add Topic
                        </button>
                      </div>
                      {batch.topics?.length > 0 ? (
                        <div
                          style={{
                            marginTop: "8px",
                            maxHeight: "150px",
                            overflowY: "auto",
                          }}
                        >
                          {batch.topics.map((t, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "12px",
                                padding: "4px 0",
                                borderBottom: "1px solid var(--gray-100)",
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 600 }}>
                                  {t.topic}
                                </span>
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
                              <div style={{ display: "flex", gap: "4px" }}>
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={() => openTopicModal(batch, i)}
                                  style={{
                                    padding: "2px 6px",
                                    fontSize: "10px",
                                  }}
                                >
                                  ✏️
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() =>
                                    handleDeleteTopic(batch._id, i)
                                  }
                                  style={{
                                    padding: "2px 6px",
                                    fontSize: "10px",
                                  }}
                                >
                                  ×
                                </button>
                              </div>
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
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => confirmDelete(batch)}
                    >
                      🗑️ Delete
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
            <div className="form-group">
              <label className="form-label">Max Students</label>
              <input
                type="number"
                className="form-control"
                value={form.maxStudents}
                min={1}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxStudents: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Assign Teacher</label>
              <select
                className="form-control"
                value={form.createdBy}
                onChange={(e) =>
                  setForm({ ...form, createdBy: e.target.value })
                }
              >
                <option value="">None</option>
                {allTeachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
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

      {/* ADD STUDENTS MODAL WITH SEARCH */}
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
                </p>

                {/* Search Bar */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    marginBottom: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{ flex: 1, minWidth: "200px", position: "relative" }}
                  >
                    <input
                      className="form-control"
                      placeholder="🔍 Search students by name, email, father name..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      style={{ paddingRight: "40px" }}
                    />
                    {studentSearch && (
                      <button
                        onClick={() => setStudentSearch("")}
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
                  <div style={{ fontSize: "12px", color: "var(--gray-500)" }}>
                    {filteredStudents.length} of {allStudents.length} students
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      const allStudentIds = filteredStudents.map((s) => s._id);
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

              {allStudents.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  No students found in the system.
                </p>
              ) : filteredStudents.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "var(--gray-500)",
                  }}
                >
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>
                    🔍
                  </div>
                  <p>
                    No students found matching "<strong>{studentSearch}</strong>
                    "
                  </p>
                  <button
                    onClick={() => setStudentSearch("")}
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: "8px" }}
                  >
                    Clear Search
                  </button>
                </div>
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
                  {filteredStudents.map((student) => {
                    const isAlreadyInBatch = selectedBatch.students?.some(
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
                          cursor: isAlreadyInBatch ? "not-allowed" : "pointer",
                          background: isAlreadyInBatch
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
                          className="student-checkbox"
                          value={student._id}
                          checked={isSelected}
                          onChange={() => {
                            if (!isAlreadyInBatch) {
                              toggleStudent(student._id);
                            }
                          }}
                          disabled={isAlreadyInBatch}
                          style={{ marginRight: "10px" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: isAlreadyInBatch ? "normal" : "500",
                            }}
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
                        {isAlreadyInBatch && (
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
                onClick={handleAddStudents}
                disabled={selectedStudents.length === 0}
              >
                Add {selectedStudents.length} Students
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT TOPIC MODAL */}
      {showTopicModal && selectedBatch && (
        <div className="modal-overlay" onClick={() => setShowTopicModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "450px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTopicIndex !== null ? "Edit Topic" : "Add Topic"} to "
                {selectedBatch.name}"
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

            {editingTopicIndex !== null && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#f59e0b",
                  padding: "8px",
                  background: "#fef3c7",
                  borderRadius: "6px",
                  marginBottom: "12px",
                }}
              >
                ⚠️ You are editing an existing topic. Changes will be saved.
              </div>
            )}

            <div className="form-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowTopicModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddTopic}>
                {editingTopicIndex !== null ? "Update Topic" : "Add Topic"}
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
              <button
                className="btn btn-outline"
                onClick={() => downloadCSV(selectedBatch)}
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

      {/* DELETE CONFIRMATION */}
      {showDeleteConfirm && batchToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "400px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button
                className="modal-close"
                onClick={() => setShowDeleteConfirm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete batch{" "}
                <strong>"{batchToDelete.name}"</strong>? This will remove all
                students from this batch.
              </p>
            </div>
            <div className="form-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteBatch}>
                Delete Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
