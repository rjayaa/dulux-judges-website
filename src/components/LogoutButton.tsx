"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      
      // Call logout endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      
      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`px-4 py-2 rounded-md text-sm transition duration-200 ${
        isLoggingOut
          ? "bg-gray-400 text-gray-700 cursor-not-allowed"
          : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40"
      }`}
    >
      {isLoggingOut ? "Logging out..." : "Logout"}
    </button>
  );
}