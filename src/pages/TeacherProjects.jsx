import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../css/Projects.css";

export default function TeacherProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    subject: "",
    startDate: "",
    endDate: "",
    students: [],
    maxScore: 100,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const subjects = user?.subjects || [];

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter students when search changes
  useEffect(() => {
    const search = studentSearch.toLowerCase();
    setFilteredStudents(
      students.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.rollNumber.toLowerCase().includes(search),
      ),
    );
  }, [studentSearch, students]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, studentsRes] = await Promise.all([
        api.get("/projects"),
        api.get("/students"),
      ]);
      setProjects(projectsRes.data || []);
      setStudents(studentsRes.data || []);
      setFilteredStudents(studentsRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      showToast("Error loading data", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreateProject = () => {
    setForm({
      name: "",
      description: "",
      subject: subjects[0] || "",
      startDate: "",
      endDate: "",
      students: [],
      maxScore: 100,
    });
    setSelectedProject(null);
    setShowModal(true);
  };

  const openEditProject = (project) => {
    setForm({
      name: project.name,
      description: project.description || "",
      subject: project.subject,
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      students: project.students.map((s) => s._id || s),
      maxScore: project.maxScore || 100,
    });
    setSelectedProject(project);
    setShowModal(true);
  };

  const openAddStudents = (project) => {
    setSelectedProject(project);
    const existingIds = project.students.map((s) => s._id || s);
    setForm((prev) => ({
      ...prev,
      students: existingIds,
    }));
    setStudentSearch("");
    setShowStudentModal(true);
  };

  const handleSaveProject = async () => {
    if (!form.name || !form.subject) {
      showToast("Project name and subject required", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        subject: form.subject,
        startDate: form.startDate,
        endDate: form.endDate,
        students: form.students,
        maxScore: form.maxScore,
      };

      if (selectedProject) {
        await api.put(`/projects/${selectedProject._id}`, payload);
        showToast("Project updated successfully");
      } else {
        await api.post("/projects", payload);
        showToast("Project created successfully");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Error saving project:", err);
      showToast(err.response?.data?.message || "Error saving project", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleStudent = (studentId) => {
    setForm((prev) => ({
      ...prev,
      students: prev.students.includes(studentId)
        ? prev.students.filter((id) => id !== studentId)
        : [...prev.students, studentId],
    }));
  };

  const handleDeleteProject = async (id, name) => {
    if (
      !window.confirm(
        `Delete project "${name}"? This will also remove all evaluations.`,
      )
    )
      return;
    try {
      await api.delete(`/projects/${id}`);
      showToast("Project deleted");
      fetchData();
    } catch (err) {
      showToast("Error deleting project", "error");
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
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Create and manage student projects</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateProject}>
          + New Project
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-wrapper">
            <div className="spinner" />
            <p>Loading...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <p>No projects created yet</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Create a project and add students to it
            </p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project._id} className="project-card">
                <div className="project-header">
                  <h3 className="project-name">{project.name}</h3>
                  <span
                    className={`project-status status-${project.status || "active"}`}
                  >
                    {project.status || "active"}
                  </span>
                </div>
                <div className="project-details">
                  <p className="project-subject">📚 {project.subject}</p>
                  <p className="project-desc">
                    {project.description || "No description"}
                  </p>
                  <div className="project-students">
                    <span>👥 {project.students?.length || 0} students</span>
                  </div>
                  {project.startDate && (
                    <div className="project-dates">
                      📅 {project.startDate} → {project.endDate || "Ongoing"}
                    </div>
                  )}
                </div>
                <div className="project-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => openAddStudents(project)}
                  >
                    + Add Students
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => openEditProject(project)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() =>
                      handleDeleteProject(project._id, project.name)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedProject ? "Edit Project" : "Create New Project"}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                className="form-control"
                placeholder="e.g. AI Research Project"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select
                className="form-control"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                placeholder="Project description..."
                rows="3"
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
              <label className="form-label">Max Score</label>
              <input
                type="number"
                className="form-control"
                value={form.maxScore}
                min={1}
                onChange={(e) =>
                  setForm({ ...form, maxScore: parseInt(e.target.value) })
                }
              />
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
                onClick={handleSaveProject}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : selectedProject
                    ? "Update Project"
                    : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Students Modal with Search */}
      {showStudentModal && selectedProject && (
        <div
          className="modal-overlay"
          onClick={() => setShowStudentModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "550px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                Add Students to "{selectedProject.name}"
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowStudentModal(false)}
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
              Select students who will participate in this project
            </p>

            {/* Search Input */}
            <div className="form-group" style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  className="form-control"
                  placeholder="🔍 Search students by name or roll number..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{ flex: 1 }}
                />
                {studentSearch && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setStudentSearch("")}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--gray-500)",
                  marginTop: "4px",
                }}
              >
                {filteredStudents.length} students found
              </div>
            </div>

            <div className="student-select-grid">
              {filteredStudents.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "var(--gray-500)",
                  }}
                >
                  No students found matching "{studentSearch}"
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <label key={student._id} className="student-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.students.includes(student._id)}
                      onChange={() => toggleStudent(student._id)}
                    />
                    <span>{student.name}</span>
                    <span className="roll-number">{student.rollNumber}</span>
                  </label>
                ))
              )}
            </div>

            <div className="selected-count">
              Selected: <strong>{form.students.length}</strong> students
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
                onClick={async () => {
                  try {
                    await api.post(
                      `/projects/${selectedProject._id}/students`,
                      {
                        studentIds: form.students,
                      },
                    );
                    showToast("Students added successfully");
                    setShowStudentModal(false);
                    fetchData();
                  } catch (err) {
                    console.error("Error adding students:", err);
                    showToast("Error adding students", "error");
                  }
                }}
              >
                Add Students
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
