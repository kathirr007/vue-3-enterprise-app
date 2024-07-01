import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mudrantar.brightreturn',
  appName: 'BrightReturn',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  bundledWebRuntime: false,
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    CapacitorCookies: {
      enabled: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
