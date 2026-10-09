// Prints the source digest of this checkout: compare it with the "source" a running Store reports on /health.
import { sourceDigest } from "../src/service/server.mjs";
console.log(JSON.stringify(sourceDigest(), null, 2));
