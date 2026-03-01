import * as esbuild from "esbuild";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

const shared = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  minify: true,
  target: ["es2017"],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
};

// IIFE build (window.NPSKit)
await esbuild.build({
  ...shared,
  format: "iife",
  globalName: "NPSKit",
  outfile: "dist/widget.js",
});

// ESM build
await esbuild.build({
  ...shared,
  format: "esm",
  outfile: "dist/widget.esm.js",
});

console.log(`✅ Widget built v${pkg.version}`);
