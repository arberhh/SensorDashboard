const path = require("path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// Anchored to this folder so packages with their own server/ dir
// (react-dom/server) still resolve.
const serverDir = path.join(__dirname, "server").replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // server/ is the Rust backend; its target/ holds thousands of build
    // artifacts Metro would otherwise crawl.
    blockList: [defaultConfig.resolver.blockList, new RegExp(`^${serverDir}\\/.*`)],
  },
};

module.exports = mergeConfig(defaultConfig, config);
