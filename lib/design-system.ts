/**
 * EduBridge Design System
 *
 * A comprehensive design system for the e-learning platform
 * combining warm, inclusive colors with accessible typography
 */

// Color Palette
export const colors = {
  primary: {
    50: "oklch(0.95 0.02 200)",
    100: "oklch(0.88 0.08 200)",
    500: "oklch(0.55 0.15 200)", // Primary teal (calming, accessible)
    900: "oklch(0.25 0.1 200)",
  },
  secondary: {
    50: "oklch(0.95 0.02 145)",
    100: "oklch(0.88 0.08 145)",
    500: "oklch(0.72 0.12 145)", // Soft green (growth, learning)
    900: "oklch(0.35 0.1 145)",
  },
  accent: {
    50: "oklch(0.95 0.02 65)",
    100: "oklch(0.88 0.08 65)",
    500: "oklch(0.71 0.15 65)", // Warm orange (encouragement, warmth)
    900: "oklch(0.4 0.12 65)",
  },
  neutral: {
    50: "oklch(0.98 0.005 265)",
    100: "oklch(0.95 0.01 265)",
    200: "oklch(0.93 0.01 250)",
    500: "oklch(0.5 0.02 250)",
    900: "oklch(0.2 0.01 250)",
  },
}

// Typography Scale
export const typography = {
  display: {
    fontSize: "3rem", // 48px
    lineHeight: "1.2",
    fontWeight: "700",
  },
  heading1: {
    fontSize: "2.25rem", // 36px
    lineHeight: "1.3",
    fontWeight: "700",
  },
  heading2: {
    fontSize: "1.875rem", // 30px
    lineHeight: "1.4",
    fontWeight: "600",
  },
  heading3: {
    fontSize: "1.5rem", // 24px
    lineHeight: "1.4",
    fontWeight: "600",
  },
  body: {
    fontSize: "1rem", // 16px
    lineHeight: "1.6",
    fontWeight: "400",
  },
  bodySmall: {
    fontSize: "0.875rem", // 14px
    lineHeight: "1.5",
    fontWeight: "400",
  },
  caption: {
    fontSize: "0.75rem", // 12px
    lineHeight: "1.4",
    fontWeight: "500",
  },
}

// Spacing Scale
export const spacing = {
  xs: "0.5rem",
  sm: "1rem",
  md: "1.5rem",
  lg: "2rem",
  xl: "3rem",
  "2xl": "4rem",
}

// Border Radius
export const borderRadius = {
  sm: "0.375rem",
  md: "0.75rem",
  lg: "1.125rem",
  full: "9999px",
}

// Shadow System
export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
}

// Component Patterns
export const components = {
  button: {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    accent: "bg-accent text-accent-foreground hover:bg-accent/90",
    outline: "border border-primary text-primary hover:bg-primary/10",
  },
  card: {
    base: "bg-card text-card-foreground border border-border rounded-lg shadow-sm",
    hover: "hover:shadow-md transition-shadow duration-200",
  },
  input: {
    base: "bg-input border border-border rounded-md focus:ring-2 focus:ring-primary",
  },
}
