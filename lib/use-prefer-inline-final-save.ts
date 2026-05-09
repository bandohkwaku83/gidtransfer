import { useEffect, useState } from "react";

/** True after mount when the primary pointer is coarse (typical phones/tablets). Used to avoid `/download` attachment flows that land in Files instead of Photos. */
export function usePreferInlineFinalSave(): boolean {
  const [prefer, setPrefer] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setPrefer(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return prefer;
}
