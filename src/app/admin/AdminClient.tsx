"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import "./admin.css";

type SummaryData = {
  totalItems: number; openItems: number; resolvedItems: number;
  expiredItems: number; totalClaims: number; resolutionRate: number;
};
type CategoryStat = { _id: string; count: number };
type Item = {
  _id: string; title: string; type: string; category: string;
  status: string; reporterEmail: string; createdAt: string; deletedAt: string | null;
};
type Log = {
  _id: string; adminEmail: string; action: string;
  targetId?: string; details?: string; createdAt: string;
};
type View = "analytics" | "items" | "logs";

const VIEW_TABS: { id: View; label: string }[] = [
  { id: "analytics", label: "Analytics" },
  { id: "items",     label: "All Items" },
  { id: "logs",      label: "Audit Logs" },
];

export default function AdminClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [view, setView]         = useState<View>("analytics");
  const [loading, setLoading]   = useState(true);
  const [summary, setSummary]   = useState<SummaryData | null>(null);
  const [byCategory, setByCategory] = useState<CategoryStat[]>([]);
  const [items, setItems]       = useState<Item[]>([]);
  const [logs, setLogs]         = useState<Log[]>([]);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => { fetchView(); }, [view]);

  async function fetchView() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin?view=${view}`);
      if (res.status === 403) { router.push("/"); return; }
      const data = await res.json();
      if (!data.success) return;
      if (view === "analytics") {
        setSummary(data.data.summary);
        setByCategory(data.data.byCategory);
      } else if (view === "items") {
        setItems(data.data);
      } else {
        setLogs(data.data);
      }
    } finally { setLoading(false); }
  }

  async function handleItemAction(id: string, action: "resolve" | "delete") {
    const body    = action === "resolve" ? { status: "resolved" } : undefined;
    const method  = action === "delete" ? "DELETE" : "PATCH";
    const res     = await fetch(`/api/items/${id}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) {
      setActionMsg(action === "delete" ? "Item deleted" : "Item resolved");
      fetchView();
      setTimeout(() => setActionMsg(""), 3500);
    }
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  const fmtTime = (d: string) =>
    new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  if (status === "loading") {
    return <main className="admin-main"><div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>Loading…</div></main>;
  }

  const STAT_CARDS = summary ? [
    { label: "Total Items",      value: summary.totalItems,      color: "var(--text)" },
    { label: "Open",             value: summary.openItems,       color: "#3b82f6" },
    { label: "Resolved",         value: summary.resolvedItems,   color: "var(--success)" },
    { label: "Expired",          value: summary.expiredItems,    color: "var(--stone)" },
    { label: "Claims",           value: summary.totalClaims,     color: "var(--saffron)" },
    { label: "Resolution Rate",  value: `${summary.resolutionRate}%`, color: "#8b5cf6" },
  ] : [];

  return (
    <main className="admin-main page-enter">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Moderation &amp; analytics · NIE Lost &amp; Found</p>
        </div>
        <div className="admin-tabs" role="tablist">
          {VIEW_TABS.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              className={`admin-tab${view === id ? " active" : ""}`}
              onClick={() => setView(id)}
            >{label}</button>
          ))}
        </div>
      </div>

      {actionMsg && (
        <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>{actionMsg}</div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <div className="spinner" style={{ width: 24, height: 24, margin: "0 auto", borderColor: "var(--border)", borderTopColor: "var(--stone)" }} />
        </div>
      ) : (
        <>
          {/* Analytics */}
          {view === "analytics" && summary && (
            <div>
              <div className="stat-grid stagger">
                {STAT_CARDS.map(({ label, value, color }) => (
                  <div key={label} className="stat-card card">
                    <div className="stat-value" style={{ color }}>{value}</div>
                    <div className="stat-label">{label}</div>
                  </div>
                ))}
              </div>

              <div className="card card-p" style={{ marginTop: "1.5rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", marginBottom: "1.25rem", fontSize: "0.9rem", fontWeight: 700 }}>
                  Items by category
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {byCategory.map(({ _id, count }) => {
                    const pct = summary.totalItems > 0 ? Math.round((count / summary.totalItems) * 100) : 0;
                    return (
                      <div key={_id}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem", marginBottom: "0.4rem" }}>
                          <span style={{ fontWeight: 500, color: "var(--text-2)" }}>{_id}</span>
                          <span style={{ color: "var(--text-faint)", fontWeight: 600 }}>{count} <span style={{ fontWeight: 400 }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: "var(--ink)",
                            borderRadius: 99,
                            transition: "width 0.7s var(--ease-out)",
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Items table */}
          {view === "items" && (
            <div className="table-wrap card">
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      {["Title", "Type", "Category", "Status", "Reporter", "Created", "Actions"].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item._id} style={{ opacity: item.deletedAt ? 0.45 : 1 }}>
                        <td className="td-title">{item.title}</td>
                        <td>
                          <span className={`badge badge-${item.type}`}>{item.type}</span>
                        </td>
                        <td style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>{item.category}</td>
                        <td>
                          <span className={`badge badge-${item.deletedAt ? "expired" : item.status === "resolved" ? "resolved" : "open"}`}>
                            {item.deletedAt ? "deleted" : item.status}
                          </span>
                        </td>
                        <td className="td-email">{item.reporterEmail}</td>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-faint)", whiteSpace: "nowrap" }}>{fmtDate(item.createdAt)}</td>
                        <td>
                          {!item.deletedAt && (
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              {item.status !== "resolved" && (
                                <button
                                  className="btn btn-success"
                                  style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem", borderRadius: "var(--r-sm)" }}
                                  onClick={() => handleItemAction(item._id, "resolve")}
                                >Resolve</button>
                              )}
                              <button
                                className="btn btn-danger"
                                style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem", borderRadius: "var(--r-sm)" }}
                                onClick={() => handleItemAction(item._id, "delete")}
                              >Delete</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Logs table */}
          {view === "logs" && (
            <div className="table-wrap card">
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      {["Admin", "Action", "Target", "Details", "Time"].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log._id}>
                        <td className="td-email">{log.adminEmail}</td>
                        <td>
                          <code className="log-action">{log.action}</code>
                        </td>
                        <td style={{ fontSize: "0.75rem", color: "var(--text-faint)", fontFamily: "monospace" }}>
                          {log.targetId ?? "—"}
                        </td>
                        <td style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>{log.details ?? "—"}</td>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-faint)", whiteSpace: "nowrap" }}>
                          {fmtTime(log.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
