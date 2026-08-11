import { createHash } from "crypto";

let chchedFingerprint: string | null = null;

const getWebGLInfo = (): Record<string, any> => {
  try {
    const canvas = document.createElement("canvas");

    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext);

    if (!gl) return { webgl: "unsupported" };

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

    return {
      vendor: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : "unknown",

      renderer: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : "unknown",
    };
  } catch (e) {
    return { webgl: "error", error: String(e) };
  }
};

const hashString = async (data: string): Promise<string> => {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    // Browser environment

    const msgBuffer = new TextEncoder().encode(data);

    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);

    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } else {
    // Node.js environment

    return createHash("sha256").update(data).digest("hex");
  }
};

const hashComponents = async (components: Record<string, unknown>): Promise<string> => {
  const componentString = JSON.stringify(components, Object.keys(components).sort());

  return await hashString(componentString);
};

const generateDeviceFingerprint = async (): Promise<string> => {
  if (chchedFingerprint) return chchedFingerprint;
  const components: Record<string, any> = {};

  // Screen properties
  components.screen = {
    width: window.screen.width,

    height: window.screen.height,

    colorDepth: window.screen.colorDepth,

    pixelDepth: window.screen.pixelDepth,
  };

  // Timezone
  components.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Navigator properties
  components.navigator = {
    language: navigator.language || navigator.languages[0],

    hardwareConcurrency: navigator.hardwareConcurrency || "unknown",

    deviceMemory: (navigator as any).deviceMemory || "unknown",

    platform: navigator.platform,
  };

  // WebGL fingerprint
  components.webgl = getWebGLInfo();

  // Generate fingerprint by hashing components
  const fingerprint = await hashComponents(components);

  // Storing the fingerprint for later use.
  chchedFingerprint = fingerprint;

  return fingerprint;
};

export default generateDeviceFingerprint;