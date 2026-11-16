// A crew member signed up for a Planner service ("I'm planning to come"):
// let the admins know. crewSignups/{serviceId}__{uid} is written by the
// Planner (src/pages/Planner/index.js); firestore.rules keeps it to their own.
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import logger from "firebase-functions/logger";
import { sendPush } from "./push.js";

const clock12 = (v) => {
  if (!/^\d{1,2}:\d{2}$/.test(String(v || ""))) return "";
  const [h, m] = v.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
};
const day = (iso) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))
    ? new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })
    : "";

export const signupMessage = (s) => ({
  title: `${String(s.name || "Someone").trim()} is planning to come`,
  body: [day(s.date), [clock12(s.from), clock12(s.to)].filter(Boolean).join("–")].filter(Boolean).join(", ") + ". Add them to the crew in the Planner.",
});

export const notifyCrewSignup = onDocumentCreated({ document: "crewSignups/{id}", region: "us-central1" }, async (event) => {
  const s = event.data && event.data.data();
  if (!s) return;
  try {
    await sendPush({ ...signupMessage(s), link: "/planner", tag: `signup-${event.params.id}` });
  } catch (e) {
    logger.error("Crew sign-up notification failed", e);
  }
});
