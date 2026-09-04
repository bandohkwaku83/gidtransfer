export type AppToastKind = "success" | "error" | "info";

export type AppToastEvent = {
  message: string;
  kind: AppToastKind;
};

type Listener = (event: AppToastEvent) => void;

const listeners = new Set<Listener>();

export function emitAppToast(message: string, kind: AppToastKind = "info"): void {
  const event = { message, kind };
  for (const listener of listeners) listener(event);
}

export function subscribeAppToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
