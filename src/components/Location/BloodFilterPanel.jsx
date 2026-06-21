// BloodFilterPanel.jsx — fully fixed version
import { memo, useEffect, useState } from "react";
import { useFindMyNearestBloodDonorQuery } from "../redux/api/BloodDonorApi/BloodDonorApi";
import { decrypt } from "../../utils/CeyptoSecurity";

const BloodFilterPanel = memo(function BloodFilterPanel({
  selectedBlood,
  setSelectedBlood,
  searchRadius,
  setSearchRadius,
  setCurrentPage,
  BLOOD_TYPES,
  COMPATIBILITY,
  cs,
  coords,
  generate_secret_key,
}) {
  const [bloodDonorList, setBloodDonorList] = useState([]);
  const [decryptError, setDecryptError] = useState(null);

  const { data, isLoading, error, isError, isSuccess } =
    useFindMyNearestBloodDonorQuery(
      {
        lat: coords?.lat,
        lng: coords?.lng,
        blood: selectedBlood,
        radius: searchRadius,
      },
      {
        skip: !coords?.lat || !coords?.lng,
      }
    );

  console.log(error);

  useEffect(() => {
    if (!data?.data?.encrypted) {
      setBloodDonorList([]);
      return;
    }

    const decryptData = async () => {
      try {
        setDecryptError(null);
        const decrypted = await decrypt(data.data.encrypted, generate_secret_key);
        setBloodDonorList(decrypted ?? []);
      } catch (err) {
        console.error("Decryption failed:", err);
        setDecryptError("Failed to decrypt donor data.");
        setBloodDonorList([]);
      }
    };

    decryptData();
  }, [data, generate_secret_key]);


  if (!coords?.lat || !coords?.lng) return null;

  console.log(bloodDonorList)

  return (
    <div
      style={{
        ...cs.card,
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "flex-end",
      }}
    >



      {"/* Blood Type Filter */"}
      <div style={{ flex: 1, minWidth: 120 }}>
        <label style={cs.label}>Blood Type Filter</label>
        <select
          style={cs.select}
          value={selectedBlood}
          onChange={(e) => {
            setSelectedBlood(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All types</option>
          {BLOOD_TYPES.map((blood) => (
            <option key={blood} value={blood}>
              {blood}
            </option>
          ))}
        </select>
      </div>

      {"/* Radius Slider */"}
      <div style={{ flex: 1, minWidth: 120 }}>
        <label style={cs.label}>Radius: {searchRadius} km</label>
        <input
          type="range"
          min={1}
          max={50}
          value={searchRadius}
          onChange={(e) => {
            setSearchRadius(Number(e.target.value));
            setCurrentPage(1);
          }}
          style={{ width: "100%", accentColor: "#c0392b" }}
        />
      </div>

      {"/* Loading State */"}
      {isLoading && (
        <div style={{ width: "100%", textAlign: "center", color: "#7f8c8d", fontSize: 13 }}>
          Searching for nearby donors...
        </div>
      )}

      {"/* Decrypt Error State */"}
      {decryptError && (
        <div
          style={{
            width: "100%",
            background: "#fff0f0",
            borderRadius: 8,
            padding: "10px 12px",
            border: "1px solid #f5c6c6",
            color: "#c0392b",
            fontSize: 13,
          }}
        >
          {decryptError}
        </div>
      )}

      {"/* API Error State */"}
      {isError && (
        <div
          style={{
            width: "100%",
            background: "#fff0f0",
            borderRadius: 8,
            padding: "10px 12px",
            border: "1px solid #f5c6c6",
            color: "#c0392b",
            fontSize: 13,
          }}
        >
          Failed to load nearby donors. Please try again.
        </div>
      )}

      {"/* Success — Donor Results Count */"}
      {isSuccess && !decryptError && (
        <div
          style={{
            width: "100%",
            background: "#f0fff4",
            borderRadius: 8,
            padding: "10px 12px",
            border: "1px solid #c6f5d0",
            fontSize: 13,
            color: "#27ae60",
          }}
        >
          Found <strong>{bloodDonorList?.length ?? 0}</strong> donor(s) near you
          within <strong>{searchRadius} km</strong>
          {selectedBlood ? ` with blood type ${selectedBlood}` : ""}.
        </div>
      )}

      {"/* Blood Compatibility Info */"}
      {selectedBlood && COMPATIBILITY[selectedBlood] && (
        <div
          style={{
            width: "100%",
            background: "#fff9f9",
            borderRadius: 8,
            padding: "10px 12px",
            border: "1px solid #f5c6c6",
          }}
        >
          <div style={{ fontSize: 12, color: "#7f8c8d", marginBottom: 6 }}>
            Compatibility for{" "}
            <strong style={{ color: "#c0392b" }}>{selectedBlood}</strong>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: "#95a5a6", marginBottom: 4 }}>
                Can donate to
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {COMPATIBILITY[selectedBlood].canDonateTo.map((blood) => (
                  <span key={blood} style={cs.badge(blood)}>{blood}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#95a5a6", marginBottom: 4 }}>
                Can receive from
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {COMPATIBILITY[selectedBlood].canReceiveFrom.map((blood) => (
                  <span key={blood} style={cs.badge(blood)}>{blood}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default BloodFilterPanel;