import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../css/Batches.css";

export default function CounsellorBatches() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showBatchDetailsModal, setShowBatchDetailsModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter batches when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBatches(batches);
      return;
    }
    const search = searchTerm.toLowerCase().trim();
    const filtered = batches.filter((batch) => {
      return (
        batch.name.toLowerCase().includes(search) ||
        (batch.description &&
          batch.description.toLowerCase().includes(search)) ||
        (batch.createdBy?.name &&
          batch.createdBy.name.toLowerCase().includes(search)) ||
        (batch.students || []).some((student) =>
          student.name.toLowerCase().includes(search),
        )
      );
    });
    setFilteredBatches(filtered);
  }, [searchTerm, batches]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("📡 Counsellor fetching batches...");
      const batchesRes = await api.get("/batches");
      console.log("✅ Batches loaded:", batchesRes.data?.length || 0);
      setBatches(batchesRes.data || []);
      setFilteredBatches(batchesRes.data || []);
    } catch (err) {
      console.error("❌ Error fetching batches:", err);
      showToast("Error loading batches", "error");
    } finally {
      setLoading(false);
    }
  };

  const openBatchDetails = (batch) => {
    setSelectedBatch(batch);
    setShowBatchDetailsModal(true);
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

  const getTeacherName = (batch) => {
    if (!batch.createdBy) return "Not assigned";
    if (typeof batch.createdBy === "object" && batch.createdBy.name) {
      return batch.createdBy.name;
    }
    return "Unknown";
  };

  const clearSearch = () => {
    setSearchTerm("");
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

      <div className="page-header">
        <div>
          <h1 className="page-title">📚 Batches</h1>
          <p className="page-subtitle">
            View all batches and their students (Read-Only)
          </p>
        </div>
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

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
            <input
              className="form-control"
              placeholder="🔍 Search batches by name, teacher, or student..."
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
          <div style={{ fontSize: "13px", color: "var(--gray-600)" }}>
            {searchTerm ? (
              <span>
                Found <strong>{filteredBatches.length}</strong> of{" "}
                {batches.length} batches
                {filteredBatches.length !== batches.length && (
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
              <span>Total: {batches.length} batches</span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-wrapper">
            <div className="spinner" />
            <p>Loading...</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{searchTerm ? "🔍" : "📚"}</div>
            <p>
              {searchTerm
                ? `No batches found matching "${searchTerm}"`
                : "No batches available to view."}
            </p>
            {searchTerm && (
              <button
                className="btn btn-outline btn-sm"
                onClick={clearSearch}
                style={{ marginTop: "8px" }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="batches-grid">
            {filteredBatches.map((batch) => {
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
                    {batch.timing && (
                      <div
                        className="batch-timing"
                        style={{
                          fontSize: "13px",
                          color: "var(--text-muted)",
                          marginTop: "4px",
                        }}
                      >
                        🕐 {batch.timing}
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

                    {/* Topics Section - Read Only */}
                    {batch.topics && batch.topics.length > 0 && (
                      <div
                        className="batch-topics"
                        style={{ marginTop: "12px" }}
                      >
                        <strong style={{ fontSize: "13px" }}>
                          📝 Topics Covered ({batch.topics.length})
                        </strong>
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
                      </div>
                    )}
                  </div>

                  <div className="batch-actions">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => openBatchDetails(batch)}
                      style={{ flex: 1 }}
                    >
                      👁️ View Students
                    </button>
                    {/* Read-only indicator */}
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--gray-400)",
                        padding: "4px 8px",
                        background: "var(--gray-50)",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      🔒 Read Only
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEW BATCH DETAILS MODAL - Read Only */}
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
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--gray-400)",
                    marginLeft: "12px",
                    fontWeight: "normal",
                  }}
                >
                  (Read-Only)
                </span>
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
                  const rows =
                    selectedBatch.students?.map((s, i) => [
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
