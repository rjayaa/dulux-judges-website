import { NextRequest, NextResponse } from "next/server";
import { authenticateJudge, setEvaluationMethod, getCurrentJudge, logoutJudge } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pin, method } = body;

    switch (action) {
      case "login":
        const judge = await authenticateJudge(pin);
        if (judge) {
          return NextResponse.json({ success: true, judge });
        }
        return NextResponse.json(
          { success: false, message: "Invalid PIN" },
          { status: 401 }
        );

      case "setEvaluationMethod":
        if (method !== "checkbox" && method !== "scoring") {
          return NextResponse.json(
            { success: false, message: "Invalid evaluation method" },
            { status: 400 }
          );
        }
        setEvaluationMethod(method);
        return NextResponse.json({ success: true });

      case "logout":
        logoutJudge();
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// Handle GET requests for checking authentication status
export async function GET() {
  const judge = getCurrentJudge();
  
  if (judge) {
    return NextResponse.json({ 
      success: true, 
      authenticated: true,
      judge 
    });
  }
  
  return NextResponse.json({ 
    success: false, 
    authenticated: false 
  });
}