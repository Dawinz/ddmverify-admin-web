export default function AdminHomePage() {
  return (
    <div className="container-shell py-10 sm:py-14 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] items-start">
        <div className="space-y-5">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
            Admin Console – DDM Verify
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl">
            This is the entry point for administrators of DDM Verify at{" "}
            <span className="font-medium text-slate-100">Qwanum Technologies</span> and your customer
            organisations. From here you will later manage verification workflows, teams, and system
            configuration.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Access model
              </p>
              <p className="text-sm font-medium text-slate-100">Role-based administration</p>
              <p className="text-xs text-slate-400">
                Define roles such as Operations, Compliance, and Support. Limit each role to just the
                permissions it needs.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Observability
              </p>
              <p className="text-sm font-medium text-slate-100">Unified activity log</p>
              <p className="text-xs text-slate-400">
                A central feed of admin actions, approvals, and configuration changes for audit purposes.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-500/40 bg-brand-500/10 p-4 space-y-3">
            <p className="text-xs font-semibold text-brand-100 uppercase tracking-wide">
              Next step
            </p>
            <p className="text-sm text-brand-50">
              Hook this admin UI to your backend (e.g. via Railway or another API) for authentication,
              user management, and real-time data. For now this page is a secure landing surface and
              placeholder.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Quick links
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center justify-between">
                <span>Admin URL</span>
                <code className="rounded-md bg-slate-900 px-2 py-1 text-[11px] text-slate-200">
                  admin.ddmverify.com
                </code>
              </li>
              <li className="flex items-center justify-between">
                <span>Main site</span>
                <code className="rounded-md bg-slate-900 px-2 py-1 text-[11px] text-slate-200">
                  ddmverify.com
                </code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

