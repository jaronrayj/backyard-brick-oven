// Google APIs as this project's Cloud Functions service account: an access
// token from the metadata server, and the account's email for sharing
// instructions ("share the sheet with …").
const METADATA = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default";

const metadata = async (path) => {
  const res = await fetch(`${METADATA}/${path}`, { headers: { "Metadata-Flavor": "Google" } });
  if (!res.ok) throw new Error(`metadata ${path}: ${res.status}`);
  return res;
};

export const accessToken = async (scopes) =>
  (await (await metadata(`token?scopes=${[].concat(scopes).join(",")}`)).json()).access_token;

export const serviceAccountEmail = async () => {
  try {
    return (await (await metadata("email")).text()).trim();
  } catch (e) {
    return "this project's Cloud Functions service account";
  }
};
