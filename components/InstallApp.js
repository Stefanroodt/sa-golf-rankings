'use client';

import { useEffect, useState } from 'react';

export default function InstallApp({ className = 'install-btn', label = '📲 Get the Pin High app' }) {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone) return;

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (ios) {
      setIsIos(true);
      setShow(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!show) return null;

  async function install() {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setShow(false);
      setDeferred(null);
    } else if (isIos) {
      setHelp(true);
    }
  }

  return (
    <>
      <button className={className} onClick={install}>
        {label}
      </button>
      {help && (
        <div className="modal-overlay" onClick={() => setHelp(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setHelp(false)} aria-label="Close">×</button>
            <h2>Add Pin High to your home screen</h2>
            <p className="notice" style={{ fontSize: 14 }}>
              On iPhone, Safari does the installing:
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.8 }}>
              1. Tap the <strong>Share</strong> button (the square with the arrow, bottom of Safari)<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong><br />
              3. Tap <strong>Add</strong> — Pin High appears on your home screen like an app ⛳
            </p>
            <p className="notice">
              Using Chrome on iPhone? Tap the Share icon in the address bar instead.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
