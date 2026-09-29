import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rapidito.app',
  appName: 'RAPIDITO',
  webDir: 'www',
  server: {
    url: 'https://rapidito-virid.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
