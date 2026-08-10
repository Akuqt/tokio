import { RouterProvider } from "@tanstack/react-router";
import { ProfileProvider, ServicesProvider, ThemeProvider } from "./context";
import { router } from "./router";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ServicesProvider>
      <ProfileProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </ProfileProvider>
    </ServicesProvider>
  );
}
