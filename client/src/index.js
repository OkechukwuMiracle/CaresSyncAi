import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast"; // Import Toaster here
import App from "./App";
import { SupabaseProvider } from "./contexts/SupabaseContext";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

// index.js - Improved ErrorBoundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Ignore StrictMode + Router cleanup errors completely
    if (
      error.name === "NotFoundError" &&
      (error.message.includes("removeChild") ||
        error.message.includes("insertBefore")) &&
      error.message.includes("Node")
    ) {
      console.warn("Ignoring StrictMode + Router DOM cleanup error (dev only)");
      return null; // Don't trigger error state
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log non-StrictMode errors
    if (
      !(error.name === "NotFoundError" && error.message.includes("removeChild"))
    ) {
      console.error("ErrorBoundary caught:", error, errorInfo);
      this.setState({ error, errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Something went wrong
            </h2>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ErrorBoundary>
    <BrowserRouter>
              <SupabaseProvider>
          <AuthProvider>
            <App />
            {/* Move Toaster to root level */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
              }}
            />
          </AuthProvider>
        </SupabaseProvider>
          </BrowserRouter>
  </ErrorBoundary>
);
