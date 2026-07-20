import Link from "next/link";

export const metadata = {
  title: "Not found — SilicaUI",
};

// Required by `output: "export"` for a real 404.html. Plain JSX rather than
// the blocks pipeline — this is error-page chrome, not marketing content, and
// there's no navbar/footer chrome in the root layout to match against.
export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-base-100 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-base-content">Page not found</h1>
      <p className="max-w-md text-base-content">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <Link href="/" className="btn btn-primary mt-2">
        Back home
      </Link>
    </div>
  );
}
