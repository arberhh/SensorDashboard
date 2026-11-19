const path = require("path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// Anchored to this folder so packages with their own server/ dir
// (react-dom/server) still resolve.
function ownDir(name) {
  return new RegExp(`^${path.join(__dirname, name).replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}\\/.*`);
}

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // server/ is the Rust backend and apps/ holds the other app builds; both
    // have thousands of build artifacts Metro would otherwise crawl.
    blockList: [defaultConfig.resolver.blockList, ownDir("server"), ownDir("apps")],
  },
};

module.exports = mergeConfig(defaultConfig, config);
