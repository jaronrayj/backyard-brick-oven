// The /hello email sign-up: what counts as a valid sign-up.
//
// This file is copied byte for byte to src/pages/Hello/signupText.js so the
// page and the function agree (the site and functions build separately).
// functions/signup.test.js fails if the two copies differ.
// No imports, so it runs in both places.

export const NAME_MAX = 60;
export const EMAIL_MAX = 120;

const EMAIL = /^[^\s@<>,;/]+@[^\s@<>,;/]+\.[^\s@<>,;/]+$/;

// " Sam@Example.com " -> "sam@example.com"; "" when it isn't an email.
export const readEmail = (value) => {
  const v = String(value || "").trim();
  return v.length <= EMAIL_MAX && EMAIL.test(v) ? v.toLowerCase() : "";
};

// Checks a sign-up. Returns { error } or { name, email }. The first name is optional.
export const checkSignup = (body) => {
  const b = body || {};
  const name = String(b.name || "").replace(/\s+/g, " ").trim();
  if (name.length > NAME_MAX) return { error: "That name is a bit long. Just your first name is fine." };
  if (!String(b.email || "").trim()) return { error: "Please add your email." };
  const email = readEmail(b.email);
  if (!email) return { error: "That email doesn't look right." };
  return { name, email };
};
