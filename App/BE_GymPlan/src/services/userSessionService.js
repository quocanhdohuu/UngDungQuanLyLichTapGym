const { createHmac, randomBytes, timingSafeEqual } = require("node:crypto");

// In development, restarting the server invalidates its in-memory login tokens.
// Set USER_SESSION_SECRET to the same random secret on all production instances.
const secret = process.env.USER_SESSION_SECRET || randomBytes(32);
const signature = (payload) => createHmac("sha256", secret).update(payload).digest();

const issueToken = ({ accountId, profileId, loginSessionId }) => {
  const payload = Buffer.from(JSON.stringify({ accountId, profileId, loginSessionId })).toString("base64url");
  return `${payload}.${signature(payload).toString("base64url")}`;
};

const verifyToken = (token) => {
  if (typeof token !== "string" || token.length > 2048) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, encodedSignature] = parts;
  const supplied = Buffer.from(encodedSignature, "base64url");
  const expected = signature(payload);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return [session.accountId, session.profileId, session.loginSessionId].every(
      (id) => Number.isSafeInteger(id) && id > 0,
    ) ? session : null;
  } catch { return null; }
};

module.exports = { issueToken, verifyToken };
