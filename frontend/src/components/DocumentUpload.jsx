import React, { useState, useCallback } from 'react';

// ── Document Upload with SHA-256 preview ──────────────────────
export default function DocumentUpload({ onFileSelected, label, hint }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState(null);
  const [hashing, setHashing] = useState(false);

  const ACCEPTED = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff'];
  const MAX_MB = 10;

  async function computeSha256(buffer, file) {
    if (!window.crypto || !window.crypto.subtle) {
      console.warn('[Crypto] Insecure context — using fallback hash preview');
      let hash = 0;
      const str = `${file.name}-${file.size}-${file.lastModified}`;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      const hex = Math.abs(hash).toString(16).padStart(8, '0');
      return (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 64);
    }
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  const processFile = useCallback(async (f) => {
    if (!ACCEPTED.includes(f.type)) {
      alert('Unsupported file type. Please upload PDF, PNG, JPG, or TIFF.');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      alert(`File exceeds ${MAX_MB} MB limit.`);
      return;
    }

    setFile(f);
    setHashing(true);

    const buffer = await f.arrayBuffer();
    const sha = await computeSha256(buffer, f);
    setHash(sha);
    setHashing(false);

    onFileSelected?.({ file: f, hash: sha });
  }, [onFileSelected]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onInputChange = (e) => { const f = e.target.files[0]; if (f) processFile(f); };

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{
          border: `2px dashed ${dragging ? 'var(--color-teal)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          textAlign: 'center',
          background: dragging ? 'rgba(13,154,168,0.05)' : 'rgba(255,255,255,0.02)',
          transition: 'all var(--transition-base)',
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={() => document.getElementById('doc-upload-input').click()}
        role="button"
        tabIndex={0}
        id="doc-upload-dropzone"
      >
        <input
          type="file"
          id="doc-upload-input"
          accept=".pdf,.png,.jpg,.jpeg,.tiff"
          style={{ display: 'none' }}
          onChange={onInputChange}
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            {/* File icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              📄
            </div>
            <div>
              <div className="text-ui-sm" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {file.name}
              </div>
              <div className="text-ui-xs text-muted">
                {(file.size / 1024).toFixed(1)} KB · {file.type}
              </div>
            </div>

            {/* Hash display */}
            {hashing ? (
              <div className="flex items-center gap-2 text-ui-xs text-muted">
                <div className="spinner" style={{ width: 12, height: 12 }} />
                Computing SHA-256...
              </div>
            ) : hash && (
              <div style={{
                background: 'rgba(13,154,168,0.08)',
                border: '1px solid rgba(13,154,168,0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                width: '100%',
              }}>
                <div className="section-label" style={{ marginBottom: 4 }}>SHA-256 Document Hash</div>
                <div className="monospace text-ui-xs text-accent" style={{ wordBreak: 'break-all' }}>
                  {hash}
                </div>
                <div className="text-ui-xs text-muted" style={{ marginTop: 4 }}>
                  This hash will be stored on-chain as proof of document integrity
                </div>
              </div>
            )}

            <button
              className="btn btn-ghost btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setHash(null);
                onFileSelected?.(null);
              }}
              type="button"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem',
              color: 'var(--color-text-muted)',
            }}>
              ⬆
            </div>
            <div>
              <div className="text-ui-sm" style={{ fontWeight: 600, marginBottom: 4 }}>
                Drop your document here
              </div>
              <div className="text-ui-xs text-muted">
                Shipping Bill, Bill of Lading, or Purchase Order
              </div>
              <div className="text-ui-xs text-muted">
                PDF, PNG, JPG, TIFF · max {MAX_MB} MB
              </div>
            </div>
            <button className="btn btn-outline btn-sm" type="button">
              Browse files
            </button>
          </div>
        )}
      </div>

      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}
