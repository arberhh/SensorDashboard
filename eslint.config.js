// Flat config (ESLint 9+). Runs after oxlint, scoped to rules oxlint
// doesn't implement yet — see the "lint" script and docs/tooling-stack
// from the rn-conventions server for the reasoning behind the split.
const baseConfig = require("@react-native/eslint-config/flat");

module.exports = [
  ...baseConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "react-native/no-color-literals": "error",
      "react-native/no-inline-styles": "error",
      "react-native/no-raw-text": "error",
      "react-native/no-single-element-style-arrays": "error",
      "react-native/no-unused-styles": "error",
      "react-native/sort-styles": "error",
      "react-native/split-platform-components": "error",
    },
  },
  {
    // Root-level Node tooling config, not app source — @react-native/
    // eslint-config's flat export applies its Flow-file-detection
    // override to every *.js file, and eslint-plugin-ft-flow crashes
    // on ESLint 9.39.5's Rule API when it runs against these.
    ignores: [
      "dist/*",
      "android/*",
      "ios/*",
      "iot-dashboard-task/*",
      "babel.config.js",
      "metro.config.js",
      "jest.config.js",
      "eslint.config.js",
      "scripts/**",
    ],
  },
];
