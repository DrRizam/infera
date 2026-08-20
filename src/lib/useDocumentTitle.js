import { useEffect } from "react";

/** Sets the browser tab title for the page it's called from, restoring the previous title on unmount. */
export function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — Infera` : "Infera";
    return () => {
      document.title = prev;
    };
  }, [title]);
}
