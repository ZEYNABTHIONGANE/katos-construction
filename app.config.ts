import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "katos-app",
  slug: "katos-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  plugins: ["expo-font", "expo-video"],
  scheme: "katos",

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.scylka.katos",
    associatedDomains: ["applinks:katos-app.vercel.app"],
  },

  android: {
    package: "com.scylka.katos",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "katos-app.vercel.app",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  web: {
    favicon: "./assets/favicon.png",
  },

  updates: {
    url: "https://u.expo.dev/fbf54315-f2a4-45af-bcd8-150b8f087040",
  },

  runtimeVersion: {
    policy: "appVersion", // ✅ nécessaire pour eas update
  },

  extra: {
    eas: {
      projectId: "fbf54315-f2a4-45af-bcd8-150b8f087040",
    },
  },
});
