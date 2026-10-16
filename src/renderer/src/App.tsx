import { RouterProvider } from "@tanstack/react-router";
import { AppProvider, AudioProvider, UnsavedProvider } from "./context";
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
        <UnsavedProvider>
          <RouterProvider router={router} />
        </UnsavedProvider>
      </AppProvider>
    </AudioProvider>
  );
}
