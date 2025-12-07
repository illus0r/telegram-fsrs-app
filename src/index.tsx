import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Global styles for Telegram WebApp
const globalStyles = `
  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--tg-theme-bg-color, #ffffff);
    color: var(--tg-theme-text-color, #000000);
  }

  #root {
    height: 100%;
    overflow: hidden;
  }

  /* Remove default button styles */
  button {
    font-family: inherit;
  }

  button:active {
    opacity: 0.7;
  }

  /* Textarea styles */
  textarea:focus {
    border-color: var(--tg-theme-button-color, #2481cc);
  }

  /* Selection styles */
  ::selection {
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #ffffff);
  }

  /* Loading spinner animation */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Smooth transitions */
  * {
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }

  /* Dark theme adjustments */
  @media (prefers-color-scheme: dark) {
    html, body {
      background-color: var(--tg-theme-bg-color, #1c1c1e);
      color: var(--tg-theme-text-color, #ffffff);
    }
  }

  /* Disable text selection on buttons */
  button {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Remove focus outline for mouse users */
  button:focus:not(:focus-visible) {
    outline: none;
  }

  /* Safe area for iOS devices */
  @supports (padding: max(0px)) {
    body {
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
    }
  }
`;

// Inject global styles
const styleElement = document.createElement('style');
styleElement.textContent = globalStyles;
document.head.appendChild(styleElement);

// Initialize app
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

// Error boundary for production
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '32px',
          textAlign: 'center',
          backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
          color: 'var(--tg-theme-text-color, #000000)',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: '0 0 16px 0',
          }}>
            Произошла ошибка
          </h2>
          <p style={{
            fontSize: '16px',
            margin: '0 0 24px 0',
            color: 'var(--tg-theme-hint-color, #8e8e93)',
            lineHeight: '1.4',
          }}>
            Что-то пошло не так. Попробуйте обновить страницу.
          </p>
          <button
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
              color: 'var(--tg-theme-button-text-color, #ffffff)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
            onClick={() => window.location.reload()}
          >
            Обновить страницу
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);