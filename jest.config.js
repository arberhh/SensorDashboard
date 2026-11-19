module.exports = {
  preset: "@react-native/jest-preset",
  setupFiles: ["<rootDir>/jest.setup.js"],
  // Other apps in apps/ have their own tests and toolchains.
  modulePathIgnorePatterns: ["<rootDir>/apps/"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-safe-area-context|@shopify/flash-list)/)",
  ],
};
