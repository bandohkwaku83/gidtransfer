export type PlanApiErrorEvent =
  | {
      code: "SUBSCRIPTION_VIEW_ONLY";
      message: string;
    }
  | {
      code: "PLAN_FEATURE_REQUIRED";
      message: string;
      feature: string;
      requiredPlans: string[];
      suggestedPlanId: string | null;
      trialExpired: boolean;
    }
  | {
      code: "GALLERY_LIMIT_REACHED";
      message: string;
    }
  | {
      code: "VIDEO_LIMIT_REACHED";
      message: string;
      feature: string;
    };

type Listener = (event: PlanApiErrorEvent) => void;

const listeners = new Set<Listener>();

export function emitPlanApiError(event: PlanApiErrorEvent): void {
  for (const listener of listeners) listener(event);
}

export function subscribePlanApiError(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
