import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "pk.iqra.school.recorder",
  appName: "Iqra School Recorder",
  webDir: "out",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
  },
};

export default config;
