// The generated "Bundle React Native code and images" build phase runs React
// Native's bundling script through an unquoted command substitution, so a
// project path with a space (this repo lives in "Chat APP") splits and the
// build fails. Quote it every time the native project is generated.
const { withXcodeProject } = require("expo/config-plugins");

const UNQUOTED = "`\\\"$NODE_BINARY\\\" --print \\\"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\\\"`";
const QUOTED = "\\\"$(\\\"$NODE_BINARY\\\" --print \\\"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\\\")\\\"";

module.exports = function withQuotedBundleScript(config) {
  return withXcodeProject(config, (cfg) => {
    const phases = cfg.modResults.hash.project.objects.PBXShellScriptBuildPhase ?? {};
    for (const phase of Object.values(phases)) {
      if (typeof phase !== "object" || !phase.shellScript) continue;
      if (phase.shellScript.includes(UNQUOTED)) phase.shellScript = phase.shellScript.replace(UNQUOTED, QUOTED);
    }
    return cfg;
  });
};
