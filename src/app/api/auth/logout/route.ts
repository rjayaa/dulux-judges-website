import { NextRequest, NextResponse } from "next/server";
import { logoutJudge } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Log out the judge by clearing cookies
    logoutJudge();
    
    return NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    });
  } catch (error) {
    console.error("Logout API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}