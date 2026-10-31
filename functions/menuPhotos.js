// Copies a Google Photos image into Firebase Storage so the menu doesn't
// depend on Google Photos share links, which can change or stop working.
// Called from the menu manager (/admin/menu) by menu admins only.
import { randomUUID } from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getStorage } from "firebase-admin/storage";

if (!getApps().length) initializeApp();

const MAX_BYTES = 8 * 1024 * 1024;
const WIDTH = 1200;

const isMenuAdmin = async (token) => {
  if (!token?.email || !token.email_verified) return false;
  const key = token.email.toLowerCase().replace(/\./g, ",");
  return (await getDatabase().ref(`menuAdmins/${key}`).get()).val() === true;
};

// Google Photos links end in size options like "=w1920-h1080"; ask for 1200px wide instead.
const sizedUrl = (raw) => {
  let url;
  try {
    url = new URL(raw);
  } catch (e) {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== "lh3.googleusercontent.com") return null;
  url.pathname = url.pathname.replace(/=[\w-]*$/, "") + `=w${WIDTH}`;
  url.search = "";
  return url.toString();
};

// invoker "public" lets browsers reach it; the menu admin check below does the gating.
export const importMenuPhoto = onCall({ invoker: "public", memory: "512MiB" }, async (request) => {
  if (!(await isMenuAdmin(request.auth?.token))) {
    throw new HttpsError("permission-denied", "Only menu admins can import photos.");
  }
  const source = sizedUrl(request.data?.url);
  if (!source) {
    throw new HttpsError("invalid-argument", "Only Google Photos links (lh3.googleusercontent.com) can be imported.");
  }

  const res = await fetch(source, { redirect: "error" }).catch(() => null);
  const type = res?.headers.get("content-type") || "";
  if (!res || !res.ok || !type.startsWith("image/")) {
    logger.warn(`Photo import failed: ${res ? res.status : "no response"} ${type}`);
    throw new HttpsError("not-found", "Google Photos didn't return that image. The link may have expired.");
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new HttpsError("invalid-argument", "That image is too large.");

  const bucket = getStorage().bucket();
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const path = `pizzas/imported-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const token = randomUUID();
  await bucket.file(path).save(bytes, {
    resumable: false,
    metadata: {
      contentType: type,
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
  return { url, bytes: bytes.length };
});
