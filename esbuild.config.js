import { build } from "esbuild";

await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    target: ["node20"],
    sourcemap: false,
    minify: true,
    external: [
        "electron",
        "fs",
        "path",
        "os",
        "child_process",
        "events",
        "nodejs-whisper",
    ],
    format: "cjs",
    outfile: "dist/index.cjs",
});