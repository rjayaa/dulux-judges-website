"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  // Automatically redirect to login page
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Design Competition Judging Portal
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Welcome to the official judging system
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="relative w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Redirecting to login page...
        </p>

        <div className="animate-pulse flex justify-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
          <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
          <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
        </div>

        <div className="mt-12">
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}