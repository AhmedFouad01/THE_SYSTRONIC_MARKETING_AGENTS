import { cp, mkdir } from "node:fs/promises";
await mkdir("dist/web", { recursive: true });
await cp("web", "dist/web", { recursive: true });
await cp("migrations", "dist/migrations", { recursive: true });
