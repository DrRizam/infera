import { Component } from "react";

/**
 * App-wide crash guard. Without this, any render-time exception in a page
 * component blanks the whole screen — a beta tester just sees white and has
 * nothing to report. This catches it, keeps the shell, and points them at
 * the feedback form.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error", error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.assign("/home");
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-2xl font-black tracking-tight">Something broke on this screen</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          That is a bug on our side, not yours — this is a beta. Reloading usually clears it. If it keeps
          happening, please tell us what you were doing from the Feedback box on your Profile.
        </p>
        <button
          onClick={this.handleReload}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          Back to Learn
        </button>
        {import.meta.env.DEV && (
          <pre className="mt-2 max-w-full overflow-x-auto rounded-lg bg-muted p-3 text-left text-xs text-muted-foreground">
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        )}
      </div>
    );
  }
}
