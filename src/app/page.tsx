"use client";

import { useEffect, useState, useCallback } from "react";
import "./page.css";

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
  reporterPhone?: string;
  reporterEmail?: string;
  status: string;
};

type Pagination = {
  page: number; pageSize: number; total: number; totalPages: number;
};

const CATEGORIES = ["All", "Electronics", "Keys", "Documents", "Clothing", "Other"];

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton sk-img" />
      <div className="sk-body">
        <div className="skeleton sk-line" style={{ width: "55%" }} />
        <div className="skeleton sk-line" style={{ width: "85%" }} />
        <div className="skeleton sk-line" style={{ width: "70%" }} />
        <div className="skeleton sk-line" style={{ width: "45%", marginTop: "0.5rem" }} />
      </div>
    </div>
  );
}

export default function Home() {
  const [items, setItems]       = useState<Item[]>([]);
  const [filter, setFilter]     = useState<"all" | "lost" | "found">("all");
  const [category, setCategory] = useState("All");
  const [search, setSearch]     = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading]   = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("type", filter);
      if (category !== "All") params.set("category", category);
      if (search) params.set("search", search);
      params.set("page", String(page));
      const res  = await fetch(`/api/items?${params}`);
      const data = await res.json();
      if (data.success) { setItems(data.data); setPagination(data.pagination); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filter, category, search, page]);

  useEffect(() => { setPage(1); }, [filter, category, search]);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 380);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });

  return (
    <main className="page-enter">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1 className="page-title">Campus Hub</h1>
          <p className="page-subtitle">Lost &amp; Found listings · NIE Mysore</p>
        </div>
        <div className="type-tabs" role="tablist">
          {(["all", "lost", "found"] as const).map(f => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={`type-tab${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All Items" : f === "lost" ? "Lost" : "Found"}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="search-section">
        <div className="search-wrap">
          <svg className="search-icon-el" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            className="search-field"
            placeholder="Search by name, description..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            aria-label="Search items"
          />
          {searchInput && (
            <button
              className="search-clear"
              onClick={() => { setSearchInput(""); setSearch(""); }}
              aria-label="Clear search"
            >✕</button>
          )}
        </div>
        <div className="cat-chips" role="group" aria-label="Filter by category">
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`cat-chip${category === c ? " active" : ""}`}
              onClick={() => setCategory(c)}
            >{c}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="items-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {pagination && (
            <p className="results-meta">
              <strong>{pagination.total}</strong>
              &nbsp;item{pagination.total !== 1 ? "s" : ""} found
              {search && <> matching &ldquo;<strong>{search}</strong>&rdquo;</>}
            </p>
          )}

          <div className="items-grid stagger">
            {items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" aria-hidden>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" strokeWidth={2} />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={2} />
                  </svg>
                </div>
                <h3>Nothing found</h3>
                <p>Try clearing filters or searching something else.</p>
              </div>
            ) : items.map(item => (
              <article key={item._id} className="item-card">
                {/* Badges on image */}
                <div className="item-img-wrap">
                  {item.status === "resolved" && (
                    <div className="resolved-ribbon">Recovered</div>
                  )}
                  <div className="card-badges" aria-hidden>
                    <span className={`badge badge-${item.type}`}>{item.type}</span>
                    <span className="badge badge-open" style={{
                      background: "rgba(253,252,250,0.88)",
                      backdropFilter: "blur(4px)",
                      color: "var(--stone)",
                    }}>{item.category}</span>
                  </div>
                  <img
                    src={item.imageUrl || "/default-item.svg"}
                    alt={item.title}
                    className="item-img"
                    loading="lazy"
                  />
                </div>

                <div className="item-body">
                  <h2 className="item-title">{item.title}</h2>
                  <p className="item-desc">{item.description}</p>

                  <div className="item-meta">
                    <div className="meta-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{item.location}</span>
                    </div>
                    <div className="meta-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
                        <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} />
                        <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} />
                        <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} />
                      </svg>
                      <span>{fmtDate(item.date)}</span>
                    </div>
                    <div className="meta-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{item.reporterName}</span>
                    </div>
                  </div>

                  {/* Contact buttons */}
                  {(item.reporterPhone || item.reporterEmail) && (
                    <div className="card-actions">
                      {item.reporterPhone && (
                        <a href={`tel:${item.reporterPhone}`} className="btn-call">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.92a16 16 0 0 0 6 6l.9-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" />
                          </svg>
                          Call
                        </a>
                      )}
                      {item.reporterPhone && (
                        <a href={`https://wa.me/${item.reporterPhone.replace(/\D/g, "")}`}
                          target="_blank" rel="noopener noreferrer"
                          className="btn-email"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          WhatsApp
                        </a>
                      )}
                      {!item.reporterPhone && item.reporterEmail && (
                        <a href={`mailto:${item.reporterEmail}`} className="btn-email" style={{ flex: 1 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          Email
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-ghost btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >← Prev</button>
              <span className="page-info">Page {page} of {pagination.totalPages}</span>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
              >Next →</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
