'use client';

import { useEffect, useState } from 'react';
import PhotoReportButton from './PhotoReportButton';

export default function PhotoGallery({ photos, courseName }) {
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(null); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <div className="photo-grid">
        {photos.map((p) => (
          <figure key={p.id}>
            <button
              type="button"
              className="photo-thumb"
              onClick={() => setOpen(p)}
              aria-label={`Enlarge photo by ${p.display_name}`}
            >
              <img src={p.url} alt={`${courseName} — photo by ${p.display_name}`} loading="lazy" />
            </button>
            <figcaption>
              {p.display_name}
              <PhotoReportButton photoId={p.id} />
            </figcaption>
          </figure>
        ))}
      </div>

      {open && (
        <div className="lightbox" onClick={() => setOpen(null)}>
          <button className="lightbox-close" aria-label="Close" onClick={() => setOpen(null)}>
            ×
          </button>
          <img
            src={open.url}
            alt={`${courseName} — photo by ${open.display_name}`}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="lightbox-caption">
            {courseName} · photo by {open.display_name}
          </span>
        </div>
      )}
    </>
  );
}
