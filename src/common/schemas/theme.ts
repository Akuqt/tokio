import { z } from "zod";

const Color = z.string().min(7).max(9);

const Theme = z.object({
  backgroundColor: z.object({
    primary: Color,
    secundary: Color,
  }),
  fontColor: z.object({
    primary: Color,
    secundary: Color,
  }),
  logo: z.object({
    primary: Color,
    secondary: Color,
  }),
  navBar: z.object({
    controls: z.object({
      minimize: z.object({
        color: Color,
        hover: Color,
      }),
      maximize: z.object({
        color: Color,
        hover: Color,
      }),
      close: z.object({
        color: Color,
        hover: Color,
      }),
    }),
    profile: z.object({
      hover: Color,
      selected: z.object({
        tick: Color,
        background: Color,
      }),
    }),
  }),
  sideBar: z.object({
    items: z.object({
      color: Color,
      hover: Color,
      selected: Color,
    }),
  }),
});

// TODO: Finish Theme schema
export const ThemeSchema = z.object({
  dark: Theme,
  light: Theme,
});

export type Theme = z.infer<typeof ThemeSchema>;
