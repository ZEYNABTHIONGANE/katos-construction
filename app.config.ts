export default {
  expo: {
    name: "katos-connect",
    slug: "katos-connect",

    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    icon: "./src/assets/logo.png",
    plugins: [
      "expo-font"
    ],
    splash: {
      image: "./src/assets/logo.png",
      resizeMode: "cover",
      backgroundColor: "#2B2E83",
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.katos.app",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSMicrophoneUsageDescription:
          "L'application a besoin d'accéder au micro pour enregistrer des notes vocales.",
        NSCameraUsageDescription:
          "L'application utilise la caméra pour prendre des photos et vidéos des projets de construction.",
        NSPhotoLibraryUsageDescription:
          "L'application accède à votre photothèque pour charger des images.",
      },
      associatedDomains: ["applinks:katos-app.vercel.app"],
    },

    android: {
      package: "com.katos.app",
      googleServicesFile: "./google-services.json",
      versioncode: 12,
      adaptiveIcon: {
        foregroundImage: "./src/assets/logo.png",
        backgroundColor: "#ffffff",
      },
      softwareKeyboardLayoutMode: "resize",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.RECORD_AUDIO",
      ],
    },

    web: {
      favicon: "./src/assets/logo.png",
    },

    updates: {
      "url": "https://u.expo.dev/079a76f8-c4fe-420b-8c2d-b08fcfd5d63c",
    },

    runtimeVersion: "1.0.0",


    scheme: "katos",

    extra: {
      eas: {
        "projectId": "079a76f8-c4fe-420b-8c2d-b08fcfd5d63c",
      },
    },
  },
};
