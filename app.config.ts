// app.config.ts
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "katos-app",
  slug: "katos-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  plugins: [
    "expo-font"
  ],

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.scylka.katos", // <-- essentiel pour EAS iOS
  },

  android: {
    package: "com.scylka.katos", // <-- équivalent Android
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },

  web: {
    favicon: "./assets/favicon.png",
  },

  extra: {
    eas: {
      projectId: "fbf54315-f2a4-45af-bcd8-150b8f087040",
    },
  },
});
