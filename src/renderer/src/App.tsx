import { RouterProvider } from "@tanstack/react-router";
import { AppProvider, AudioProvider } from "./context";
import { router } from "./router";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <AudioProvider>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </AudioProvider>
  );
}
