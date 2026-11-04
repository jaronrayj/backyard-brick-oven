// Copies a Google Photos image into Firebase Storage so the menu doesn't
// depend on Google Photos share links, which can change or stop working.
// Called from the menu manager (/admin/menu) by admins only.
import { randomUUID } from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { requireRole } from "./team.js";
import { getStorage } from "firebase-admin/storage";
import { getDatabase } from "firebase-admin/database";
import { onValueWritten } from "firebase-functions/v2/database";
import sharp from "sharp";

if (!getApps().length) initializeApp();

const MAX_BYTES = 8 * 1024 * 1024;
const WIDTH = 1200;

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

// invoker "public" lets browsers reach it; the admin check below does the gating.
export const importMenuPhoto = onCall({ invoker: "public", memory: "512MiB" }, async (request) => {
  await requireRole(request, ["admin"], "Only admins can import menu photos.");
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

// ---------- Small copies for lists and menu cards ----------
//
// Menu photos are saved around 1000-1200 px (~190 KB). Lists and the public
// cards show them far smaller, so each photo gets a 600 px copy at
// pizzas/thumbs/ (~40-60 KB) in `thumb`, with `thumbOf` = the photo it was
// made from. Made automatically when a pizza's photo changes; `makeMenuThumbs`
// fills in any that are missing (run once for photos from before).
const THUMB_WIDTH = 600;

const storagePath = (url) => {
  const m = /\/o\/([^?]+)/.exec(String(url || ""));
  return m ? decodeURIComponent(m[1]) : null;
};

const saveThumb = async (img) => {
  const bucket = getStorage().bucket();
  const from = storagePath(img);
  if (!from || !img.includes(bucket.name)) return null; // only photos in our bucket
  const [bytes] = await bucket.file(from).download();
  const small = await sharp(bytes).rotate().resize({ width: THUMB_WIDTH, withoutEnlargement: true }).jpeg({ quality: 72, mozjpeg: true }).toBuffer();
  const name = from.split("/").pop().replace(/\.[a-z]+$/i, "");
  const path = `pizzas/thumbs/${name}.jpg`;
  const token = randomUUID();
  await bucket.file(path).save(small, {
    resumable: false,
    metadata: {
      contentType: "image/jpeg",
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
};

const thumbFor = async (id, pizza) => {
  if (!pizza || !pizza.img || pizza.thumbOf === pizza.img) return false;
  const thumb = await saveThumb(pizza.img);
  if (!thumb) return false;
  await getDatabase().ref(`pizzas/${id}`).update({ thumb, thumbOf: pizza.img });
  return true;
};

export const menuThumbOnPhoto = onValueWritten(
  { ref: "/pizzas/{id}/img", region: "us-central1", memory: "512MiB" },
  async (event) => {
    const id = event.params.id;
    const snap = await getDatabase().ref(`pizzas/${id}`).get();
    try {
      await thumbFor(id, snap.val());
    } catch (err) {
      logger.error(`Thumbnail for ${id} failed`, err);
    }
  }
);

export const makeMenuThumbs = onCall({ invoker: "public", memory: "512MiB", timeoutSeconds: 300 }, async (request) => {
  await requireRole(request, ["admin"], "Only admins can update menu photos.");
  const pizzas = (await getDatabase().ref("pizzas").get()).val() || {};
  let made = 0;
  const failed = [];
  for (const [id, pizza] of Object.entries(pizzas)) {
    try {
      if (await thumbFor(id, pizza)) made += 1;
    } catch (err) {
      logger.error(`Thumbnail for ${id} failed`, err);
      failed.push(pizza.name || id);
    }
  }
  return { made, failed };
});
