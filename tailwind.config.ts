import type { Config } from "tailwindcss";

/**
 * Reference-tenant theme ("Meridian Institute") for the genericization demo -
 * a deliberately non-Techademy identity: deep navy + gold accent + a serif
 * display face on warm paper (Techademy is orange + Roboto sans). The section
 * components bind to these semantic tokens; swapping this config re-skins the
 * whole storefront with no component change.
 *
 * NOTE: `display` is a serif STACK (not a next/font webfont) so the build needs
 * no font fetch; a self-hosted webfont can be slotted in later.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#0B1F3A", foreground: "#F5F0E6" },
        accent: { DEFAULT: "#C8A04B", foreground: "#0B1F3A" },
        ink: "#1A1A1A",
        paper: "#FBF8F2",
        muted: { DEFAULT: "#EFE9DD", foreground: "#6B6456" },
        border: "#E2DAC9",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "Cambria", "serif"],
        sans: ["ui-sans-serif", "system-ui", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
