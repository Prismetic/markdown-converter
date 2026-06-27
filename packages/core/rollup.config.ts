import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const target = process.env.TARGET || "node";

if (target !== "browser" && target !== "node") {
  throw new Error("Invalid TARGET=\"" + target + "\". Must be \"browser\" or \"node\".");
}

const isBrowser = target === "browser";

const nodeExternals = ["fs", "path", "os", "stream", "crypto", "zlib", "buffer", "events", "url", "util", "http", "https", "net", "tls"];

// node:module is Node-only; mark external for browser so its dynamic import
// in pdf.ts stays as-is in the output (the guarded code path never runs in browsers).
const browserExternals = ["node:module"];

export default {
  input: "src/index.ts",
  output: isBrowser
    ? {
        file: "dist/browser/index.esm.js",
        format: "esm",
        sourcemap: true,
        inlineDynamicImports: true,
      }
    : {
        file: "dist/node/index.cjs",
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
  plugins: [
    resolve({
      browser: isBrowser,
      preferBuiltins: !isBrowser,
    }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      sourceMap: true,
      declaration: false,
      declarationMap: false,
    }),
  ],
  external: isBrowser ? browserExternals : nodeExternals,
};
