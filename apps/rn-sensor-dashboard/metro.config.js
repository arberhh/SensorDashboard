const path = require("path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // sensor-core is linked from outside this folder, so Metro has to watch it
  // and resolve its @babel/runtime from here.
  watchFolders: [path.resolve(__dirname, "../../packages/sensor-core")],
  resolver: { nodeModulesPaths: [path.resolve(__dirname, "node_modules")] },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
