export default function PoliciesPage() {
  return (
    <div className="container-shell py-10 sm:py-14 lg:py-16">
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
          Policies & Security Overview
        </h1>
        <p className="text-sm sm:text-base text-slate-300">
          This page provides a high-level overview of how DDM Verify, by Qwanum Technologies, approaches privacy,
          security, and responsible data handling. Link your full legal documents here once they are finalised.
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-50">Privacy</h2>
          <p className="text-sm text-slate-300">
            DDM Verify only processes the data required to deliver verification services. Access to sensitive data is
            restricted to authorised personnel and governed by strict internal controls.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-50">Security</h2>
          <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1.5">
            <li>Encrypted transport for all client and admin traffic.</li>
            <li>Role-based access control for admin users on admin.ddmverify.com.</li>
            <li>Audit logging of sensitive operations in the admin console.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-50">Acceptable use</h2>
          <p className="text-sm text-slate-300">
            The service may only be used for legitimate verification workflows approved by Qwanum Technologies and your
            organisation&apos;s internal governance.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-50">Contact</h2>
          <p className="text-sm text-slate-300">
            For formal policy documents, DPA agreements, or security reviews, please contact your Qwanum Technologies
            representative or the support channel listed on{" "}
            <a
              href="https://ddmverify.com"
              className="text-brand-300 hover:text-brand-200 underline-offset-2 hover:underline"
            >
              ddmverify.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

