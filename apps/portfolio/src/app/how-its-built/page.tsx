import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How This Site Is Built | Tony DeGregorio",
};

export default function HowItsBuilt() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-3">How This Site Is Built</h1>
      <p className="text-slate-400 text-lg leading-relaxed mb-16">
        This isn&apos;t a Squarespace site. Everything you see here is
        purpose-built — the portfolio site, the live Salesforce demos, and the
        questionable decision to use 14 platform features for a contact form.
      </p>

      <div className="space-y-14">
        <section>
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">
            The Portfolio Site (tonydegregorio.com)
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Next.js with App Router, TypeScript, and Tailwind CSS. Deployed to
            Cloudflare Pages. Source code is public on GitHub because if
            you&apos;re going to claim you can architect things, people should
            be able to check your work.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">
            The Experience Cloud Site
          </h2>
          <p className="text-slate-400 leading-relaxed">
            The Salesforce demos run on a live Experience Cloud LWR site in a
            Developer Edition org. Custom LWC components, Apex controllers,
            Platform Events, Queueable Apex — no templates, no drag-and-drop.
            The site itself is the demo.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">
            The Over-Engineered Lead Form
          </h2>
          <p className="text-slate-400 leading-relaxed">
            A real contact form that actually captures leads. It just happens to
            route your name and email through a Platform Event, a trigger, a
            Queueable, and an approval process on the way to the database.
            There&apos;s also a button that deploys a drone army. It
            doesn&apos;t work. Code coverage was 74%.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">
            What&apos;s Next
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Agentforce agents, a Salesforce architecture configurator, a Magic
            8-Ball that answers your Salesforce complaints, and a trigger
            framework playground. More coming — this site is a living project.
          </p>
        </section>

        <section className="border-t border-slate-800 pt-14">
          <h2 className="text-2xl font-semibold text-slate-100 mb-6">
            Links
          </h2>
          <div className="flex flex-col gap-3">
            <a
              href="https://github.com/tdforce85"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 text-slate-400 hover:text-blue-400 transition-colors"
            >
              <span className="text-slate-600 group-hover:text-blue-500 transition-colors">→</span>
              <span>GitHub — tdforce85</span>
            </a>
            <a
              href="https://bluemotionconsultingllc-dev-ed.develop.my.site.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 text-slate-400 hover:text-blue-400 transition-colors"
            >
              <span className="text-slate-600 group-hover:text-blue-500 transition-colors">→</span>
              <span>The Over-Engineered Lead Form — Experience Cloud site</span>
            </a>
            <a
              href="https://linkedin.com/in/tonydegregorio"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 text-slate-400 hover:text-blue-400 transition-colors"
            >
              <span className="text-slate-600 group-hover:text-blue-500 transition-colors">→</span>
              <span>LinkedIn — Tony DeGregorio</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
