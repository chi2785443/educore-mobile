const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Allow Metro to bundle SVG files as static assets (used by expo-image)
config.resolver.assetExts.push("svg");

module.exports = withNativeWind(config, { input: "./global.css" });
