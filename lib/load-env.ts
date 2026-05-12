/**
 * Load env vars from .env.local first, then .env (only for non-set keys).
 * Use this in scripts that run outside Next.js (which loads .env.local automatically).
 */

import { config as loadDotenv } from "dotenv";
import path from "node:path";

loadDotenv({ path: path.join(process.cwd(), ".env.local") });
loadDotenv({ path: path.join(process.cwd(), ".env") });
