import { useState } from "react";
import {
  useFindMyBloodRequstHistoryQuery,
  useIsDonorFindMutation,
  useDeleteBloodRequestMutation,
} from "../../redux/api/BloodRequstApi/BloodRequstApi";
import { useFind_my_current_locationQuery } from "../../redux/api/BloodDonorApi/BloodDonorApi";

// ── Blood type palette ─────────────────────────────────────────────────────
const bloodMeta = {
  "A+": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  "A-": { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-300" },
  "B+": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "B-": { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
  "AB+": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  "AB-": { bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-300" },
  "O+": { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  "O-": { bg: "bg-sky-100", text: "text-sky-800", border: "border-sky-300" },
};
const fallbackBloodMeta = { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };

// ── Urgency palette ──────────────────────────────────────────────────────────
const urgencyMeta = {
  critical: { label: "Critical", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", bar: "bg-red-500" },
  high: { label: "High", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", bar: "bg-orange-400" },
  medium: { label: "Medium", bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", bar: "bg-yellow-400" },
  low: { label: "Low", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", bar: "bg-green-400" },
};
const fallbackUrgencyMeta = { label: "Unspecified", bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400", bar: "bg-gray-300" };

// ── Helpers ───────────────────────────────────────────────────────────────────
const safeDate = (ts) => {
  if (!ts) return null;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
};
const fmtDate = (ts) => {
  const d = safeDate(ts);
  return d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
};
const fmtTime = (ts) => {
  const d = safeDate(ts);
  return d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
};
const capitalize = (s) => (typeof s === "string" && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : "—");

// Pull a readable message out of an RTK Query error shape, which can vary a lot.
const getErrorMessage = (err, fallback = "Something went wrong. Please try again.") => {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (err.data?.message) return err.data.message;
  if (err.error) return err.error;
  if (err.message) return err.message;
  if (err.status === "FETCH_ERROR") return "Network error — check your connection and try again.";
  if (err.status === "TIMEOUT_ERROR") return "Request timed out. Please try again.";
  if (typeof err.status === "number") {
    if (err.status === 401) return "Your session has expired. Please log in again.";
    if (err.status === 403) return "You don't have permission to do that.";
    if (err.status === 404) return "We couldn't find that request — it may already be removed.";
    if (err.status >= 500) return "Server error — please try again shortly.";
  }
  return fallback;
};

// ── Inline icon set (no external deps) ───────────────────────────────────────
const Icon = {
  Droplet: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 2.69s-7 7.44-7 11.31a7 7 0 0 0 14 0c0-3.87-7-11.31-7-11.31Z" />
    </svg>
  ),
  Hospital: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 21V3a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v18M22 21V8a1 1 0 0 0-1-1h-9M9 21v-4h2v4M5 7h2M5 11h2M5 15h2M12 7h2M12 11h2" />
    </svg>
  ),
  Phone: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  ),
  Pin: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  Chevron: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  Alert: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  Refresh: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v6h-6" />
    </svg>
  ),
  Inbox: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </svg>
  ),
};

// ── Inline error banner — reused for page-level and action-level errors ──────
function ErrorBanner({ message, onRetry, dense = false }) {
  return (
    <div
      role="alert"
      className={`flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 ${
        dense ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
      }`}
    >
      <Icon.Alert className={dense ? "w-4 h-4 shrink-0" : "w-5 h-5 shrink-0"} />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-red-800 shrink-0"
        >
          <Icon.Refresh className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-1 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="w-11 h-11 rounded-xl bg-gray-100" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-100 rounded w-2/5" />
            <div className="h-2.5 bg-gray-50 rounded w-1/4" />
          </div>
          <div className="h-5 bg-gray-100 rounded-full w-16" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className={i === 1 ? "col-span-2 h-12 bg-gray-50 rounded-xl" : "h-12 bg-gray-50 rounded-xl"} />
          ))}
        </div>
        <div className="h-9 bg-gray-50 rounded-xl" />
      </div>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteModal({ onConfirm, onCancel, isDeleting, error }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!isDeleting ? onCancel : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm border border-gray-100">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
            <Icon.Trash className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Delete this request?</h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              This action cannot be undone. The blood request will be permanently removed.
            </p>
          </div>

          {error && <ErrorBanner message={error} dense />}

          <div className="flex gap-2 w-full mt-1">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold
                         text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold
                         hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                         inline-flex items-center justify-center gap-1.5"
            >
              {isDeleting && (
                <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              )}
              {isDeleting ? "Deleting…" : "Yes, delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Donor status control ──────────────────────────────────────────────────────
function DonorStatusButton({ isDonorFind, isUpdating, onMarkFound, error }) {
  if (isDonorFind) {
    return (
      <div
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl
                   border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold"
      >
        <span className="inline-flex items-center gap-1.5">
          <Icon.Check className="w-3.5 h-3.5" />
          Donor found
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700">
          Confirmed
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        onClick={onMarkFound}
        disabled={isUpdating}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-semibold
                   transition-colors active:scale-[0.99] select-none
                   disabled:opacity-60 disabled:cursor-not-allowed
                   bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          Searching for donor
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700">
          {isUpdating && <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-700/30 border-t-emerald-700 animate-spin" />}
          {isUpdating ? "Saving" : "Mark as found"}
        </span>
      </button>
      {error && <ErrorBanner message={error} dense />}
    </div>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────
function RequestCard({ item, onToggleDonor, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!item || !item._id) return null; // defensive: skip malformed rows rather than crash the grid

  const bm = bloodMeta[item.blood] ?? fallbackBloodMeta;
  const urg = urgencyMeta[item.urgency] ?? fallbackUrgencyMeta;
  const loc = item.locationData ?? {};
  const date = item.createdAt ?? item.updatedAt;

  const handleMarkFound = async () => {
    setUpdateError(null);
    setUpdating(true);
    try {
      await onToggleDonor(item._id, true);
    } catch (err) {
      setUpdateError(getErrorMessage(err, "Couldn't update donor status. Please try again."));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    setDeleting(true);
    try {
      await onDelete(item._id);
      setShowConfirm(false);
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Couldn't delete this request. Please try again."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {showConfirm && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={() => {
            if (!isDeleting) {
              setShowConfirm(false);
              setDeleteError(null);
            }
          }}
          isDeleting={isDeleting}
          error={deleteError}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className={`h-1 w-full ${urg.bar}`} />

        <div className="p-4 space-y-3">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-11 h-11 shrink-0 rounded-xl flex flex-col items-center justify-center ${bm.bg} border ${bm.border}`}>
                <span className={`text-base font-bold leading-none ${bm.text}`}>{item.blood || "—"}</span>
                <span className="text-[8px] text-gray-400 font-medium mt-0.5 tracking-wide">type</span>
              </div>

              <div className="min-w-0">
                <p className="text-[13px] font-bold text-gray-800 leading-snug truncate">
                  {capitalize(item.bloodResuestType)} request
                </p>
                <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                  #{item._id?.slice?.(-8)?.toUpperCase?.() || "UNKNOWN"}
                </p>
                {date && (
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <Icon.Clock className="w-2.5 h-2.5" /> {fmtDate(date)} · {fmtTime(date)}
                  </p>
                )}
              </div>
            </div>

            <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full ${urg.bg} ${urg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${urg.dot}`} />
              {urg.label}
            </span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="col-span-2 bg-gray-50 rounded-xl px-3 py-2 flex items-start gap-2 border border-gray-100">
              <Icon.Hospital className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Hospital</p>
                <p className="text-[12px] font-semibold text-gray-700 truncate">{item.hospital || "Not specified"}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-start gap-2 border border-gray-100">
              <Icon.Phone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Phone</p>
                <p className="text-[11px] font-medium text-gray-700 break-all">{item.phone || "—"}</p>
              </div>
            </div>

            <div className={`${bm.bg} rounded-xl px-3 py-2 flex items-start gap-2 border ${bm.border}`}>
              <Icon.Droplet className={`w-4 h-4 shrink-0 mt-0.5 ${bm.text}`} />
              <div>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Blood group</p>
                <p className={`text-[13px] font-bold ${bm.text}`}>{item.blood || "—"}</p>
              </div>
            </div>
          </div>

          {/* Location */}
          {loc.address && (
            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Icon.Pin className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Location</span>
                </span>
                <Icon.Chevron className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
              </button>

              {expanded && (
                <div className="px-3 pb-3 pt-2 border-t border-gray-100 space-y-2">
                  <p className="text-[11px] text-gray-600 leading-relaxed">{loc.address}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {typeof loc.lat === "number" && typeof loc.lng === "number" && (
                      <span className="text-[9px] font-mono bg-white border border-gray-200 rounded-lg px-2 py-0.5 text-gray-500">
                        {loc.lat.toFixed(5)}°, {loc.lng.toFixed(5)}°
                      </span>
                    )}
                    {loc.accuracy && (
                      <span className="text-[9px] bg-white border border-gray-200 rounded-lg px-2 py-0.5 text-gray-500">
                        ±{loc.accuracy}m accuracy
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DonorStatusButton
            isDonorFind={item.isDonorFind}
            isUpdating={isUpdating}
            onMarkFound={handleMarkFound}
            error={updateError}
          />

          {!item.isDonorFind && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isDeleting}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold
                         border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon.Trash className="w-3.5 h-3.5" />
              Delete request
            </button>
          )}

          {item.updatedAt && (
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[9px] text-gray-400">
                Updated {fmtDate(item.updatedAt)} · {fmtTime(item.updatedAt)}
              </span>
              <span className={`w-2 h-2 rounded-full ${item.isDonorFind ? "bg-emerald-400" : "bg-red-400 animate-pulse"}`} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPage, onPage }) {
  if (!totalPage || totalPage <= 1) return null;
  const pages = Array.from({ length: totalPage }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center
                   text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        ‹
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`w-8 h-8 rounded-xl text-xs font-semibold transition-colors ${
            p === page ? "bg-red-600 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPage}
        className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center
                   text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        ›
      </button>
    </div>
  );
}

// ── Donor summary panel ───────────────────────────────────────────────────────
function DonorSummary({ data }) {
  if (!data) return null;
  const lastDonated = safeDate(data.updatedAt);

  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
      <div>
        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Total donations</p>
        <p className="text-sm font-bold text-emerald-800">{data.donatedCount ?? 0}</p>
      </div>
      <div>
        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Blood group</p>
        <p className="text-sm font-bold text-emerald-800">{data.blood || "—"}</p>
      </div>
      {lastDonated && (
        <div>
          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Last donated</p>
          <p className="text-sm font-bold text-emerald-800">{fmtDate(lastDonated)}</p>
        </div>
      )}
      <p className="text-[10px] text-emerald-600 basis-full leading-relaxed">
        Your profile stays visible to requesters for 3 months from today, then goes private again until your next donation.
      </p>
      <p className="text-[10px] text-emerald-600 basis-full leading-relaxed">
       আজকের পর থেকে 3 মাস পর আপনার ইনফরমেশন আমাদের সিস্টেম আবার ডিটেক্ট করবো,এই তিন মাসের জন্য আপনার ইনফরমেশন আবার প্রাইভেট হয়ে যাবে
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const DonationHistory = () => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    data,
    isLoading,
    isFetching,
    isSuccess,
    isError,
    error,
    refetch,
  } = useFindMyBloodRequstHistoryQuery({ page, limit });

  const [changeDonorFindStatus] = useIsDonorFindMutation();
  const [deleteBloodRequest] = useDeleteBloodRequestMutation();

  const {
    data: currentLocation,
    isLoading: locationLoading,
    isSuccess: locationSuccess,
    isError: locationIsError,
    error: locationError,
    refetch: refetchLocation,
  } = useFind_my_current_locationQuery();

  const myRequstHistory = data?.data?.result ?? [];
  const meta = data?.data?.meta ?? {};
  const total = meta.total ?? 0;
  const totalPage = meta.totalPage ?? 1;

  const handleToggleDonorStatus = async (id, isDonorFind) => {
    // Let the caller (RequestCard) catch and surface this — keeps error UI local to the card.
    await changeDonorFindStatus({ id, isDonorFind }).unwrap();
  };

  const handleDeleteRequest = async (id) => {
    await deleteBloodRequest({ id }).unwrap();
    
    if (myRequstHistory.length === 1 && page > 1) {
      setPage((p) => p - 1);
    }
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || (totalPage && nextPage > totalPage)) return;
    setPage(nextPage);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-xl mx-auto px-6 sm:px-12">
        {/* Header */}
        <div className="flex flex-col gap-4 pb-6 border-b border-gray-200 mb-7">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center">
                <Icon.Droplet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 leading-tight">Blood request history</h1>
                <p className="text-xs text-gray-400 mt-0.5">All your past blood donation requests</p>
              </div>
            </div>

            {!isLoading && !isError && total > 0 && (
              <div className="bg-red-600 rounded-2xl px-4 py-2.5 text-center">
                <div className="text-xl font-bold text-white leading-none">{total}</div>
                <div className="text-[9px] text-red-100 font-semibold mt-0.5 uppercase tracking-widest">Total requests</div>
              </div>
            )}
          </div>

          {/* Donor profile summary / its own independent loading + error state */}
          {locationLoading && (
            <div className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          )}
          {!locationLoading && locationIsError && (
            <ErrorBanner
              message={getErrorMessage(locationError, "Couldn't load your donor profile summary.")}
              onRetry={refetchLocation}
              dense
            />
          )}
          {!locationLoading && locationSuccess && currentLocation?.success && (
            <DonorSummary data={currentLocation?.data} />
          )}
        </div>

        {/* Page-level error (failed to load request history) */}
        {isError && (
          <ErrorBanner message={getErrorMessage(error, "Failed to load your request history.")} onRetry={refetch} />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && isSuccess && myRequstHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
              <Icon.Inbox className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-500">No requests found</p>
            <p className="text-xs text-gray-400 max-w-xs">
              Your blood request history will appear here after you make a request.
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && !isError && isSuccess && myRequstHistory.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <span className="text-[11px] text-gray-400">
                Showing <span className="font-semibold text-gray-600">{myRequstHistory.length}</span> of{" "}
                <span className="font-semibold text-gray-600">{total}</span> requests · Page {page} of {totalPage}
                {isFetching && <span className="ml-1 text-gray-300">· refreshing…</span>}
              </span>

              <div className="flex flex-wrap gap-1.5">
                {Object.entries(urgencyMeta).map(([key, u]) => (
                  <span key={key} className={`inline-flex items-center gap-1.5 text-[9px] font-semibold px-2 py-0.5 rounded-full ${u.bg} ${u.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.dot}`} />
                    {u.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {myRequstHistory.map((item) => (
                <RequestCard key={item._id} item={item} onToggleDonor={handleToggleDonorStatus} onDelete={handleDeleteRequest} />
              ))}
            </div>

            <Pagination page={page} totalPage={totalPage} onPage={handlePageChange} />

            {totalPage > 1 && (
              <p className="text-center text-[10px] text-gray-400 mt-2">
                {total} records · {limit} per page
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DonationHistory;