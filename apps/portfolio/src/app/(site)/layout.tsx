import Link from "next/link";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-slate-100 font-semibold text-lg tracking-tight hover:text-white transition-colors"
          >
            Tony DeGregorio
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/tools"
              className="text-slate-400 hover:text-slate-100 text-sm transition-colors"
            >
              Tools
            </Link>
            <Link
              href="/how-its-built"
              className="text-slate-400 hover:text-slate-100 text-sm transition-colors"
            >
              How It&apos;s Built
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <span>© 2026 Tony DeGregorio</span>
          <div className="flex gap-4">
            <a
              href="https://github.com/tdforce85"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/tonydegregorio"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
