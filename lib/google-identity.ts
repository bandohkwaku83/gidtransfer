const GSI_SCRIPT = "https://accounts.google.com/gsi/client";

type CredentialResponse = { credential: string };

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: { type?: string; size?: string; width?: number; theme?: string },
  ) => void;
  prompt: (momentListener?: (notification: { isNotDisplayed: () => boolean }) => void) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in is only available in the browser."));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SCRIPT}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google sign-in.")),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/** User closed the Google account chooser without picking an account. */
export class GoogleSignInCancelledError extends Error {
  constructor() {
    super("Google sign-in was cancelled.");
    this.name = "GoogleSignInCancelledError";
  }
}

/**
 * The Sign In With Google button does not report a closed popup. While the
 * chooser is open the page loses focus; when it is dismissed, focus returns
 * and no credential arrives. Wait briefly so a successful sign-in can deliver
 * its token first.
 */
function watchGooglePopupDismissal(onDismiss: () => void): () => void {
  let awaySince: number | null = null;
  let cancelTimer: number | null = null;

  const clearCancelTimer = () => {
    if (cancelTimer === null) return;
    window.clearTimeout(cancelTimer);
    cancelTimer = null;
  };

  const scheduleDismiss = () => {
    if (awaySince === null || cancelTimer !== null) return;
    const awayFor = Date.now() - awaySince;
    // Ignore the brief blur when focus enters the hidden Google button iframe.
    if (awayFor < 100) {
      awaySince = null;
      return;
    }
    awaySince = null;
    cancelTimer = window.setTimeout(() => {
      cancelTimer = null;
      if (!document.hasFocus() || document.visibilityState === "hidden") return;
      onDismiss();
    }, 800);
  };

  const noteAway = () => {
    if (awaySince === null) awaySince = Date.now();
    clearCancelTimer();
  };

  const onBlur = () => {
    noteAway();
  };

  const onFocus = () => {
    scheduleDismiss();
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      noteAway();
      return;
    }
    if (document.hasFocus()) scheduleDismiss();
  };

  const poll = window.setInterval(() => {
    const away = !document.hasFocus() || document.visibilityState === "hidden";
    if (away) {
      noteAway();
      return;
    }
    scheduleDismiss();
  }, 250);

  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    clearCancelTimer();
    window.clearInterval(poll);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

/**
 * Opens Google sign-in and resolves with a Google ID token (JWT) for POST /api/auth/google.
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID to match GOOGLE_CLIENT_ID on the API.
 * Rejects with GoogleSignInCancelledError when the account chooser is closed.
 */
export async function requestGoogleIdToken(clientId: string): Promise<string> {
  const trimmed = clientId.trim();
  if (!trimmed) {
    throw new Error(
      "Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment.",
    );
  }

  await loadGoogleIdentityScript();
  const idApi = window.google?.accounts?.id;
  if (!idApi) {
    throw new Error("Google sign-in failed to initialize.");
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    let stopWatching = () => {};
    let hostTimer = 0;

    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-9999px";
    host.style.width = "1px";
    host.style.height = "1px";
    host.style.overflow = "hidden";

    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error("Google sign-in timed out. Please try again.")));
    }, 120_000);

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      window.clearTimeout(hostTimer);
      stopWatching();
      stopWatching = () => {};
      if (host.parentNode) host.parentNode.removeChild(host);
      fn();
    };

    idApi.initialize({
      client_id: trimmed,
      callback: (response) => {
        if (!response?.credential) {
          finish(() => reject(new Error("Google did not return a sign-in token.")));
          return;
        }
        finish(() => resolve(response.credential));
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    document.body.appendChild(host);

    try {
      idApi.renderButton(host, { type: "standard", size: "large", width: 280 });
      const btn = host.querySelector<HTMLElement>('[role="button"], div[tabindex="0"]');
      if (!btn) {
        finish(() =>
          reject(new Error("Google sign-in button could not be created. Try again.")),
        );
        return;
      }
      stopWatching = watchGooglePopupDismissal(() => {
        finish(() => reject(new GoogleSignInCancelledError()));
      });
      btn.click();
    } catch (err) {
      finish(() =>
        reject(
          err instanceof Error ? err : new Error("Could not start Google sign-in."),
        ),
      );
      return;
    }

    hostTimer = window.setTimeout(() => {
      if (host.parentNode) host.parentNode.removeChild(host);
    }, 5000);
  });
}

export function getGoogleClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return id || null;
}
