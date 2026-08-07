import { z } from "zod";

const Color = z.string().min(7).max(9);

const Theme = z.object({
  backgroundColor: Color,
  FontColor: Color,
});

// TODO: Finish Theme schema
export const ThemeSchema = z.object({
  name: z.string().min(3),
  dark: Theme,
  light: Theme,
});

export type Theme = z.infer<typeof ThemeSchema>;
