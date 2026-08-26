import { redirect } from "next/navigation";

/** Create flow lives in a modal on the list page (same pattern as clients / galleries). */
export default function NewCollaborationPage() {
  redirect("/collaborations?new=1");
}
