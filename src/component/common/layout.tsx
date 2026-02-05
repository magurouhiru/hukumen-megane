import { Trans } from "@lingui/react/macro";

// レイアウトは基本__root.tsxに書くべきだが、
// 音ゲーするときはフルスクリーンでやりたいので、コンポーネント化する
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="p-2">
        <nav className="container m-auto">
          <h1>
            <Trans>My Application Header</Trans>
          </h1>
        </nav>
      </header>

      <main className="grow p-2">
        <div className="container m-auto">{children}</div>
      </main>

      <footer className="p-2">
        <nav className="container m-auto">
          <h1>
            <Trans>My Application Footer</Trans>
          </h1>
        </nav>
      </footer>
    </div>
  );
}

export default Layout;
