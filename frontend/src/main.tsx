import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Intercept all fetch requests to bypass ngrok warning pages in hosted development
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const newInit = { ...init };
  const headers = new Headers(newInit.headers);
  headers.set('ngrok-skip-browser-warning', 'true');
  newInit.headers = headers;
  return originalFetch(input, newInit);
};

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="render-error">
          <strong>Unable to load PayTracker Login.</strong>
          <span>{this.state.error.message}</span>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root') as HTMLElement;

createRoot(rootElement).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
