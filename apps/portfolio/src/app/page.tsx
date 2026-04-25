import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <section className="mb-24">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-100 mb-4">
          Tony DeGregorio
        </h1>
        <p className="text-2xl text-blue-400 font-medium mb-6">
          Salesforce Architect
        </p>
        <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
          Architecting Salesforce platforms that scale.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-slate-100 mb-6">
          Featured Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/tools/agentforce-calculator"
            className="group block bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500 hover:bg-slate-800/80 transition-all"
          >
            <div className="text-blue-400 text-sm font-medium mb-2 uppercase tracking-wide">
              Agentforce
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-white transition-colors">
              Flex Credit Calculator
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Estimate annual Agentforce flex credit costs by dataset size,
              interaction frequency, and action mix.
            </p>
          </Link>

          <a
            href="https://bluemotionconsultingllc-dev-ed.develop.my.site.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500 hover:bg-slate-800/80 transition-all"
          >
            <div className="text-blue-400 text-sm font-medium mb-2 uppercase tracking-wide">
              Experience Cloud
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-white transition-colors">
              The Over-Engineered Lead Form
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              A contact form that uses 14 platform features to save 2 fields.
              Built on Experience Cloud LWR with custom LWC, Platform Events,
              Queueable Apex, and a runaway submit button.
            </p>
            <div className="mt-4 inline-block text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
              Try It Live →
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
