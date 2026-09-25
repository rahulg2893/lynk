// The phone app shares the web app's pure logic (chat data, plans, lists,
// search, plan spotting) straight from apps/web/src/lib, so there is one
// source of truth. Metro has to watch that folder to bundle it.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const shared = path.resolve(__dirname, "../web/src/lib");

config.watchFolders = [...(config.watchFolders ?? []), shared];
config.resolver.extraNodeModules = { ...(config.resolver.extraNodeModules ?? {}), "@shared": shared };

module.exports = config;
