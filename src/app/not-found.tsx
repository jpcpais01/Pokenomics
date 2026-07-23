import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <span className="text-5xl">📉</span>
      <h1 className="text-lg font-semibold text-text-primary">Index not found</h1>
      <p className="text-sm text-text-secondary">That ticker isn&rsquo;t tracked.</p>
      <Link href="/" className="mt-2 rounded-full bg-text-primary px-4 py-2 text-sm font-semibold text-page">
        Back to Markets
      </Link>
    </div>
  );
}
