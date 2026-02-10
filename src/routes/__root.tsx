import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <div className="relative flex min-h-screen flex-col">
        <header className="p-2">
          <nav className="container m-auto">
            <h1>My Application Header</h1>
          </nav>
        </header>

        <main className="grow p-2">
          <div className="container m-auto">
            <Outlet />
          </div>
        </main>

        <footer className="p-2">
          <nav className="container m-auto">
            <h1>My Application Footer</h1>
          </nav>
        </footer>
      </div>
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
