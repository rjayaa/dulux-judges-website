// src/app/admin/layout.tsx
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
  BarChart2,
  Medal,
  Menu
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  
  // Navigation items - only keep pages that exist
  const navigationItems = [
    {
      name: "Top 5 Selections",
      href: "/admin/top-five",
      icon: Trophy,
      current: pathname === "/admin/top-five"
    },
    {
      name: "Winners",
      href: "/admin/winners",
      icon: Medal,
      current: pathname === "/admin/winners"
    },
     {
      name: "Final Results",
      href: "/admin/winners/results",
      icon: BarChart2,
      current: pathname === "/admin/winners/results"
    }
    // Additional pages can be added here when they're implemented
  ];
  
  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
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
  
  // Main admin layout with proper sidebar
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top navigation bar */}
      <header className="bg-white shadow-sm z-40 border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 mr-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                onClick={toggleSidebar}
              >
                <Menu className="h-6 w-6" />
              </button>
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
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - hidden on mobile unless toggled */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:flex-shrink-0 bg-white z-20 border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'absolute md:relative inset-y-0 left-0 w-64 md:w-64' : 'w-0'
        }`}>
          <div className="flex flex-col h-full">
            {/* Close button - only on mobile */}
            <div className="md:hidden p-4 flex justify-end">
              <button
                onClick={toggleSidebar}
                className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
              <div className="pt-4 pb-2 mb-4 border-b border-gray-200">
                <div className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin Navigation
                </div>
              </div>
              
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    item.current
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => {
                    // Close sidebar on mobile when navigating
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      item.current ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Mobile overlay when sidebar is open */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}