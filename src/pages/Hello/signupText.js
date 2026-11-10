// The /hello sign-up (QR code on event posters): the consent wording and the
// rules for what counts as a phone number or an email.
//
// This file is copied byte for byte to src/pages/Hello/signupText.js so the
// page and the function agree (the site and functions build separately).
// functions/signup.test.js fails if the two copies differ.
// No imports, so it runs in both places.

export const TEXT_CONSENT =
  "I agree to get occasional texts from Backyard Brick Oven about pop-ups and specials. Msg & data rates may apply. Reply STOP to opt out.";

export const NAME_MAX = 60;
export const CONTACT_MAX = 120;

const EMAIL = /^[^\s@<>,;/]+@[^\s@<>,;/]+\.[^\s@<>,;/]+$/;

// "(801) 555-1234", "801.555.1234", "+1 801 555 1234" -> "+18015551234"; otherwise "".
export const usPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10 && /^[2-9]/.test(digits)) return `+1${digits}`;
  if (digits.length === 11 && /^1[2-9]/.test(digits)) return `+${digits}`;
  return "";
};

// What the visitor typed in "Phone or email":
//   { type: "email", contact: "sam@example.com" }
//   { type: "phone", contact: "+18015551234" }
//   { type: "", contact: "" }  - neither (yet)
export const readContact = (value) => {
  const v = String(value || "").trim();
  if (v.includes("@")) return EMAIL.test(v) ? { type: "email", contact: v.toLowerCase() } : { type: "", contact: "" };
  const phone = usPhone(v);
  return phone ? { type: "phone", contact: phone } : { type: "", contact: "" };
};

// While typing: show the texts checkbox as soon as it looks like a phone number
// (no @ and some digits), before it's complete.
export const looksLikePhone = (value) => {
  const v = String(value || "");
  return !v.includes("@") && (v.match(/\d/g) || []).length >= 3;
};

// "+18015551234" -> "(801) 555-1234"
export const prettyPhone = (e164) => {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(String(e164 || ""));
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : String(e164 || "");
};

// Checks a sign-up. Returns { error } or { name, type, contact, consent }.
export const checkSignup = (body) => {
  const b = body || {};
  const name = String(b.name || "").replace(/\s+/g, " ").trim();
  if (!name) return { error: "Please add your first name." };
  if (name.length > NAME_MAX) return { error: "That name is a bit long. Just your first name is fine." };
  const raw = String(b.contact || "").trim();
  if (!raw) return { error: "Please add a phone number or email." };
  if (raw.length > CONTACT_MAX) return { error: "That phone number or email doesn't look right." };
  const { type, contact } = readContact(raw);
  if (!type) return { error: "That phone number or email doesn't look right." };
  const consent = b.consent === true;
  if (type === "phone" && !consent) return { error: "Please check the box to get texts, or use your email instead." };
  return { name, type, contact, consent: type === "phone" ? consent : false };
};

// Short code to show at the counter, like "BYBO-K7QM". No 0/O, 1/I/L, 2/Z, 5/S, 8/B.
const CODE_LETTERS = "ACDEFGHJKMNPQRTUVWXY34679";
export const newCode = (random = Math.random) => {
  let out = "";
  for (let i = 0; i < 4; i += 1) out += CODE_LETTERS[Math.floor(random() * CODE_LETTERS.length)];
  return `BYBO-${out}`;
};
