// BloodFilterPanel.jsx
import { memo } from "react";
import { useFindMyNearestBloodDonorQuery } from "../redux/api/BloodDonorApi/BloodDonorApi";

/* ─── Design Tokens ──────────────────────────────────────────────────── */
const TOKEN = {
  crimson:    "#C0392B",
  crimsonDark:"#96281B",
  crimsonSoft:"#FDECEB",
  crimsonMid: "#F1948A",
  navy:       "#1A2332",
  slate:      "#4A5568",
  muted:      "#718096",
  border:     "#E2E8F0",
  bgBase:     "#F7F8FC",
  white:      "#FFFFFF",
  green:      "#27AE60",
  greenSoft:  "#EAFAF1",
  blue:       "#2980B9",
  blueSoft:   "#EBF5FB",
  amber:      "#E67E22",
  amberSoft:  "#FEF9EF",
};

/* ─── Inline Styles ──────────────────────────────────────────────────── */
const s = {
  /* wrapper */
  wrapper: {
    background: TOKEN.white,
    borderRadius: 16,
    border: `1px solid ${TOKEN.border}`,
    overflow: "hidden",
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  },

  /* header stripe */
  header: {
    background: `linear-gradient(135deg, ${TOKEN.crimsonDark} 0%, ${TOKEN.crimson} 100%)`,
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  headerDrop: {
    fontSize: 22,
    lineHeight: 1,
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: TOKEN.white,
    letterSpacing: "0.01em",
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },

  /* body */
  body: { padding: "16px 18px" },

  /* controls row */
  controlsRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  controlBox: { flex: 1, minWidth: 130 },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: TOKEN.slate,
    marginBottom: 5,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  select: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: `1.5px solid ${TOKEN.border}`,
    fontSize: 13,
    color: TOKEN.navy,
    background: TOKEN.bgBase,
    outline: "none",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234A5568' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    paddingRight: 28,
    cursor: "pointer",
  },
  sliderWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  sliderValue: {
    fontSize: 13,
    fontWeight: 700,
    color: TOKEN.crimson,
    minWidth: 42,
    textAlign: "right",
  },
  slider: { flex: 1, accentColor: TOKEN.crimson, cursor: "pointer" },

  /* status banners */
  loadingBanner: {
    background: TOKEN.bgBase,
    border: `1px dashed ${TOKEN.border}`,
    borderRadius: 10,
    padding: "14px 16px",
    textAlign: "center",
    color: TOKEN.muted,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  errorBanner: {
    background: TOKEN.crimsonSoft,
    border: `1px solid ${TOKEN.crimsonMid}`,
    borderRadius: 10,
    padding: "12px 14px",
    color: TOKEN.crimsonDark,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  successBanner: {
    background: TOKEN.greenSoft,
    border: `1px solid #A9DFBF`,
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    color: TOKEN.green,
    fontWeight: 500,
    marginBottom: 14,
  },

  /* donor card */
  donorCard: {
    background: TOKEN.white,
    border: `1.5px solid ${TOKEN.border}`,
    borderRadius: 12,
    padding: "14px 15px",
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    transition: "box-shadow 0.15s",
    marginBottom: 10,
  },

  /* blood badge circle */
  bloodCircle: {
    width: 46,
    height: 46,
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${TOKEN.crimson}, ${TOKEN.crimsonDark})`,
    color: TOKEN.white,
    fontWeight: 800,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: `0 2px 8px rgba(192,57,43,0.35)`,
    letterSpacing: "-0.5px",
  },

  /* donor info */
  donorInfo: { flex: 1, minWidth: 0 },
  donorName: {
    fontSize: 14,
    fontWeight: 700,
    color: TOKEN.navy,
    marginBottom: 3,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  donorPhone: {
    fontSize: 12,
    color: TOKEN.slate,
    marginBottom: 4,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  donorAddress: {
    fontSize: 11,
    color: TOKEN.muted,
    lineHeight: 1.45,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },

  /* right meta column */
  donorMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
    flexShrink: 0,
  },
  distancePill: {
    background: TOKEN.blueSoft,
    color: TOKEN.blue,
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 20,
    padding: "3px 9px",
    whiteSpace: "nowrap",
  },
  typePill: {
    background: TOKEN.amberSoft,
    color: TOKEN.amber,
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 20,
    padding: "3px 8px",
    textTransform: "capitalize",
  },
  goBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: TOKEN.navy,
    color: TOKEN.white,
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 8,
    padding: "5px 10px",
    textDecoration: "none",
    whiteSpace: "nowrap",
    marginTop: 2,
    transition: "background 0.15s",
    letterSpacing: "0.02em",
  },

  /* empty state */
  empty: {
    textAlign: "center",
    padding: "28px 0 20px",
    color: TOKEN.muted,
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 13, lineHeight: 1.5 },

  /* pagination */
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
    paddingTop: 12,
    borderTop: `1px solid ${TOKEN.border}`,
  },
  paginationInfo: { fontSize: 11, color: TOKEN.muted },
  pageControls: { display: "flex", gap: 4 },
  pageBtn: (active, disabled) => ({
    minWidth: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: active ? TOKEN.crimson : TOKEN.white,
    color: active ? TOKEN.white : disabled ? "#CBD5E0" : TOKEN.slate,
    border: `1.5px solid ${active ? TOKEN.crimson : TOKEN.border}`,
    borderRadius: 7,
    padding: "0 10px",
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    whiteSpace: "nowrap",
    fontFamily: "inherit",
  }),

  /* compatibility */
  compatCard: {
    background: TOKEN.crimsonSoft,
    borderRadius: 10,
    padding: "12px 14px",
    border: `1px solid #F5B7B1`,
    marginTop: 16,
  },
  compatTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: TOKEN.crimsonDark,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  compatRow: { display: "flex", gap: 20, flexWrap: "wrap" },
  compatLabel: { fontSize: 10, color: TOKEN.muted, marginBottom: 5, fontWeight: 600 },
  compatChips: { display: "flex", gap: 4, flexWrap: "wrap" },
  compatChip: {
    background: TOKEN.white,
    border: `1.5px solid ${TOKEN.crimsonMid}`,
    color: TOKEN.crimsonDark,
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 6,
    padding: "2px 8px",
  },

  /* divider */
  divider: {
    height: 1,
    background: TOKEN.border,
    margin: "14px 0",
  },
};

/* ─── Helpers ────────────────────────────────────────────────────────── */

/**
 * Returns a bounded window of page numbers centered on the current page,
 * so we never render an unbounded number of pagination buttons.
 */
function getPageWindow(current, total, span = 5) {
  if (total <= span) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  let start = Math.max(1, current - Math.floor(span / 2));
  let end = Math.min(total, start + span - 1);
  start = Math.max(1, end - span + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/* ─── Component ──────────────────────────────────────────────────────── */
const BloodFilterPanel = memo(function BloodFilterPanel({
  selectedBlood,
  setSelectedBlood,
  searchRadius,
  setSearchRadius,
  currentPage,
  setCurrentPage,
  BLOOD_TYPES,
  COMPATIBILITY,
  coords,
}) {
  const { data, isLoading, isError, isSuccess } =
    useFindMyNearestBloodDonorQuery(
      {
        lat: coords?.lat,
        lng: coords?.lng,
        blood: selectedBlood,
        radius: searchRadius,
        page: currentPage,
      },
      { skip: !coords?.lat || !coords?.lng }
    );

  const bloodDonorList = data?.data?.data ?? [];
  const meta = data?.data?.meta ?? {};

  const {
    total = 0,
    page = 1,
    limit = 10,
    totalPages = 1,
    hasNextPage = false,
    hasPrevPage = false,
  } = meta;

  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd   = Math.min(page * limit, total);

  if (!coords?.lat || !coords?.lng) return null;

  const pageNumbers = getPageWindow(page, totalPages);

  /* ── Maps URL helper ── */
  const mapsUrl = (donor) =>
    `https://www.google.com/maps/dir/${coords.lat},${coords.lng}/${donor.locationData?.lat},${donor.locationData?.lng}`;

  return (
    <div style={s.wrapper}>
      {/* Keyframes for loading spinner (inline styles can't define @keyframes) */}
      <style>{`
        @keyframes blood-filter-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <span style={s.headerDrop}>🩸</span>
        <div>
          <div style={s.headerTitle}>Find Nearby Blood Donors</div>
          <div style={s.headerSub}>Locate volunteers &amp; requests within your area</div>
        </div>
      </div>

      <div style={s.body}>

        {/* Controls */}
        <div style={s.controlsRow}>
          {/* Blood type */}
          <div style={s.controlBox}>
            <label style={s.label} htmlFor="blood-type-select">Blood Type</label>
            <select
              id="blood-type-select"
              style={s.select}
              value={selectedBlood}
              onChange={(e) => { setSelectedBlood(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All types</option>
              {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Radius */}
          <div style={s.controlBox}>
            <label style={s.label} htmlFor="search-radius-slider">Search Radius</label>
            <div style={s.sliderWrap}>
              <input
                id="search-radius-slider"
                type="range"
                min={1}
                max={50}
                value={searchRadius}
                onChange={(e) => { setSearchRadius(Number(e.target.value)); setCurrentPage(1); }}
                style={s.slider}
                aria-valuetext={`${searchRadius} kilometers`}
              />
              <span style={s.sliderValue}>{searchRadius} km</span>
            </div>
          </div>
        </div>

        <div style={s.divider} />

        {/* Loading */}
        {isLoading && (
          <div style={s.loadingBanner} role="status" aria-live="polite">
            <span
              style={{
                animation: "blood-filter-spin 1s linear infinite",
                display: "inline-block",
              }}
            >
              ⏳
            </span>
            Searching for nearby donors…
          </div>
        )}

        {/* Error */}
        {isError && (
          <div style={s.errorBanner} role="alert">
            <span>⚠️</span>
            Failed to load nearby donors. Please try again.
          </div>
        )}

        {/* Results */}
        {isSuccess && (
          <>
            {/* Success banner */}
            <div style={s.successBanner}>
              ✅ Found <strong>{total}</strong> donor{total !== 1 ? "s" : ""} within{" "}
              <strong>{searchRadius} km</strong>
              {selectedBlood ? ` · Blood type ${selectedBlood}` : ""}
            </div>

            {/* Empty state */}
            {bloodDonorList.length === 0 ? (
              <div style={s.empty}>
                <div style={s.emptyIcon}>🔍</div>
                <div style={s.emptyText}>
                  No donors found.<br />Try increasing the radius or selecting a different blood type.
                </div>
              </div>
            ) : (
              <>
                {/* Donor cards */}
                {bloodDonorList.map((donor) => (
                  <div key={donor._id} style={s.donorCard}>

                    {/* Blood circle */}
                    <div style={s.bloodCircle}>{donor.blood}</div>

                    {/* Info */}
                    <div style={s.donorInfo}>
                      <div style={s.donorName}>{donor.name}</div>
                      <div style={s.donorPhone}>
                        <span aria-hidden="true">📞</span> {donor.phone}
                      </div>
                      {donor.locationData?.address && (
                        <div style={s.donorAddress}>
                          <span aria-hidden="true">📍</span> {donor.locationData.address}
                        </div>
                      )}
                    </div>

                    {/* Right meta */}
                    <div style={s.donorMeta}>
                      {donor.distance != null && (
                        <span style={s.distancePill}>
                          📡 {donor.distance.toFixed(2)} km
                        </span>
                      )}
                      {donor.bloodRequestType && (
                        <span style={s.typePill}>{donor.bloodRequestType}</span>
                      )}
                      {donor.locationData?.lat && donor.locationData?.lng && (
                        <a
                          href={mapsUrl(donor)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={s.goBtn}
                          aria-label={`Get directions to ${donor.name}`}
                          onMouseEnter={(e) => (e.currentTarget.style.background = TOKEN.crimson)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = TOKEN.navy)}
                        >
                          🗺 Directions
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={s.pagination}>
                    <span style={s.paginationInfo}>
                      {rangeStart}–{rangeEnd} of {total} donor{total !== 1 ? "s" : ""}
                    </span>
                    <div style={s.pageControls}>
                      <button
                        type="button"
                        style={s.pageBtn(false, !hasPrevPage)}
                        disabled={!hasPrevPage}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        aria-label="Previous page"
                      >
                        ← Prev
                      </button>

                      {pageNumbers[0] > 1 && (
                        <>
                          <button
                            type="button"
                            style={s.pageBtn(1 === page, false)}
                            onClick={() => setCurrentPage(1)}
                          >
                            1
                          </button>
                          {pageNumbers[0] > 2 && (
                            <span style={{ ...s.paginationInfo, padding: "0 4px" }}>…</span>
                          )}
                        </>
                      )}

                      {pageNumbers.map((num) => (
                        <button
                          type="button"
                          key={num}
                          style={s.pageBtn(num === page, false)}
                          onClick={() => setCurrentPage(num)}
                          aria-current={num === page ? "page" : undefined}
                        >
                          {num}
                        </button>
                      ))}

                      {pageNumbers[pageNumbers.length - 1] < totalPages && (
                        <>
                          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                            <span style={{ ...s.paginationInfo, padding: "0 4px" }}>…</span>
                          )}
                          <button
                            type="button"
                            style={s.pageBtn(totalPages === page, false)}
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        style={s.pageBtn(false, !hasNextPage)}
                        disabled={!hasNextPage}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        aria-label="Next page"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}

                {totalPages === 1 && total > 0 && (
                  <div style={{ ...s.paginationInfo, marginTop: 10, textAlign: "right" }}>
                    Showing {rangeStart}–{rangeEnd} of {total} donor{total !== 1 ? "s" : ""}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Blood Compatibility */}
        {selectedBlood && COMPATIBILITY[selectedBlood] && (
          <div style={s.compatCard}>
            <div style={s.compatTitle}>
              <span aria-hidden="true">🔬</span> Compatibility · {selectedBlood}
            </div>
            <div style={s.compatRow}>
              <div>
                <div style={s.compatLabel}>CAN DONATE TO</div>
                <div style={s.compatChips}>
                  {COMPATIBILITY[selectedBlood].canDonateTo.map((b) => (
                    <span key={b} style={s.compatChip}>{b}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={s.compatLabel}>CAN RECEIVE FROM</div>
                <div style={s.compatChips}>
                  {COMPATIBILITY[selectedBlood].canReceiveFrom.map((b) => (
                    <span key={b} style={s.compatChip}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default BloodFilterPanel;