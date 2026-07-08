/**
 * A render error boundary — so a bad node or a throwing atom shows a graceful,
 * themed fallback instead of white-screening the whole builder. Used twice: a
 * top-level backstop around the chrome, and a RECOVERABLE one around the canvas
 * (its fallback offers "Undo last change", which fixes the offending edit, then
 * resets the boundary so the canvas remounts against the corrected document).
 *
 * A class component is unavoidable here (only class boundaries catch render
 * errors); the FALLBACK is a normal function component, so it can use hooks and
 * @wizeworks/silicaui components like anything else in the chrome.
 */
import * as React from "react";

interface Props {
  children: React.ReactNode;
  /** Renders the fallback UI; `reset` clears the caught error and remounts children. */
  fallback: (error: Error, reset: () => void) => React.ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Surface it for debugging; a host can wrap console to forward these.
    console.error("[@wizeworks/silicaui-builder] render error:", error, info.componentStack);
  }

  reset = (): void => this.setState({ error: null });

  render(): React.ReactNode {
    if (this.state.error) return this.props.fallback(this.state.error, this.reset);
    return this.props.children;
  }
}
