"use client";

import Link from "next/link";
import { memo } from "react";

const ClassNotFound = memo(function ClassNotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="glass p-8 rounded-2xl shadow-lg flex flex-col items-center">
        <h1 className="text-5xl font-bold text-taupe mb-2">
          404
        </h1>
        <h2 className="text-xl md:text-2xl font-semibold text-accent mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8 text-center max-w-xs">
          This page does not exist for this course.
        </p>
        <div>
          <Link
            href="/classes"
            className="inline-block px-6 py-2 rounded-lg bg-accent text-white font-medium shadow hover:bg-accent/90 transition-colors"
          >
            ← Back to Classes
          </Link>
        </div>
      </div>
    </div>
  );
});

ClassNotFound.displayName = 'ClassNotFound';

export default ClassNotFound;

