// src/components/admin/AdminLayout.tsx
"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { 
  Settings, 
  User, 
  Users, 
  LogOut, 
  Home,
  Trophy,
  FileText,
  BarChart2
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if admin is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const data = await response.json();
        
        if (data.success && data.authenticated && data.judge?.id === "00832") {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push('/login?redirectTo=' + encodeURIComponent(pathname || '/admin/top-five'));
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router, pathname]);
  
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  // Navigation items
  const navigationItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: Home,
      current: pathname === "/admin/dashboard"
    },
    {
      name: "Submissions",
      href: "/admin/submissions",
      icon: FileText,
      current: pathname === "/admin/submissions"
    },
    {
      name: "Top 5 Selections",
      href: "/admin/top-five",
      icon: Trophy,
      current: pathname === "/admin/top-five"
    },
    {
      name: "Judges",
      href: "/admin/judges",
      icon: Users,
      current: pathname === "/admin/judges"
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart2,
      current: pathname === "/admin/analytics"
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      current: pathname === "/admin/settings"
    }
  ];
  
  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="h-16 bg-white shadow-sm animate-pulse"></div>
        <div className="flex-1 p-6">
          <div className="h-full bg-white rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }
  
  // If not authenticated, show minimal layout
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="p-3 bg-red-100 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <User className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            You need to be logged in as an admin to access this page.
          </p>
          <Link
            href="/login"
            className="w-full py-2 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors inline-block"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }
  
  // Main admin layout
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top navigation bar */}
      <header className="bg-white shadow-sm z-40 border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Image
                  src="/favicon.ico"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto mr-2"
                />
                <span className="text-primary text-xl font-bold hidden md:block">
                  Admin Panel
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 hidden sm:block">
                Welcome, Admin
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}