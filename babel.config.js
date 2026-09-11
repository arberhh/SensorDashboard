module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    // Rewrites "@/foo" and "@tests/foo" imports to a resolvable relative
    // path at compile time, so neither Metro nor Jest (both of which run
    // source through this same babel.config.js) need any alias config of
    // their own — by the time either sees the import, it's already a
    // plain relative path. Deliberately scoped to src/ and __tests__/
    // specifically, not the repo root: App.tsx and other root-level files
    // (config files, __tests__/App.test.tsx's import of App.tsx itself)
    // are few and shallow enough that a plain relative import for them is
    // clearer than a third, root-covering alias that would also start
    // matching noise like @/android or @/ios.
    [
      "module-resolver",
      {
        root: ["."],
        alias: { "@": "./src", "@tests": "./__tests__" },
        extensions: [".ios.js", ".android.js", ".js", ".jsx", ".ts", ".tsx", ".json"],
      },
    ],
  ],
};
