// iOS 27 stops an app at launch unless it adopts the UIScene life cycle.
// Expo 57 ships `ExpoAppSceneDelegate` for this, but the generated AppDelegate
// still creates the window itself. This plugin:
//   1. declares a scene manifest in Info.plist pointing at Expo's scene delegate, and
//   2. makes AppDelegate an `ExpoReactNativeFactoryProvider` and leaves window
//      creation to the scene delegate.
// Works on earlier iOS versions too.
const { withAppDelegate, withInfoPlist } = require("expo/config-plugins");

module.exports = function withSceneLifecycle(config) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          { UISceneConfigurationName: "Default Configuration", UISceneDelegateClassName: "EXExpoAppSceneDelegate" },
        ],
      },
    };
    return cfg;
  });

  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== "swift") return cfg;
    let src = cfg.modResults.contents;
    src = src.replace(/class AppDelegate: ExpoAppDelegate \{/, "class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {");
    // The scene delegate creates the window and starts React Native into it.
    src = src.replace(/\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/, "\n");
    cfg.modResults.contents = src;
    return cfg;
  });
};
