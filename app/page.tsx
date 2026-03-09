export default function LandingPage() {
  return (
    <div className="container-shell py-12 sm:py-16 lg:py-20">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] items-start">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-100">
            Trusted document & data verification
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-50">
            DDM Verify admin portal & information hub
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-xl">
            DDM Verify, by Qwanum Technologies, provides secure verification workflows for your teams and partners.
            This site hosts the admin console and key information such as policies, security notes, and product updates.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/admin"
              className="inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-400 transition-colors"
            >
              Go to admin console
            </a>
            <a
              href="/policies"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-900/60 transition-colors"
            >
              View policies
            </a>
          </div>
          <dl className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-300">
            <div>
              <dt className="text-slate-400">Company</dt>
              <dd className="font-medium text-slate-100">Qwanum Technologies</dd>
            </div>
            <div>
              <dt className="text-slate-400">Product</dt>
              <dd className="font-medium text-slate-100">DDM Verify</dd>
            </div>
            <div>
              <dt className="text-slate-400">Website</dt>
              <dd className="font-medium text-slate-100">ddmverify.com</dd>
            </div>
          </dl>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-brand-500/20 blur-3xl opacity-70" />
          <div className="relative rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-xl shadow-brand-900/40">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-300">Admin entry point</p>
                <p className="text-sm text-slate-400">admin.ddmverify.com</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                SECURE ACCESS
              </span>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                <div>
                  <p className="font-medium text-slate-100">Role-based controls</p>
                  <p className="text-[11px] text-slate-400">
                    Fine-grained permissions for operations, compliance and support teams.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                <div>
                  <p className="font-medium text-slate-100">Audit-ready activity logs</p>
                  <p className="text-[11px] text-slate-400">
                    Trace all admin actions across DDM Verify in a single place.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                <div>
                  <p className="font-medium text-slate-100">Policy-aware configuration</p>
                  <p className="text-[11px] text-slate-400">
                    Settings aligned with your internal policies and regional regulations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

