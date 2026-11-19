module.exports = {
  preset: "@react-native/jest-preset",
  setupFiles: ["<rootDir>/jest.setup.js"],
  // sensor-core is linked from outside this folder; its compiled code still
  // needs this app's @babel/runtime.
  modulePaths: ["<rootDir>/node_modules"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-safe-area-context|@shopify/flash-list)/)",
  ],
};
