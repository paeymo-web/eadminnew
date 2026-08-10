import { useEffect, useRef } from 'react';
import { HTML_MARKUP } from './markup';
import './logic';
import './logic2';
import './logic3';
import './logic4';
import './logic5';
import './logic6';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = window as any;

    // Load initial theme from preferences
    const savedTheme = localStorage.getItem('ea-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Bootstrap autosavers, clocks, and options
    if (w.initAutoSave) w.initAutoSave();
    if (w.startClock) w.startClock();

    // Check stored user session
    const authStr = localStorage.getItem('ea-auth');
    if (authStr) {
      try {
        w.currentUser = JSON.parse(authStr);
        if (w.applyLoginState) w.applyLoginState();
      } catch (err) {
        localStorage.removeItem('ea-auth');
        showLoginScreen();
        if (w.loadDataFromServer) w.loadDataFromServer();
      }
    } else {
      showLoginScreen();
      if (w.loadDataFromServer) w.loadDataFromServer();
    }

    function showLoginScreen() {
      const login = document.getElementById('loginScreen');
      if (login) login.style.display = 'flex';
      const shell = document.getElementById('appShell');
      if (shell) shell.classList.remove('visible');
    }

    // Keyboard global listener for ESC & OmniSearch (Ctrl+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const activeModals = document.querySelectorAll('.ov.op');
        activeModals.forEach((m: any) => {
          if (m.id && w.closeModal) w.closeModal(m.id);
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (w.openOmniSearch) w.openOmniSearch();
      }
    };

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList && target.classList.contains('ov')) {
        if (target.id && w.closeModal) w.closeModal(target.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleGlobalClick);
    if (w.safeCreateIcons) w.safeCreateIcons();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="appContainer"
      dangerouslySetInnerHTML={{ __html: HTML_MARKUP }}
    />
  );
}
