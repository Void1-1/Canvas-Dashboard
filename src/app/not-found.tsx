import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="glass p-8 rounded-2xl shadow-lg flex flex-col items-center">
        <h1 className="text-5xl font-bold text-taupe mb-4">
          404
        </h1>
        <h2 className="text-xl md:text-2xl font-semibold text-accent mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8 text-center max-w-sm">
          Sorry, the page you are looking for does not exist or has been moved.
          <br />
          <Link href="/" className="text-accent hover:underline inline-block mt-4">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
};