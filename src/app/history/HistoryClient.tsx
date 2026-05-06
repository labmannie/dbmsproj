"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import "./history.css";

type ItemStatus = "open" | "resolved" | "expired";

type Item = {
  _id: string;
  title: string;
  description: string;
  type: "lost" | "found";
  category: string;
  location: string;
  date: string;
  imageUrl?: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  status: ItemStatus;
};

export default function HistoryClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems]           = useState<Item[]>([]);
  const [loading, setLoading]       = useState(true);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [maxDatetime, setMaxDatetime] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  useEffect(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    setMaxDatetime(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16));
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) fetchItems(session.user.email);
  }, [session]);

  const fetchItems = async (email: string) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/items?reporterEmail=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const flash = (type: "error" | "success", msg: string) => {
    if (type === "error") { setError(msg); setTimeout(() => setError(""), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(""), 4000); }
  };

  const handleToggleStatus = async (id: string, current: ItemStatus) => {
    const next: ItemStatus = current === "open" ? "resolved" : "open";
    setItems(prev => prev.map(i => i._id === id ? { ...i, status: next } : i));
    setTogglingId(id);
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setItems(prev => prev.map(i => i._id === id ? { ...i, status: current } : i));
        flash("error", "Couldn't update status. Try again.");
      } else {
        flash("success", next === "resolved" ? "Marked as recovered ✓" : "Reopened successfully");
      }
    } catch {
      setItems(prev => prev.map(i => i._id === id ? { ...i, status: current } : i));
    } finally { setTogglingId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this report? This can't be undone.")) return;
    const removed = items.find(i => i._id === id);
    setItems(prev => prev.filter(i => i._id !== id));
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!res.ok) {
        if (removed) setItems(prev => [removed, ...prev]);
        flash("error", "Couldn't delete item.");
      } else {
        flash("success", "Report deleted.");
      }
    } catch {
      if (removed) setItems(prev => [removed, ...prev]);
    }
  };

  const openEdit = (item: Item) => {
    const localDate = new Date(
      new Date(item.date).getTime() - new Date().getTimezoneOffset() * 60000
    ).toISOString().slice(0, 16);
    setEditingItem({ ...item, date: localDate });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/items/${editingItem._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:         editingItem.title,
          description:   editingItem.description,
          location:      editingItem.location,
          date:          editingItem.date,
          reporterPhone: editingItem.reporterPhone,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setItems(prev => prev.map(i => i._id === data._id ? data : i));
        setEditingItem(null);
        flash("success", "Report updated ✓");
      } else {
        flash("error", "Couldn't update. Try again.");
      }
    } catch { flash("error", "Network error."); }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

  if (status === "loading" || loading) {
    return (
      <main className="hist-main page-enter">
        <div className="hist-header">
          <div>
            <div className="skeleton" style={{ width: 180, height: 32, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 240, height: 16 }} />
          </div>
        </div>
        <div className="hist-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="hist-card skeleton-card">
              <div className="skeleton sk-img" />
              <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                <div className="skeleton" style={{ width: "60%", height: 16 }} />
                <div className="skeleton" style={{ width: "85%", height: 13 }} />
                <div className="skeleton" style={{ width: "40%", height: 13 }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="hist-main page-enter">
      <div className="hist-header">
        <div>
          <h1 className="page-title">My Reports</h1>
          <p className="page-subtitle">Manage items you've reported</p>
        </div>
        <div className="hist-summary">
          <div className="hist-stat">
            <span className="hist-stat-num">{items.length}</span>
            <span className="hist-stat-label">Total</span>
          </div>
          <div className="hist-stat">
            <span className="hist-stat-num" style={{ color: "var(--saffron)" }}>
              {items.filter(i => i.status === "open").length}
            </span>
            <span className="hist-stat-label">Open</span>
          </div>
          <div className="hist-stat">
            <span className="hist-stat-num" style={{ color: "var(--success)" }}>
              {items.filter(i => i.status === "resolved").length}
            </span>
            <span className="hist-stat-label">Recovered</span>
          </div>
        </div>
      </div>

      {error   && <div className="alert alert-error"   role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="status">{success}</div>}

      {items.length === 0 ? (
        <div className="empty-state" style={{ maxWidth: 460, margin: "2rem auto" }}>
          <div className="empty-icon" aria-hidden>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3>No reports yet</h3>
          <p>When you report a lost or found item, it'll appear here.</p>
        </div>
      ) : (
        <div className="hist-grid stagger">
          {items.map(item => (
            <article key={item._id} className={`hist-card${item.status === "resolved" ? " hist-card-resolved" : ""}`}>
              <div className="hist-img-wrap">
                {item.status === "resolved" && (
                  <div className="resolved-ribbon">Recovered</div>
                )}
                <span className={`badge badge-${item.type}`} style={{ position: "absolute", top: 10, right: 10, zIndex: 5 }}>
                  {item.type}
                </span>
                <img
                  src={item.imageUrl || "/default-item.svg"}
                  alt={item.title}
                  className="hist-img"
                  loading="lazy"
                />
              </div>

              <div className="hist-body">
                <div className="hist-top">
                  <h2 className="hist-title">{item.title}</h2>
                  <span className={`badge badge-${item.status === "resolved" ? "resolved" : item.status === "expired" ? "expired" : "open"}`}>
                    {item.status}
                  </span>
                </div>
                <p className="hist-desc">{item.description}</p>

                <div className="hist-meta">
                  <span>{item.location}</span>
                  <span className="meta-dot" aria-hidden>·</span>
                  <span>{fmtDate(item.date)}</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginBottom: "0.875rem" }}>
                  Category: {item.category}
                </div>

                {/* Actions */}
                <div className="hist-actions">
                  <button
                    className={`btn btn-sm ${item.status === "open" ? "btn-success" : "btn-ghost"}`}
                    onClick={() => handleToggleStatus(item._id, item.status)}
                    disabled={togglingId === item._id}
                  >
                    {togglingId === item._id ? (
                      <span className="spinner" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
                    ) : item.status === "open" ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Mark Recovered
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.95" />
                        </svg>
                        Reopen
                      </>
                    )}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item._id)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingItem && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setEditingItem(null); }}
          role="dialog"
          aria-modal
          aria-label="Edit report"
        >
          <div className="modal-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.2rem" }}>Edit Report</h2>
              <button
                onClick={() => setEditingItem(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--stone)", padding: "0.25rem" }}
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Item name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingItem.title}
                  onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingItem.location}
                  onChange={e => setEditingItem({ ...editingItem, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={editingItem.description}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date &amp; Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={editingItem.date}
                  onChange={e => setEditingItem({ ...editingItem, date: e.target.value })}
                  max={maxDatetime || undefined}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone (optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editingItem.reporterPhone ?? ""}
                  onChange={e => setEditingItem({ ...editingItem, reporterPhone: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
