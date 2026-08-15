import { RouterProvider } from "@tanstack/react-router";
import { AudioProvider, ThemeProvider } from "./context";
import { router } from "./router";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <AudioProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AudioProvider>
  );
}
