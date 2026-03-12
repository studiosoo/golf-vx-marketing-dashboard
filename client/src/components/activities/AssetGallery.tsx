import React, { useState, useEffect, useCallback } from "react";
import { Image as ImageIcon, X, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ContentAsset } from "@/pages/Activities";

interface AssetGalleryProps {
  activityId: string;
  venueId: string;
  staticAssets?: ContentAsset[];
}

// ─── Lightbox ─────────────────────────────────────────────────

function Lightbox({
  asset,
  onClose,
}: {
  asset: ContentAsset;
  onClose: () => void;
}) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#FFFFFF", borderRadius: "12px", overflow: "hidden", maxWidth: "640px", width: "100%" }}
      >
        {/* Image area */}
        <div style={{ width: "100%", aspectRatio: "4/3", background: "#F1F1EF", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" as const }}>
          {asset.imageUrl ? (
            <img
              src={asset.imageUrl}
              alt={asset.label}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "8px", color: "#A8A8A3" }}>
              <ImageIcon size={40} />
              <span style={{ fontSize: "12px" }}>No image uploaded</span>
            </div>
          )}
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: "12px", right: "12px",
              background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
              width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#FFFFFF",
            }}
          >
            <X size={14} />
          </button>
        </div>
        {/* Info */}
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#222222", marginBottom: "6px" }}>{asset.label}</div>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#6F6F6B" }}>
            {asset.period && <span>{asset.period}</span>}
            {asset.format && <span>{asset.format}</span>}
          </div>
          {asset.notes && (
            <p style={{ marginTop: "8px", fontSize: "12px", color: "#A8A8A3" }}>{asset.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Upload Modal ──────────────────────────────────────────────

function UploadModal({ onClose }: { onClose: () => void }) {
  const storageUrl = import.meta.env.VITE_ASSET_STORAGE_URL;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#FFFFFF", borderRadius: "12px", padding: "24px", maxWidth: "440px", width: "100%" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#222222" }}>Add Asset</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#A8A8A3" }}>
            <X size={16} />
          </button>
        </div>
        {!storageUrl ? (
          <div style={{ background: "#F6F6F4", border: "1px solid #DEDEDA", borderRadius: "8px", padding: "16px", fontSize: "13px", color: "#6F6F6B", textAlign: "center" as const }}>
            Asset upload not configured — contact admin to configure{" "}
            <code style={{ background: "#F1F1EF", padding: "1px 5px", borderRadius: "3px", fontSize: "12px" }}>
              VITE_ASSET_STORAGE_URL
            </code>
          </div>
        ) : (
          // Future: upload form here
          <p style={{ fontSize: "13px", color: "#6F6F6B" }}>Upload form coming soon.</p>
        )}
        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ fontSize: "13px", color: "#6F6F6B", padding: "6px 14px", border: "1px solid #DEDEDA", borderRadius: "6px", background: "#FFFFFF", cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Thumbnail Card ────────────────────────────────────────────

function ThumbnailCard({ asset, onClick }: { asset: ContentAsset; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, width: "120px", background: "#FFFFFF",
        border: "1px solid #DEDEDA", borderRadius: "8px",
        overflow: "hidden", cursor: "pointer", textAlign: "left" as const,
        transition: "box-shadow 0.15s",
      }}
      className="hover:shadow-sm"
    >
      {/* Image area */}
      <div style={{ width: "120px", height: "90px", background: "#F1F1EF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {asset.imageUrl ? (
          <img src={asset.imageUrl} alt={asset.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <ImageIcon size={20} style={{ color: "#A8A8A3" }} />
        )}
      </div>
      {/* Label */}
      <div style={{ padding: "6px 8px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#222222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
          {asset.label}
        </div>
        {(asset.period || asset.format) && (
          <div style={{ fontSize: "10px", color: "#A8A8A3", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {[asset.period, asset.format].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────

export function AssetGallery({ activityId, venueId, staticAssets }: AssetGalleryProps) {
  const [lightboxAsset, setLightboxAsset] = useState<ContentAsset | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const { data } = trpc.activities.getAssets.useQuery(
    { activityId, venueId },
    { staleTime: 5 * 60 * 1000 }
  );

  // Merge: staticAssets first (in order), then DB assets not already in static list
  const staticLabels = new Set((staticAssets ?? []).map(a => a.label));
  const dbAssets: ContentAsset[] = (data?.assets ?? [])
    .filter(a => !staticLabels.has(a.label ?? ""))
    .map(a => ({
      label:    a.label ?? "Untitled",
      period:   a.period ?? undefined,
      format:   a.format ?? undefined,
      imageUrl: a.imageUrl ?? undefined,
      notes:    a.notes ?? undefined,
    }));

  const allAssets: ContentAsset[] = [...(staticAssets ?? []), ...dbAssets];

  return (
    <>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#222222" }}>Collateral Gallery</span>
        <button
          onClick={() => setShowUpload(true)}
          style={{
            display: "flex", alignItems: "center", gap: "5px",
            fontSize: "12px", color: "#6F6F6B",
            background: "none", border: "1px solid #DEDEDA",
            borderRadius: "6px", padding: "4px 10px", cursor: "pointer",
          }}
        >
          <Plus size={12} />
          Add Asset
        </button>
      </div>

      {/* Gallery */}
      {allAssets.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", padding: "32px 20px" }}>
          <EmptyState icon={<ImageIcon size={20} />} message="No collateral uploaded yet." />
        </div>
      ) : (
        <div style={{
          display: "flex", gap: "10px",
          overflowX: "auto" as const,
          paddingBottom: "4px",
          background: "#FFFFFF", border: "1px solid #DEDEDA",
          borderRadius: "10px", padding: "16px",
        }}>
          {allAssets.map((asset, i) => (
            <ThumbnailCard key={i} asset={asset} onClick={() => setLightboxAsset(asset)} />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxAsset && (
        <Lightbox asset={lightboxAsset} onClose={() => setLightboxAsset(null)} />
      )}

      {/* Upload modal */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </>
  );
}
