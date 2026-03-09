import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DDM Verify – Admin & Portal",
  description: "Admin console and information site for DDM Verify by Qwanum Technologies."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="page-shell">
        <header className="border-b border-slate-800/80 backdrop-blur">
          <div className="container-shell flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-brand-500/20 border border-brand-400/40 flex items-center justify-center text-xs font-semibold tracking-tight text-brand-100">
                DDM
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-50">DDM Verify</p>
                <p className="text-xs text-slate-400">by Qwanum Technologies</p>
              </div>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/" className="text-slate-300 hover:text-white transition-colors">
                Overview
              </a>
              <a href="/policies" className="text-slate-300 hover:text-white transition-colors">
                Policies
              </a>
              <a href="/admin" className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-brand-400 transition-colors">
                Admin Console
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 mt-10">
          <div className="container-shell py-6 text-xs text-slate-500 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Qwanum Technologies. All rights reserved.</p>
            <p>
              Visit{" "}
              <a href="https://ddmverify.com" className="text-brand-300 hover:text-brand-200 underline-offset-2 hover:underline">
                ddmverify.com
              </a>
              .
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

