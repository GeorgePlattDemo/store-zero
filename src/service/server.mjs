/**
 * Store Zero over HTTPS: the request of the specification §3.1 in, the Store's answer out.
 *
 *   GET  /health        this Store's release, protocol, catalog clock and accepted request types
 *   POST /v1/requests   { requestType, requestId, demand }  →  { protocol, storeRelease, payloadDigest, respondedAt, answer }
 *
 *   POST /v1/machine-evidence  accepted packet and expected configuration identity → virtual evidence only
 *
 * The service only carries requests. It computes nothing itself: evaluation comes from the request layer,
 * against the catalog read for that request. A refusal is an answer (200); an HTTP error means the request
 * could not be read at all.
 *
 * Release identity is required to start: the commit the host deployed (Render's RENDER_GIT_COMMIT, Railway's
 * RAILWAY_GIT_COMMIT_SHA), or STORE_ZERO_RELEASE where the host supplies none. A label that contradicts the host's
 * commit is refused. A Store that cannot name itself does not answer.
 *
 * A label is only a claim. /health also reports the digest of the files this process actually runs (package.json,
 * src/ and data/, the set the Dockerfile copies). Anyone can recompute it from a checkout of the claimed commit
 * (`npm run source-digest`); equal digests mean the running code is that commit's code.
 */
import http from "node:http";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadCatalog, validateCatalog } from "../evaluation/catalog.mjs";
import { catalogHash, evaluateStoreRequest, REQUEST_TYPES } from "../requests/store-request.mjs";
import { evaluateMachineEvidence, machineEvidenceIdentity, MACHINE_EVIDENCE_PROTOCOL } from "../machine/evidence.mjs";

export const PROTOCOL = "STORE-ZERO-REQUEST-1";
export const PATHS = Object.freeze({ health: "/health", requests: "/v1/requests", machineEvidence: "/v1/machine-evidence" });
export const LIMITS = Object.freeze({ maxBodyBytes: 256 * 1024, requestTimeoutMs: 15_000, headersTimeoutMs: 10_000 });
export const DEFAULT_ALLOWED_ORIGINS = Object.freeze(["https://georgeplattdemo.github.io"]);

export function releaseFromEnvironment(env = process.env) {
  const hostCommit = (env.RENDER_GIT_COMMIT || env.RAILWAY_GIT_COMMIT_SHA || "").trim();
  const label = (env.STORE_ZERO_RELEASE || "").trim();
  if (hostCommit && label && label !== hostCommit) {
    throw new Error(`Store Zero will not start: STORE_ZERO_RELEASE (${label}) contradicts the commit the host deployed (${hostCommit}).`);
  }
  const release = hostCommit || label;
  if (!release) throw new Error("Store Zero will not start without its release identity: set STORE_ZERO_RELEASE (Render supplies RENDER_GIT_COMMIT, Railway RAILWAY_GIT_COMMIT_SHA).");
  return release;
}

const SERVICE_ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const SOURCE_DIGEST_RULE = "STORE-ZERO-SOURCE-DIGEST-1: SHA-256 over sorted lines <path> NUL <sha256 of file> LF, for package.json and every file under src/ and data/";

/** The digest of the code and data a Store runs from `root`: what /health reports and a checkout recomputes. */
export function sourceDigest(root = SERVICE_ROOT) {
  const walk = (dir) => readdirSync(join(root, dir)).sort().flatMap((name) => {
    const path = `${dir}/${name}`;
    return statSync(join(root, path)).isDirectory() ? walk(path) : [path];
  });
  const files = ["package.json", ...walk("src"), ...walk("data")].sort();
  const lines = files.map((path) => `${path}\0${createHash("sha256").update(readFileSync(join(root, path))).digest("hex")}\n`);
  return { rule: SOURCE_DIGEST_RULE, digest: createHash("sha256").update(lines.join("")).digest("hex"), files: files.length };
}

export function allowedOriginsFromEnvironment(env = process.env) {
  const listed = (env.STORE_ZERO_ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
  return listed.length ? listed : [...DEFAULT_ALLOWED_ORIGINS];
}

function send(res, status, body, headers = {}) {
  const payload = Buffer.from(JSON.stringify(body), "utf8");
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": payload.length, "Cache-Control": "no-store", ...headers });
  res.end(payload);
}

const httpError = (res, status, code, headers) => send(res, status, { protocol: PROTOCOL, error: code }, headers);

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        // Stop keeping the body but let the reply reach the caller; the connection closes after it.
        req.removeAllListeners("data");
        req.resume();
        reject(Object.assign(new Error("too large"), { status: 413 }));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** Builds the HTTP handler. `catalog` and `now` exist so tests can fix them; in service the catalog is read per request. */
export function createHandler({ release, allowedOrigins = DEFAULT_ALLOWED_ORIGINS, catalog, now = () => new Date().toISOString() }) {
  if (typeof release !== "string" || !release.trim()) throw new Error("createHandler needs this Store's release identity");
  const origins = new Set(allowedOrigins);
  // The shipped files are immutable for the life of the process. The identity is taken from this process's own root
  // when it starts, and every answer first checks the files are still those: if any changed, the Store stops answering
  // rather than advertise one source while evaluating another.
  const source = sourceDigest();
  const sourceChanged = () => sourceDigest().digest !== source.digest;

  return async function handle(req, res) {
    let pathname;
    try {
      pathname = new URL(req.url ?? "/", "http://store.invalid").pathname;
    } catch {
      return httpError(res, 400, "BAD_URL");
    }

    // A browser on another site may not use this Store. Callers without an Origin (servers, health checks) may.
    const origin = req.headers.origin;
    if (origin !== undefined && !origins.has(origin)) return httpError(res, 403, "ORIGIN_NOT_ALLOWED");
    const cors = origin ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "600", Vary: "Origin" } : {};

    if (pathname === PATHS.health) {
      if (req.method !== "GET" && req.method !== "HEAD") return httpError(res, 405, "METHOD_NOT_ALLOWED", { Allow: "GET, HEAD", ...cors });
      if (sourceChanged()) return httpError(res, 503, "STORE_SOURCE_CHANGED", cors);
      let current;
      let machineEvidence;
      try {
        current = validateCatalog(catalog ?? loadCatalog());
        machineEvidence = machineEvidenceIdentity();
      } catch (error) {
        return httpError(res, 503, error.code === "STORE_CATALOG_INVALID" ? "STORE_CATALOG_INVALID" : "STORE_MACHINE_CONFIGURATION_INVALID", cors);
      }
      return send(res, 200, {
        status: "ok",
        store: "Store Zero",
        release,
        source,
        protocol: PROTOCOL,
        requestTypes: Object.keys(REQUEST_TYPES),
        catalog: { clock: current.clock, offerings: current.offerings.length, catalogHash: catalogHash(current) },
        machineEvidence
      }, cors);
    }

    if (![PATHS.requests, PATHS.machineEvidence].includes(pathname)) return httpError(res, 404, "NOT_FOUND", cors);
    if (req.method === "OPTIONS") {
      res.writeHead(204, cors);
      return res.end();
    }
    if (req.method !== "POST") return httpError(res, 405, "METHOD_NOT_ALLOWED", { Allow: "POST, OPTIONS", ...cors });
    if (!/^application\/json\b/i.test(String(req.headers["content-type"] ?? ""))) return httpError(res, 415, "CONTENT_TYPE_MUST_BE_APPLICATION_JSON", cors);

    let body;
    try {
      body = await readBody(req, LIMITS.maxBodyBytes);
    } catch (error) {
      return httpError(res, error.status === 413 ? 413 : 400, error.status === 413 ? "REQUEST_TOO_LARGE" : "REQUEST_NOT_READ", { Connection: "close", ...cors });
    }
    let request;
    try {
      request = JSON.parse(body.toString("utf8"));
    } catch {
      return httpError(res, 400, "REQUEST_NOT_JSON", cors);
    }

    if (sourceChanged()) return httpError(res, 503, "STORE_SOURCE_CHANGED", cors);
    // The digest lets the caller prove this answer is to the exact bytes it sent.
    const payloadDigest = createHash("sha256").update(body).digest("hex");
    let answer;
    try {
      answer = pathname === PATHS.machineEvidence
        ? evaluateMachineEvidence(request, { release, catalog, now })
        : evaluateStoreRequest(request, { release, catalog, now });
    } catch (error) {
      if (error.code === "STORE_CATALOG_INVALID") return httpError(res, 503, "STORE_CATALOG_INVALID", cors);
      return httpError(res, 500, pathname === PATHS.machineEvidence ? "STORE_MACHINE_EVIDENCE_FAILED" : "STORE_EVALUATION_FAILED", cors);
    }
    return send(res, 200, { protocol: pathname === PATHS.machineEvidence ? MACHINE_EVIDENCE_PROTOCOL : PROTOCOL, storeRelease: release, payloadDigest, respondedAt: now(), answer }, cors);
  };
}

/** Starts the service. Refuses to start without a release identity or with an invalid catalog. */
export async function startServer({ env = process.env, host = env.HOST?.trim() || "0.0.0.0", port = Number(env.PORT || 8080) } = {}) {
  const release = releaseFromEnvironment(env);
  loadCatalog(); // fail at start, not on the first request
  machineEvidenceIdentity(); // an invalid reference configuration must not be advertised
  const handle = createHandler({ release, allowedOrigins: allowedOriginsFromEnvironment(env) });
  const server = http.createServer((req, res) => {
    handle(req, res).catch(() => (res.headersSent ? res.destroy() : httpError(res, 500, "INTERNAL_ERROR")));
  });
  server.requestTimeout = LIMITS.requestTimeoutMs;
  server.headersTimeout = LIMITS.headersTimeoutMs;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host, port }, resolve);
  });
  return { server, release, port: server.address().port };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const { server, release, port } = await startServer();
    console.log(`Store Zero ${release} listening on ${port} (${PROTOCOL})`);
    const stop = () => server.close(() => process.exit(0));
    process.on("SIGTERM", stop);
    process.on("SIGINT", stop);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
