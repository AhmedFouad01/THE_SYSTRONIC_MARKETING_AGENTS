import { cp, mkdir } from "node:fs/promises";
await mkdir("dist/web", { recursive: true });
await cp("web/index.html", "dist/web/index.html");
await cp("migrations", "dist/migrations", { recursive: true });
