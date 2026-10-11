import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import DashboardSidebar from "../components/DashboardSidebar";
import {
  UserRound,
  Bell,
  ShieldCheck,
  BrainCircuit,
  Database,
  CircleHelp,
  Save,
  Download,
  Trash2,
  LockKeyhole,
  Menu,
  ExternalLink,
} from "lucide-react";
import "./SettingsPage.css";

const defaultNotifications = {
  studyReminders: true,
  predictionUpdates: true,
  accountAlerts: true,
};

const defaultPreferences = {
  studyHours: "10",
  showExplanations: true,
  marksFormat: "out-of-20",
};

function readUserSettings(user) {
  const saved = user?.user_metadata?.edupredict_settings || {};

  return {
    notifications: {
      ...defaultNotifications,
      ...(saved.notifications || {}),
    },
    preferences: {
      ...defaultPreferences,
      ...(saved.preferences || {}),
    },
  };
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCSV(records) {
  const rows = [
    ["Date", "Predicted Marks", "Input Data", "Result Data"],
    ...records.map((record) => [
      record.created_at
        ? new Date(record.created_at).toLocaleString()
        : "",
      record.predicted_marks ?? "",
      JSON.stringify(record.input_data ?? {}),
      JSON.stringify(record.result_data ?? {}),
    ]),
  ];

  const csv = rows
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "edupredict-prediction-history.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const { user } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);

  const [notice, setNotice] = useState({
    type: "",
    text: "",
  });

  const [profile, setProfile] = useState({
    full_name: "",
    age: "",
    education_level: "",
    study_hours_per_week: "",
  });

  const initialSettings = readUserSettings(user);
  const [notifications, setNotifications] = useState(
    initialSettings.notifications
  );
  const [preferences, setPreferences] = useState(
    initialSettings.preferences
  );

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadSettings() {
      setLoadingProfile(true);

      const { data, error } = await supabase
        .from("student_profiles")
        .select(
          "full_name, age, education_level, study_hours_per_week"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setNotice({
          type: "error",
          text: `Could not load your student profile: ${error.message}`,
        });
      } else if (data) {
        setProfile({
          full_name: data.full_name ?? "",
          age: data.age ?? "",
          education_level: data.education_level ?? "",
          study_hours_per_week: data.study_hours_per_week ?? "",
        });
      }

      const settings = readUserSettings(user);
      setNotifications(settings.notifications);
      setPreferences(settings.preferences);
      setLoadingProfile(false);
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [user]);

  function showNotice(type, text) {
    setNotice({ type, text });
  }

  function updateProfile(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveAccount(event) {
    event.preventDefault();
    setNotice({ type: "", text: "" });

    if (!user) {
      showNotice("error", "Please sign in again.");
      return;
    }

    if (!profile.full_name.trim()) {
      showNotice("error", "Please enter your full name.");
      return;
    }

    const age = profile.age === "" ? null : Number(profile.age);
    const studyHours =
      profile.study_hours_per_week === ""
        ? null
        : Number(profile.study_hours_per_week);

    if (
      age !== null &&
      (!Number.isFinite(age) || age < 1 || age > 120)
    ) {
      showNotice("error", "Enter a valid age between 1 and 120.");
      return;
    }

    if (
      studyHours !== null &&
      (!Number.isFinite(studyHours) ||
        studyHours < 0 ||
        studyHours > 168)
    ) {
      showNotice(
        "error",
        "Study hours per week must be between 0 and 168."
      );
      return;
    }

    setSavingAccount(true);

    try {
      const values = {
        user_id: user.id,
        full_name: profile.full_name.trim(),
        age,
        education_level: profile.education_level || null,
        study_hours_per_week: studyHours,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("student_profiles")
        .upsert(values, { onConflict: "user_id" });

      if (error) throw error;

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name.trim(),
        },
      });

      if (authError) {
        showNotice(
          "success",
          "Student profile saved. Your account display name could not be updated."
        );
      } else {
        showNotice("success", "Your account details have been saved.");
      }
    } catch (error) {
      showNotice(
        "error",
        error.message || "Could not save your account details."
      );
    } finally {
      setSavingAccount(false);
    }
  }

  async function saveUserSettings(nextSettings, setSaving) {
    setNotice({ type: "", text: "" });

    if (!user) {
      showNotice("error", "Please sign in again.");
      return;
    }

    setSaving(true);

    try {
      const existing = readUserSettings(user);

      const settings = {
        notifications: nextSettings.notifications ?? existing.notifications,
        preferences: nextSettings.preferences ?? existing.preferences,
      };

      const { error } = await supabase.auth.updateUser({
        data: {
          edupredict_settings: settings,
        },
      });

      if (error) throw error;

      showNotice("success", "Your preferences have been saved.");
    } catch (error) {
      showNotice(
        "error",
        error.message || "Could not save your preferences."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveNotifications(event) {
    event.preventDefault();

    await saveUserSettings(
      { notifications, preferences },
      setSavingNotifications
    );
  }

  async function savePreferences(event) {
    event.preventDefault();

    const hours = Number(preferences.studyHours);

    if (
      preferences.studyHours === "" ||
      !Number.isFinite(hours) ||
      hours < 0 ||
      hours > 168
    ) {
      showNotice(
        "error",
        "Default study hours must be between 0 and 168."
      );
      return;
    }

    await saveUserSettings(
      {
        notifications,
        preferences: {
          ...preferences,
          studyHours: String(hours),
        },
      },
      setSavingPreferences
    );
  }

  async function sendPasswordReset() {
    setNotice({ type: "", text: "" });

    if (!user?.email) {
      showNotice("error", "We couldn't find an email for your account.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        user.email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      showNotice(
        "success",
        `If password reset is enabled, a reset email will be sent to ${user.email}. Check your inbox and spam folder.`
      );
    } catch (error) {
      showNotice(
        "error",
        error.message || "Could not request a password reset."
      );
    }
  }

  async function exportHistory() {
    setNotice({ type: "", text: "" });
    setExporting(true);

    try {
      const { data, error } = await supabase
        .from("student_predictions")
        .select(
          "created_at, predicted_marks, input_data, result_data"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data?.length) {
        showNotice("error", "You don't have any prediction history to export.");
        return;
      }

      downloadCSV(data);
      showNotice(
        "success",
        `Exported ${data.length} prediction record(s) to CSV.`
      );
    } catch (error) {
      showNotice(
        "error",
        error.message || "Could not export prediction history."
      );
    } finally {
      setExporting(false);
    }
  }

  async function clearHistory() {
    const confirmed = window.confirm(
      "Permanently delete all your saved predictions? This cannot be undone."
    );

    if (!confirmed) return;

    setNotice({ type: "", text: "" });
    setClearingHistory(true);

    try {
      const { error } = await supabase
        .from("student_predictions")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      showNotice("success", "Your prediction history has been deleted.");
    } catch (error) {
      showNotice(
        "error",
        error.message || "Could not clear prediction history."
      );
    } finally {
      setClearingHistory(false);
    }
  }

  async function requestAccountDeletion() {
    const confirmed = window.confirm(
      "Submit a request to delete your EduPredict account? This sends a request for review; it does not immediately delete your account."
    );

    if (!confirmed) return;

    setNotice({ type: "", text: "" });
    setRequestingDeletion(true);

    try {
      const { error } = await supabase
        .from("account_deletion_requests")
        .insert({
          user_id: user.id,
          email: user.email,
        });

      if (error) throw error;

      showNotice(
        "success",
        "Your account deletion request has been submitted."
      );
    } catch (error) {
      showNotice(
        "error",
        error.message ||
          "Could not submit your deletion request. Please contact support."
      );
    } finally {
      setRequestingDeletion(false);
    }
  }

  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL;

  return (
    <div className="settings-layout">
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="settings-main">
        <header className="settings-header">
          <div>
            <span className="settings-eyebrow">YOUR WORKSPACE</span>
            <h1>Settings</h1>
            <p>Manage your account, preferences, and student data.</p>
          </div>

          <button
            className="settings-mobile-menu"
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
        </header>

        {notice.text && (
          <div
            className={`settings-notice ${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            {notice.text}
          </div>
        )}

        {loadingProfile ? (
          <div className="settings-loading">
            Loading your settings…
          </div>
        ) : (
          <>
            <section className="settings-card" id="account">
              <div className="settings-section-heading">
                <span className="settings-icon">
                  <UserRound size={21} />
                </span>
                <div>
                  <h2>Account settings</h2>
                  <p>Edit your student information.</p>
                </div>
              </div>

              <form onSubmit={saveAccount} className="settings-form">
                <label className="settings-field">
                  Full name
                  <input
                    value={profile.full_name}
                    onChange={(event) =>
                      updateProfile("full_name", event.target.value)
                    }
                    maxLength={120}
                    required
                  />
                </label>

                <label className="settings-field">
                  Email address
                  <input value={user?.email || ""} readOnly />
                  <small>
                    Email changes should be handled through a verified
                    email-change flow.
                  </small>
                </label>

                <div className="settings-form-grid">
                  <label className="settings-field">
                    Age
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={profile.age}
                      onChange={(event) =>
                        updateProfile("age", event.target.value)
                      }
                      placeholder="Enter your age"
                    />
                  </label>

                  <label className="settings-field">
                    Education level
                    <select
                      value={profile.education_level}
                      onChange={(event) =>
                        updateProfile(
                          "education_level",
                          event.target.value
                        )
                      }
                    >
                      <option value="">Select education level</option>
                      <option value="School">School</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                </div>

                <label className="settings-field">
                  Study hours per week
                  <input
                    type="number"
                    min="0"
                    max="168"
                    value={profile.study_hours_per_week}
                    onChange={(event) =>
                      updateProfile(
                        "study_hours_per_week",
                        event.target.value
                      )
                    }
                    placeholder="e.g. 15"
                  />
                </label>

                <div className="settings-actions">
                  <button
                    className="settings-primary-button"
                    type="submit"
                    disabled={savingAccount}
                  >
                    <Save size={17} />
                    {savingAccount ? "Saving…" : "Save account"}
                  </button>
                </div>
              </form>
            </section>

            <section className="settings-card" id="notifications">
              <div className="settings-section-heading">
                <span className="settings-icon">
                  <Bell size={21} />
                </span>
                <div>
                  <h2>Notification preferences</h2>
                  <p>Choose the types of notifications you want.</p>
                </div>
              </div>

              <form onSubmit={saveNotifications}>
                {[
                  {
                    key: "studyReminders",
                    title: "Study reminders",
                    description: "Reminders to keep up with your study goals.",
                  },
                  {
                    key: "predictionUpdates",
                    title: "Prediction updates",
                    description: "Updates about your prediction activity.",
                  },
                  {
                    key: "accountAlerts",
                    title: "Account alerts",
                    description: "Important security and account notices.",
                  },
                ].map((item) => (
                  <label
                    className="settings-toggle-row"
                    key={item.key}
                  >
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={notifications[item.key]}
                      onChange={(event) =>
                        setNotifications((current) => ({
                          ...current,
                          [item.key]: event.target.checked,
                        }))
                      }
                    />
                  </label>
                ))}

                <p className="settings-help-text">
                  These preferences are saved to your account. Actual
                  reminder delivery requires a notification service.
                </p>

                <div className="settings-actions">
                  <button
                    className="settings-primary-button"
                    type="submit"
                    disabled={savingNotifications}
                  >
                    <Save size={17} />
                    {savingNotifications ? "Saving…" : "Save notifications"}
                  </button>
                </div>
              </form>
            </section>

            <section className="settings-card" id="predictions">
              <div className="settings-section-heading">
                <span className="settings-icon">
                  <BrainCircuit size={21} />
                </span>
                <div>
                  <h2>Prediction preferences</h2>
                  <p>Set defaults for your EduPredict experience.</p>
                </div>
              </div>

              <form onSubmit={savePreferences} className="settings-form">
                <label className="settings-field">
                  Default study hours per week
                  <input
                    type="number"
                    min="0"
                    max="168"
                    value={preferences.studyHours}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        studyHours: event.target.value,
                      }))
                    }
                    required
                  />
                  <small>
                    This saves a preference; it does not automatically
                    change the inputs used by your prediction model.
                  </small>
                </label>

                <label className="settings-toggle-row">
                  <span>
                    <strong>Show prediction explanations</strong>
                    <small>
                      Remember whether you prefer explanatory information.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.showExplanations}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        showExplanations: event.target.checked,
                      }))
                    }
                  />
                </label>

                <label className="settings-field">
                  Marks display format
                  <select
                    value={preferences.marksFormat}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        marksFormat: event.target.value,
                      }))
                    }
                  >
                    <option value="out-of-20">Out of 20</option>
                    <option value="percentage">Percentage</option>
                  </select>
                  <small>
                    Your current model returns a score on a 0–20 scale.
                    Percentage display will convert that score for display
                    only.
                  </small>
                </label>

                <div className="settings-actions">
                  <button
                    className="settings-primary-button"
                    type="submit"
                    disabled={savingPreferences}
                  >
                    <Save size={17} />
                    {savingPreferences ? "Saving…" : "Save prediction settings"}
                  </button>
                </div>
              </form>
            </section>

            <section className="settings-card" id="security">
              <div className="settings-section-heading">
                <span className="settings-icon">
                  <ShieldCheck size={21} />
                </span>
                <div>
                  <h2>Security & privacy</h2>
                  <p>Manage access to your account and personal data.</p>
                </div>
              </div>

              <div className="settings-action-row">
                <div className="settings-action-copy">
                  <LockKeyhole size={19} />
                  <div>
                    <strong>Reset your password</strong>
                    <p>
                      Request a password-reset email for {user?.email}.
                    </p>
                  </div>
                </div>

                <button
                  className="settings-secondary-button"
                  type="button"
                  onClick={sendPasswordReset}
                >
                  Send reset email
                </button>
              </div>

              <div className="settings-action-row settings-danger-row">
                <div className="settings-action-copy">
                  <Trash2 size={19} />
                  <div>
                    <strong>Request account deletion</strong>
                    <p>
                      Submit a request for your account to be reviewed
                      for deletion.
                    </p>
                  </div>
                </div>

                <button
                  className="settings-danger-button"
                  type="button"
                  onClick={requestAccountDeletion}
                  disabled={requestingDeletion}
                >
                  {requestingDeletion
                    ? "Submitting…"
                    : "Request deletion"}
                </button>
              </div>
            </section>

            <section className="settings-card" id="data">
              <div className="settings-section-heading">
                <span className="settings-icon">
                  <Database size={21} />
                </span>
                <div>
                  <h2>Data management</h2>
                  <p>Export or remove your saved prediction records.</p>
                </div>
              </div>

              <div className="settings-action-row">
                <div>
                  <strong>Export prediction history</strong>
                  <p>
                    Download your saved prediction records as a CSV file.
                  </p>
                </div>
                <button
                  className="settings-secondary-button"
                  type="button"
                  onClick={exportHistory}
                  disabled={exporting}
                >
                  <Download size={17} />
                  {exporting ? "Exporting…" : "Export CSV"}
                </button>
              </div>

              <div className="settings-action-row settings-danger-row">
                <div>
                  <strong>Clear prediction history</strong>
                  <p>
                    Permanently remove all saved predictions for your
                    account. This does not delete your account.
                  </p>
                </div>
                <button
                  className="settings-danger-button"
                  type="button"
                  onClick={clearHistory}
                  disabled={clearingHistory}
                >
                  <Trash2 size={17} />
                  {clearingHistory ? "Deleting…" : "Clear history"}
                </button>
              </div>
            </section>

            <section className="settings-card" id="help">
              <div className="settings-section-heading">
                <span className="settings-icon">
                  <CircleHelp size={21} />
                </span>
                <div>
                  <h2>Help & about</h2>
                  <p>Information about EduPredict and getting assistance.</p>
                </div>
              </div>

              <div className="settings-about">
                <div>
                  <strong>EduPredict</strong>
                  <p>Student performance prediction and analytics.</p>
                  <small>Application version 1.0.0</small>
                </div>
              </div>

              {supportEmail ? (
                <a
                  className="settings-support-link"
                  href={`mailto:${supportEmail}`}
                >
                  Contact support
                  <ExternalLink size={16} />
                </a>
              ) : (
                <p className="settings-help-text">
                  Support email is not configured yet. Set
                  VITE_SUPPORT_EMAIL in your frontend environment file
                  to enable the contact link.
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}