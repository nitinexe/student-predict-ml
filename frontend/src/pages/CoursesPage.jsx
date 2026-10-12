import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Menu, Plus, Trash2 } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import DashboardSidebar from "../components/DashboardSidebar";
import "./DashboardPage.css";

const emptyCourse = {
  education_level: "",
  course_name: "",
  semester: "",
  subjects: "",
  learning_goal: "",
  study_hours_per_week: "5",
};

export default function CoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyCourse);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCourses = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("student_courses")
      .select(
        "id, education_level, course_name, semester, subjects, learning_goal, study_hours_per_week, is_active"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (queryError) {
      setError("Could not load your courses. Check the database setup and retry.");
    } else {
      setCourses(data ?? []);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    loadCourses();
  }, [authLoading, user, navigate, loadCourses]);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setError("");
    setNotice("");
  }

  async function addCourse(event) {
    event.preventDefault();
    if (!user) return;

    const subjects = form.subjects
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean);

    if (!subjects.length) {
      setError("Add at least one subject, separated by commas.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const { error: insertError } = await supabase
      .from("student_courses")
      .insert({
        user_id: user.id,
        education_level: form.education_level,
        course_name: form.course_name.trim(),
        semester: form.semester.trim() || null,
        subjects,
        learning_goal: form.learning_goal.trim() || null,
        study_hours_per_week: Number(form.study_hours_per_week),
        is_active: courses.length === 0,
      });

    if (insertError) {
      setError("Could not save this course. Please retry.");
    } else {
      setForm(emptyCourse);
      setNotice("Course saved.");
      await loadCourses();
    }

    setSaving(false);
  }

  async function selectCourse(courseId) {
    if (!user) return;

    setError("");
    const { error: updateError } = await supabase
      .from("student_courses")
      .update({ is_active: false })
      .eq("user_id", user.id);

    if (!updateError) {
      const { error: activateError } = await supabase
        .from("student_courses")
        .update({ is_active: true })
        .eq("id", courseId)
        .eq("user_id", user.id);

      if (activateError) {
        setError("Could not switch courses. Please retry.");
      } else {
        setNotice("Active course updated.");
      }
    } else {
      setError("Could not switch courses. Please retry.");
    }

    await loadCourses();
  }

  async function deleteCourse(courseId) {
    if (!user) return;

    const { error: deleteError } = await supabase
      .from("student_courses")
      .delete()
      .eq("id", courseId)
      .eq("user_id", user.id);

    if (deleteError) {
      setError("Could not delete this course. Please retry.");
    } else {
      setNotice("Course deleted.");
    }

    await loadCourses();
  }

  return (
    <div className="dashboard-shell">
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-menu-button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="dashboard-breadcrumb">
            <Link to="/dashboard">Workspace</Link>
            <span>/</span>
            <strong>My courses</strong>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div>
              <span className="dashboard-eyebrow">
                <BookOpen size={15} /> YOUR LEARNING WORKSPACES
              </span>
              <h1>My courses<span>.</span></h1>
              <p>
                Choose the courses and subjects you want EduPredict to
                personalize for you.
              </p>
            </div>
          </section>

          {error && <div className="dashboard-error" role="alert">{error}</div>}
          {notice && <p role="status">{notice}</p>}

          <section className="dashboard-lower-grid">
            <article className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <h2>Your courses</h2>
                  <p>Only courses linked to your account appear here.</p>
                </div>
              </div>

              {loading ? (
                <div className="dashboard-loading">
                  <span className="dashboard-loader" />
                  <p>Loading your courses…</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="dashboard-empty-state">
                  <BookOpen size={26} />
                  <p>You haven’t added a course yet.</p>
                </div>
              ) : (
                <div className="course-list">
                  {courses.map((course) => (
                    <article className="course-card" key={course.id}>
                      <div>
                        <span>{course.education_level}</span>
                        <h3>{course.course_name}</h3>
                        <p>
                          {course.semester || "Semester not set"} ·{" "}
                          {course.study_hours_per_week} study hours/week
                        </p>
                        <p><strong>Subjects:</strong> {course.subjects.join(", ")}</p>
                        {course.learning_goal && (
                          <p><strong>Goal:</strong> {course.learning_goal}</p>
                        )}
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => selectCourse(course.id)}
                          disabled={course.is_active}
                        >
                          {course.is_active ? "Current course" : "Select"}
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${course.course_name}`}
                          onClick={() => deleteCourse(course.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <h2>Add a course</h2>
                  <p>Use commas between subjects.</p>
                </div>
              </div>

              <form className="course-form" onSubmit={addCourse}>
                <label>
                  Education level
                  <select
                    name="education_level"
                    value={form.education_level}
                    onChange={updateField}
                    required
                  >
                    <option value="">Choose a level</option>
                    <option>High school</option>
                    <option>Undergraduate</option>
                    <option>Postgraduate</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  Course name
                  <input
                    name="course_name"
                    value={form.course_name}
                    onChange={updateField}
                    placeholder="e.g. BSc Computer Science"
                    required
                  />
                </label>

                <label>
                  Semester or year
                  <input
                    name="semester"
                    value={form.semester}
                    onChange={updateField}
                    placeholder="e.g. Semester 2"
                  />
                </label>

                <label>
                  Subjects
                  <input
                    name="subjects"
                    value={form.subjects}
                    onChange={updateField}
                    placeholder="e.g. Mathematics, Programming"
                    required
                  />
                </label>

                <label>
                  Learning goal
                  <textarea
                    name="learning_goal"
                    value={form.learning_goal}
                    onChange={updateField}
                    placeholder="What would you like to improve?"
                    rows={3}
                  />
                </label>

                <label>
                  Study hours per week
                  <input
                    type="number"
                    name="study_hours_per_week"
                    min="0"
                    max="168"
                    step="0.5"
                    value={form.study_hours_per_week}
                    onChange={updateField}
                    required
                  />
                </label>

                <button
                  className="dashboard-primary-button"
                  type="submit"
                  disabled={saving}
                >
                  <Plus size={17} />
                  {saving ? "Saving…" : "Save course"}
                </button>
              </form>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}