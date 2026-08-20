import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          shade: "hsl(var(--primary-shade))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          shade: "hsl(var(--secondary-shade))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          shade: "hsl(var(--destructive-shade))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Warm-tinted (not default grayscale-black) elevation scale, used
      // sparingly for things that genuinely float above content — dropdown
      // panels, popovers — not general card styling, which stays flat by
      // design (see the Duolingo-style pass earlier this project).
      boxShadow: {
        soft: "0 2px 8px -2px hsl(var(--foreground) / 0.08)",
        elevated: "0 12px 32px -8px hsl(var(--foreground) / 0.22), 0 4px 12px -4px hsl(var(--foreground) / 0.12)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
