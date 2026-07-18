import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.saionproduction.saionai',
  appName: 'SAION AI',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Black background while WebView loads — prevents white flash
    backgroundColor: '#000000',
  },
  server: {
    androidScheme: 'https',
    cleartext: true,
    // IMPORTANT: Remove custom hostname — it causes blank screen
    // when the hostname doesn't match the served content
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#000000',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#7C3AED',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
