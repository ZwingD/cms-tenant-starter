import type { Config } from "tailwindcss";

/**
 * Reference-tenant theme ("Northwind Academy") for the navigation north-star demo
 * - a deliberately non-Techademy identity: deep evergreen + warm amber accent + a
 * serif display face on warm cream (Techademy is orange + Roboto sans). The section
 * + nav mega-menu components bind to these semantic tokens; swapping this config
 * re-skins the whole storefront with no component change (the zero-engineering
 * onboarding thesis).
 *
 * NOTE: `display` is a serif STACK (not a next/font webfont) so the build needs
 * no font fetch; a self-hosted webfont can be slotted in later.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#12352A", foreground: "#F3EEE3" },
        accent: { DEFAULT: "#C68A2E", foreground: "#12352A" },
        ink: "#1B211E",
        paper: "#F7F4EC",
        muted: { DEFAULT: "#E9E3D6", foreground: "#5C6660" },
        border: "#DBD3C2",
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
