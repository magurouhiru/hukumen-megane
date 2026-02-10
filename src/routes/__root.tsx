import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import icon from "@/assets/icon.svg";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <div className="relative flex min-h-screen flex-col">
        <header className="border-b p-2">
          <nav className="container m-auto flex items-center justify-center">
            <Link to="/">
              <h1>
                <img src={icon} alt="Homepage_Image" className="h-10 w-10" />
              </h1>
            </Link>
          </nav>
        </header>

        <main className="grow p-2">
          <div className="container m-auto">
            <Outlet />
          </div>
        </main>

        <footer className="bg-gray-800 p-2 text-white">
          <div className="container m-auto flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <h3 className="font-semibold">Contents</h3>
                <ul>
                  <li>
                    <Link to="/otoge">otoge</Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Community</h3>
                <ul>
                  <li>
                    <a
                      href="https://github.com/magurouhiru/hukumen-megane"
                      target="_blank"
                      rel="noopener"
                    >
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap justify-between gap-4">
              <Link to="/privacy_policy">privacy policy</Link>
              <span>コピーライト</span>
            </div>
          </div>
        </footer>
      </div>
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
