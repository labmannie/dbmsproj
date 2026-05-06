"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import "./add.css";

type FieldError = { field: string; message: string };

export default function AddItemClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading]       = useState(false);
  const [maxDatetime, setMaxDatetime] = useState("");
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [successMsg, setSuccessMsg]   = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver]     = useState(false);

  useEffect(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    setMaxDatetime(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16));
  }, []);

  const handleImageChange = (file?: File | null) => {
    if (!file) { setImagePreview(null); return; }
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  if (status === "loading") {
    return (
      <main className="add-main">
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>Loading…</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="add-main">
        <div className="login-gate page-enter">
          <div className="login-gate-icon" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2>Sign in to report</h2>
          <p>Only NIE Mysore members (nie.ac.in accounts) can submit reports.</p>
          <button
            className="btn btn-primary btn-lg"
            style={{ marginTop: "0.5rem", gap: "0.75rem" }}
            onClick={() => signIn("google")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGlobalError("");
    setSuccessMsg("");

    const formData = new FormData(e.currentTarget);
    try {
      const res  = await fetch("/api/items", { method: "POST", body: formData });
      const data = await res.json();

      if (res.status === 429) { setGlobalError(data.error ?? "Too many requests. Please wait."); return; }
      if (res.status === 422 && data.errors) {
        const fe: Record<string, string> = {};
        (data.errors as FieldError[]).forEach(({ field, message }) => { fe[field] = message; });
        setErrors(fe);
        return;
      }
      if (!data.success) { setGlobalError(data.error ?? "Submission failed"); return; }

      setSuccessMsg("Item reported! Redirecting…");
      setTimeout(() => router.push("/"), 1400);
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fc = (field: string) => `form-input${errors[field] ? " error" : ""}`;

  return (
    <main className="add-main page-enter">
      <div className="add-layout">
        {/* Left column — heading */}
        <div className="add-header">
          <div className="add-header-inner">
            <span className="add-header-tag">New Report</span>
            <h1 className="page-title" style={{ marginTop: "0.5rem" }}>Report an Item</h1>
            <p className="page-subtitle" style={{ marginTop: "0.5rem" }}>
              Help your campus community recover what matters.
            </p>
            <div className="add-tips">
              <p className="tip-heading">Tips for a good report</p>
              {[
                "Include brand, color and any unique marks",
                "Be precise about the location",
                "Add a photo — it helps a lot",
                "Phone number speeds up contact",
              ].map(tip => (
                <div key={tip} className="tip-row">
                  <span className="tip-dot" aria-hidden />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — form */}
        <div className="add-form-col">
          {globalError && (
            <div className="alert alert-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {globalError}
            </div>
          )}
          {successMsg && (
            <div className="alert alert-success" role="status">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Section: Item */}
            <div className="form-section">
              <h3 className="form-section-title">Item details</h3>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="type">Report type</label>
                  <select id="type" name="type" className={`form-select${errors.type ? " error" : ""}`} required defaultValue="lost">
                    <option value="lost">Lost — I lost this item</option>
                    <option value="found">Found — I found this item</option>
                  </select>
                  {errors.type && <span className="field-error">{errors.type}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="category">Category</label>
                  <select id="category" name="category" className={`form-select${errors.category ? " error" : ""}`} required>
                    <option value="Electronics">Electronics</option>
                    <option value="Keys">Keys</option>
                    <option value="Documents">Documents / IDs</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.category && <span className="field-error">{errors.category}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="title">Item name</label>
                <input id="title" type="text" name="title" className={fc("title")}
                  placeholder="e.g. Blue Dell laptop, Brown wallet" maxLength={100} required />
                {errors.title && <span className="field-error">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Description</label>
                <textarea id="description" name="description" className={`form-textarea${errors.description ? " error" : ""}`}
                  rows={3} placeholder="Color, brand, size, identifying marks…" maxLength={500} required />
                {errors.description && <span className="field-error">{errors.description}</span>}
              </div>
            </div>

            {/* Section: Where & When */}
            <div className="form-section">
              <h3 className="form-section-title">Where &amp; When</h3>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="location">Location</label>
                  <input id="location" type="text" name="location" className={fc("location")}
                    placeholder="e.g. Library 2nd floor, Canteen" maxLength={200} required />
                  {errors.location && <span className="field-error">{errors.location}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="date">Date &amp; Time</label>
                  <input id="date" type="datetime-local" name="date" className={fc("date")}
                    max={maxDatetime || undefined} required />
                  {errors.date && <span className="field-error">{errors.date}</span>}
                </div>
              </div>
            </div>

            {/* Section: Photo */}
            <div className="form-section">
              <h3 className="form-section-title">Photo <span style={{ fontWeight: 400, color: "var(--text-faint)" }}>(optional)</span></h3>
              <div
                className={`file-drop${dragOver ? " drag-over" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOver(false);
                  handleImageChange(e.dataTransfer.files[0]);
                }}
              >
                <input
                  id="image"
                  type="file"
                  name="image"
                  accept="image/*"
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                  onChange={e => handleImageChange(e.target.files?.[0])}
                />
                {imagePreview ? (
                  <div className="file-preview">
                    <img src={imagePreview} alt="Preview" />
                    <span className="file-preview-label">Click to change</span>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <div className="file-icon" aria-hidden>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <p>Drag &amp; drop or <span>click to upload</span></p>
                    <p className="file-hint">PNG, JPG, WEBP · Max 5 MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Contact */}
            <div className="form-section">
              <h3 className="form-section-title">Contact <span style={{ fontWeight: 400, color: "var(--text-faint)" }}>(optional)</span></h3>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone number</label>
                <input id="phone" type="tel" name="phone" className={fc("phone")}
                  placeholder="e.g. +91 98765 43210" />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
                <span className="form-hint">Visible to others so they can contact you directly.</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-accent btn-xl"
              style={{ width: "100%", marginTop: "0.5rem" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden /> Submitting…
                </>
              ) : "Submit Report"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
