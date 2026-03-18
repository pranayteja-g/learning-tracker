import { Component } from "react";

/**
 * Error Boundary - Catches rendering errors and displays fallback UI
 * Prevents entire app from crashing due to single component error
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "#13131a",
            color: "#fff",
            padding: "20px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "500px",
              textAlign: "center",
              background: "#16161b",
              padding: "40px",
              borderRadius: "12px",
              border: "1px solid #2a2a35",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>💥</div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: "14px", color: "#888", marginBottom: "24px", lineHeight: "1.6" }}>
              An unexpected error occurred. Try reloading the page or clearing your browser cache if the problem persists.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div
                style={{
                  background: "#0d1117",
                  border: "1px solid #e0525244",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "24px",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: "12px", color: "#e05252", fontFamily: "monospace", wordBreak: "break-word" }}>
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <div style={{ fontSize: "11px", color: "#666", marginTop: "8px", maxHeight: "200px", overflow: "auto" }}>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={this.handleReset}
              style={{
                width: "100%",
                padding: "12px",
                background: "#52b788",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
