import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Keeps a rendering fault from blanking the whole app. Content is loaded and
 * validated at startup, so the most likely cause here is a malformed case or
 * a corrupt profile — both of which the learner can recover from without
 * losing their data, so the fallback offers that rather than only an apology.
 */
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No analytics endpoint exists yet; the console is the only sink.
    console.error("Unhandled error in Clinician:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="app">
        <div className="card">
          <h2>Something went wrong</h2>
          <p className="sub" style={{ margin: "8px 0 14px" }}>
            The app hit an error it could not recover from on its own. Your progress is stored on
            this device and has not been deleted.
          </p>
          <pre className="error-detail">{this.state.error.message}</pre>
          <button className="big-btn" onClick={() => window.location.reload()}>
            Reload the app
          </button>
          <button
            className="big-btn ghost"
            style={{ marginTop: 10 }}
            onClick={() => {
              // An interrupted encounter is the most likely poison pill; drop
              // it before a full reset, which would take the profile with it.
              localStorage.removeItem("clinician-encounter-v1");
              window.location.reload();
            }}
          >
            Discard the in-progress case and reload
          </button>
        </div>
      </div>
    );
  }
}
