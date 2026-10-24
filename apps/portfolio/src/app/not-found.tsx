import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-900 text-slate-100 px-4">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-slate-400">That page doesn&apos;t exist.</p>
      <Link href="/" className="text-sky-400 hover:text-sky-300 underline">
        Back to home
      </Link>
    </div>
  );
}
