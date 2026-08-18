import { z } from "zod";

const Color = z.string().min(7).max(9);

const Base = z.object({
  color: Color,
  hover: Color,
});

const Theme = z.object({
  backgroundColor: z.object({
    primary: Base,
    secondary: Base,
  }),
  fontColor: z.object({
    primary: Color,
    secondary: Color,
  }),
  accentColor: z.object({
    primary: Base,
    secondary: Base,
  }),
});

// TODO: Finish Theme schema
export const ThemeSchema = z.object({
  name: z.string().min(3),
  dark: Theme,
  light: Theme,
});

export type Theme = z.infer<typeof ThemeSchema>;
