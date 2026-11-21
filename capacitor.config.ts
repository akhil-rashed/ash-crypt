import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.akhilrashed.ashcrypt',
  appName: 'AshCrypt',
  webDir: 'dist',
  // Android WebView must run on a secure origin so Web Crypto,
  // clipboard access, and service workers keep working.
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
