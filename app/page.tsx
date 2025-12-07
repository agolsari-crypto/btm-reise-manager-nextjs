'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    window.location.href = '/btm-app.html';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Weiterleitung...</p>
    </div>
  );
}
