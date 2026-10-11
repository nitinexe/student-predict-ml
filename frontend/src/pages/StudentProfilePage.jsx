import { Menu } from "lucide-react";
import DashboardSidebar from "../components/DashboardSidebar";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Pencil,
  Clock3,
  UserRound,
  CalendarDays,
  BookOpen,
  X,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import "./StudentProfilePage.css";

const initialForm = {
  full_name: "",
  age: "",
  education_level: "",
  study_hours_per_week: "",
};

function isComplete(profile) {
  return Boolean(
    profile?.full_name?.trim() &&
    profile?.age !== "" &&
    profile?.age != null &&
    profile?.education_level?.trim() &&
    profile?.study_hours_per_week !== "" &&
    profile?.study_hours_per_week != null
  );
}

function toForm(profile) {
  return {
    full_name: profile?.full_name ?? "",
    age: profile?.age?.toString() ?? "",
    education_level: profile?.education_level ?? "",
    study_hours_per_week:
      profile?.study_hours_per_week?.toString() ?? "",
  };
}

export default function StudentProfilePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [profile, setProfile] = useState(null);
  const [profileExists, setProfileExists] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProfile() {
    if (!user) return;

    setPageLoading(true);
    setLoadError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("student_profiles")
        .select(
          "full_name, age, education_level, study_hours_per_week, updated_at"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const metadata = user.user_metadata ?? {};
      const fallbackName =
        metadata.full_name ||
        metadata.name ||
        user.email?.split("@")[0] ||
        "";

      const loadedForm = toForm(data);

      // Use the account name as a form suggestion, not as proof
      // that a student profile has already been completed.
      if (!data) {
        loadedForm.full_name = fallbackName;
      }

      setProfile(data ?? null);
      setProfileExists(isComplete(data));
      setForm(loadedForm);
      setEditing(!isComplete(data));
    } catch (fetchError) {
      console.error("Profile load failed:", fetchError.message);
      setLoadError(
        "We couldn't load your profile. Please try again."
      );
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    loadProfile();
    // loadProfile is intentionally triggered when the signed-in user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, navigate]);

  const completedFields = [
    form.full_name.trim(),
    form.age,
    form.education_level,
    form.study_hours_per_week,
  ].filter(Boolean).length;

  const completion = Math.round((completedFields / 4) * 100);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  }

  function cancelEditing() {
    setForm(toForm(profile));
    setEditing(false);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("Please sign in to save your student profile.");
      return;
    }

    const age = Number(form.age);
    const studyHours = Number(form.study_hours_per_week);

    if (!form.full_name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!Number.isInteger(age) || age < 10 || age > 100) {
      setError("Enter a valid age between 10 and 100.");
      return;
    }

    if (
      form.study_hours_per_week === "" ||
      !Number.isFinite(studyHours) ||
      studyHours < 0 ||
      studyHours > 168
    ) {
      setError("Study hours must be between 0 and 168 per week.");
      return;
    }

    if (!form.education_level) {
      setError("Please select your education level.");
      return;
    }

    setSaving(true);

    const savedProfile = {
      full_name: form.full_name.trim(),
      age,
      education_level: form.education_level,
      study_hours_per_week: studyHours,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error: saveError } = await supabase
        .from("student_profiles")
        .upsert(
          {
            user_id: user.id,
            ...savedProfile,
          },
          { onConflict: "user_id" }
        );

      if (saveError) throw saveError;

      setProfile(savedProfile);
      setForm(toForm(savedProfile));
      setProfileExists(true);
      setEditing(false);
      setSuccess("Your student profile has been saved.");
    } catch (saveError) {
      console.error("Profile save failed:", saveError.message);
      setError("We couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || pageLoading) {
  return (
    <div className="dashboard-shell">
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="dashboard-main">
        <button
          type="button"
          className="profile-mobile-menu"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="profile-main-content">
          <div className="profile-loading">
            <div className="profile-loading-spinner" />
            <p>Loading your profile...</p>
          </div>
        </div>
      </main>
    </div>
  );
}

  if (!user) return null;

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Student";

  return (
  <div className="dashboard-shell">
    <DashboardSidebar
      mobileOpen={mobileOpen}
      onClose={() => setMobileOpen(false)}
    />

    <main className="dashboard-main">
      <button
        type="button"
        className="profile-mobile-menu"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu size={22} />
      </button>

      <div className="profile-main-content">
        {

          <main className="student-profile-page">
      <header className="profile-topbar">
        <Link to="/" className="profile-brand">
          <span className="profile-brand-icon">
            <GraduationCap size={22} />
          </span>
          <span>
            Edu<span>Predict</span>
            <small>STUDENT INTELLIGENCE</small>
          </span>
        </Link>

        <span className="profile-step-label">
          {profileExists && !editing
            ? "MY STUDENT PROFILE"
            : editing && profileExists
              ? "EDIT STUDENT PROFILE"
              : "STUDENT ONBOARDING"}
        </span>
      </header>

      <section className="profile-layout">
        <div className="profile-intro">
          <span className="profile-kicker">
            <span className="profile-kicker-dot" />
            YOUR LEARNING JOURNEY
          </span>

          <h1>
            {profileExists && !editing ? (
              <>
                Your profile,
                <br />
                <span>your progress.</span>
              </>
            ) : profileExists ? (
              <>
                Update your
                <br />
                <span>details.</span>
              </>
            ) : (
              <>
                Let's get to know
                <br />
                <span>you better.</span>
              </>
            )}
          </h1>

          <p>
            {profileExists && !editing
              ? "Review your student information here. You can edit your details whenever they change."
              : "Complete your student profile to personalize your EduPredict experience. You can update these details later."}
          </p>

          <div className="profile-benefit">
            <span className="profile-benefit-icon">
              <CheckCircle2 size={19} />
            </span>
            <div>
              <strong>
                {profileExists && !editing
                  ? "Your profile is complete"
                  : "A more personalized dashboard"}
              </strong>
              <p>
                {profileExists && !editing
                  ? "Your saved student details are available in one place."
                  : "Your information helps personalize your student experience and performance tracking."}
              </p>
            </div>
          </div>
        </div>

        <section className="profile-card">
          {loadError ? (
            <div className="profile-empty-state">
              <h2>Couldn't load your profile</h2>
              <p>{loadError}</p>
              <button
                type="button"
                className="profile-submit"
                onClick={loadProfile}
              >
                <RefreshCw size={17} />
                Try again
              </button>
            </div>
          ) : profileExists && !editing ? (
            <>
              <div className="profile-card-heading">
                <div>
                  <span className="profile-card-kicker">
                    STUDENT ACCOUNT
                  </span>
                  <h2>Profile details</h2>
                  <p>Your saved student information.</p>
                </div>

                <button
                  type="button"
                  className="profile-edit-button"
                  onClick={() => {
                    setForm(toForm(profile));
                    setEditing(true);
                    setError("");
                    setSuccess("");
                  }}
                >
                  <Pencil size={16} />
                  Edit profile
                </button>
              </div>

              <div className="profile-detail-hero">
                <div className="profile-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="profile-detail-hero-text">
                  <h3>{displayName}</h3>
                  <p>{user.email}</p>
                  <span className="profile-complete-badge">
                    <CheckCircle2 size={14} />
                    Profile complete
                  </span>
                </div>
              </div>

              <div className="profile-details-grid">
                <div className="profile-detail-item">
                  <span className="profile-detail-icon">
                    <UserRound size={18} />
                  </span>
                  <div>
                    <span>Full name</span>
                    <strong>{profile.full_name}</strong>
                  </div>
                </div>

                <div className="profile-detail-item">
                  <span className="profile-detail-icon">
                    <CalendarDays size={18} />
                  </span>
                  <div>
                    <span>Age</span>
                    <strong>{profile.age} years</strong>
                  </div>
                </div>

                <div className="profile-detail-item">
                  <span className="profile-detail-icon">
                    <GraduationCap size={18} />
                  </span>
                  <div>
                    <span>Education level</span>
                    <strong>{profile.education_level}</strong>
                  </div>
                </div>

                <div className="profile-detail-item">
                  <span className="profile-detail-icon">
                    <Clock3 size={18} />
                  </span>
                  <div>
                    <span>Study hours per week</span>
                    <strong>
                      {profile.study_hours_per_week} hours
                    </strong>
                  </div>
                </div>

                <div className="profile-detail-item profile-detail-email">
                  <span className="profile-detail-icon">
                    <BookOpen size={18} />
                  </span>
                  <div>
                    <span>Account email</span>
                    <strong>{user.email || "Not available"}</strong>
                  </div>
                </div>
              </div>

              {profile.updated_at && (
                <p className="profile-updated-note">
                  Last updated:{" "}
                  {new Date(profile.updated_at).toLocaleDateString(
                    undefined,
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              )}

              {success && (
                <p className="profile-alert" role="status">
                  {success}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="profile-card-heading">
                <div>
                  <span className="profile-card-kicker">
                    {profileExists ? "EDIT YOUR DETAILS" : "GETTING STARTED"}
                  </span>
                  <h2>
                    {profileExists
                      ? "Edit student profile"
                      : "Complete your profile"}
                  </h2>
                  <p>
                    {profileExists
                      ? "Update your information and save your changes."
                      : "Fill in these details to create your student profile."}
                  </p>
                </div>

                <div className="profile-progress-value">
                  {completion}%
                </div>
              </div>

              <div
                className="profile-progress-track"
                role="progressbar"
                aria-label="Profile completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completion}
              >
                <div
                  className="profile-progress-fill"
                  style={{ width: `${completion}%` }}
                />
              </div>

              <form
                className="student-profile-form"
                onSubmit={handleSubmit}
              >
                <label className="profile-field">
                  Full name
                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </label>

                <div className="profile-form-row">
                  <label className="profile-field">
                    Age
                    <input
                      type="number"
                      name="age"
                      value={form.age}
                      onChange={handleChange}
                      placeholder="Your age"
                      min="10"
                      max="100"
                      step="1"
                      required
                    />
                  </label>

                  <label className="profile-field">
                    Education level
                    <select
                      name="education_level"
                      value={form.education_level}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>
                        Select level
                      </option>
                      <option value="High school">High school</option>
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                </div>

                <label className="profile-field">
                  Study hours per week
                  <div className="profile-input-suffix">
                    <input
                      type="number"
                      name="study_hours_per_week"
                      value={form.study_hours_per_week}
                      onChange={handleChange}
                      placeholder="e.g. 12"
                      min="0"
                      max="168"
                      step="0.5"
                      required
                    />
                    <span>hours / week</span>
                  </div>
                  <small>
                    Your approximate total study time in a typical week.
                  </small>
                </label>

                {error && (
                  <p
                    className="profile-alert profile-alert-error"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <div className="profile-form-actions">
                  <button
                    className="profile-submit"
                    type="submit"
                    disabled={saving || completion !== 100}
                  >
                    {saving
                      ? "Saving profile..."
                      : profileExists
                        ? "Save changes"
                        : "Save and continue"}
                    {!saving && <ArrowRight size={17} />}
                  </button>

                  {profileExists && (
                    <button
                      type="button"
                      className="profile-cancel-button"
                      onClick={cancelEditing}
                      disabled={saving}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  )}
                </div>

                <p className="profile-form-note">
                  Your profile is private and linked to your account.
                </p>
              </form>
            </>
          )}
        </section>
      </section>

      <footer className="profile-footer">
        <Link to="/dashboard">
          <ArrowLeft size={14} />
          Back to dashboard
        </Link>
        <span>Your progress starts here.</span>
      </footer>
    </main>

        }
      </div>
    </main>
  </div>
);}
