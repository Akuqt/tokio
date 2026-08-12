import { RouterProvider } from "@tanstack/react-router";
import {
  AudioProvider,
  ProfileProvider,
  ServiceProvider,
  ThemeProvider,
} from "./context";
import { router } from "./router";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <AudioProvider>
      <ServiceProvider>
        <ProfileProvider>
          <ThemeProvider>
            <RouterProvider router={router} />
          </ThemeProvider>
        </ProfileProvider>
      </ServiceProvider>
    </AudioProvider>
  );
}
