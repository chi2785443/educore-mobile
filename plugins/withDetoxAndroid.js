const {
  withSettingsGradle,
  withAppBuildGradle,
  withGradleProperties,
  withProjectBuildGradle,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Wires Detox's native Android test module into the (gitignored, prebuild-generated)
// android/ project so `expo prebuild` doesn't silently drop E2E support.
function withDetoxAndroid(config) {
  config = withSettingsGradle(config, (config) => {
    if (!config.modResults.contents.includes("include ':detox'")) {
      config.modResults.contents += `
include ':detox'
project(':detox').projectDir = new File(rootProject.projectDir, '../node_modules/detox/android/detox')
`;
    }
    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes('testInstrumentationRunner')) {
      contents = contents.replace(
        /versionName "1\.0\.0"/,
        `versionName "1.0.0"\n\n        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"\n        missingDimensionStrategy 'detox', 'full'`
      );
    }

    if (!contents.includes("project(':detox')")) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    androidTestImplementation project(':detox')\n    androidTestImplementation 'androidx.test:runner:1.6.2'\n    androidTestImplementation 'androidx.test:rules:1.6.1'`
      );
    }

    config.modResults.contents = contents;
    return config;
  });

  config = withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('mergeDebugAndroidTestNativeLibs')) {
      config.modResults.contents += `
// Detox's androidTest APK causes library modules like react-native-gesture-handler
// to package their own copy of libfbjni.so alongside the one pulled transitively
// from react-android, which fails mergeDebugAndroidTestNativeLibs. Applying
// pickFirst to every subproject (not just :app) resolves it at the source.
subprojects { subproject ->
  subproject.pluginManager.withPlugin('com.android.library') {
    subproject.android.packagingOptions {
      jniLibs {
        pickFirsts += ['**/libfbjni.so', '**/libc++_shared.so']
      }
    }
  }
}
`;
    }
    return config;
  });

  // Detox's androidTest APK pulls in react-android's fbjni.so alongside the one
  // already bundled transitively by react-native-gesture-handler; without picking
  // one, mergeDebugAndroidTestNativeLibs fails on the duplicate.
  config = withGradleProperties(config, (config) => {
    const key = 'android.packagingOptions.pickFirsts';
    const value = '**/libfbjni.so,**/libc++_shared.so';
    const existing = config.modResults.find((item) => item.type === 'property' && item.key === key);
    if (existing) {
      existing.value = value;
    } else {
      config.modResults.push({ type: 'property', key, value });
    }
    return config;
  });

  // `detox init` normally scaffolds this instrumentation entry point; since we wired
  // Detox in manually, it has to be persisted through this plugin so `expo prebuild`
  // doesn't drop it (android/ is gitignored and regenerated from scratch).
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const destDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/androidTest/java/com/cakale/edu/app'
      );
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(
        path.join(__dirname, 'DetoxTest.java.template'),
        path.join(destDir, 'DetoxTest.java')
      );
      return config;
    },
  ]);

  return config;
}

module.exports = withDetoxAndroid;
