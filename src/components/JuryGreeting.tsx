// src/components/JuryGreeting.tsx
"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function JuryGreeting() {
  const [judgeName, setJudgeName] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get the current time to determine appropriate greeting
    const getTimeGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Selamat Pagi";
      if (hour < 15) return "Selamat Siang";
      if (hour < 19) return "Selamat Sore";
      return "Selamat Malam";
    };

    // Format current time
    const formatTime = () => {
      const now = new Date();
      return now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
    };

    // Set initial greeting and time
    setGreeting(getTimeGreeting());
    setCurrentTime(formatTime());

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(formatTime());
      setGreeting(getTimeGreeting());
    }, 60000);

    // Fetch judge information
    const fetchJudgeInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/profile');
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.judge) {
            setJudgeName(data.judge.fullName || "");
          }
        }
      } catch (error) {
        console.error("Error fetching judge info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJudgeInfo();

    return () => clearInterval(timeInterval);
  }, []);

  if (loading) {
    return <div className="animate-pulse h-14 bg-gray-200 rounded-lg w-full"></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-medium text-gray-800">
            {greeting}, <span className="font-bold text-primary">{judgeName || "Dewan Juri"}</span>
          </h2>
          <p className="text-sm text-gray-600">
            Selamat datang di sistem penilaian. Silakan lakukan evaluasi terhadap karya-karya yang telah diajukan.
          </p>
        </div>
        <div className="flex items-center text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full text-sm">
          <Clock className="h-4 w-4 mr-1.5" />
          <span>{currentTime}</span>
        </div>
      </div>
    </div>
  );
}