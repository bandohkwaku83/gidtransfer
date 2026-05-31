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

/**
 * Opens Google sign-in and resolves with a Google ID token (JWT) for POST /api/auth/google.
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID to match GOOGLE_CLIENT_ID on the API.
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
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error("Google sign-in timed out. Please try again.")));
    }, 120_000);

    idApi.initialize({
      client_id: trimmed,
      callback: (response) => {
        window.clearTimeout(timeout);
        if (!response?.credential) {
          finish(() => reject(new Error("Google did not return a sign-in token.")));
          return;
        }
        finish(() => resolve(response.credential));
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-9999px";
    host.style.width = "1px";
    host.style.height = "1px";
    host.style.overflow = "hidden";
    document.body.appendChild(host);

    try {
      idApi.renderButton(host, { type: "standard", size: "large", width: 280 });
      const btn = host.querySelector<HTMLElement>('[role="button"], div[tabindex="0"]');
      if (!btn) {
        document.body.removeChild(host);
        window.clearTimeout(timeout);
        finish(() =>
          reject(new Error("Google sign-in button could not be created. Try again.")),
        );
        return;
      }
      btn.click();
    } catch (err) {
      document.body.removeChild(host);
      window.clearTimeout(timeout);
      finish(() =>
        reject(
          err instanceof Error ? err : new Error("Could not start Google sign-in."),
        ),
      );
    }

    window.setTimeout(() => {
      if (host.parentNode) host.parentNode.removeChild(host);
    }, 5000);
  });
}

export function getGoogleClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return id || null;
}
