module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    // Rewrites "@/foo" imports to a resolvable relative path at compile
    // time, so neither Metro nor Jest (both of which run source through
    // this same babel.config.js) need any alias config of their own — by
    // the time either sees the import, it's already a plain relative
    // path. "@" maps to src/ specifically, not the repo root: App.tsx and
    // other root-level files (config files, __tests__/App.test.tsx's
    // import of App.tsx itself) are few and shallow enough that a plain
    // relative import for them is clearer than a second alias.
    [
      "module-resolver",
      {
        root: ["."],
        alias: { "@": "./src" },
        extensions: [".ios.js", ".android.js", ".js", ".jsx", ".ts", ".tsx", ".json"],
      },
    ],
  ],
};
