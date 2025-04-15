import { NextRequest, NextResponse } from "next/server";
import { authenticateJudge, setEvaluationMethod, getCurrentJudge, logoutJudge, getJudgeEvaluationMethodFromDB } from "@/lib/auth";

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
        // First check if the judge already has a method set in the database
        const currentJudge = getCurrentJudge();
        if (!currentJudge) {
          return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
          );
        }
        
        // Check if the judge already has an evaluation method
        const existingMethod = await getJudgeEvaluationMethodFromDB(currentJudge.id);
        if (existingMethod) {
          // If judge already has a method set, don't allow changes
          return NextResponse.json({ 
            success: false, 
            message: "Evaluation method is already set and cannot be changed",
            method: existingMethod
          }, { status: 400 });
        }
        
        if (method !== "checkbox" && method !== "scoring") {
          return NextResponse.json(
            { success: false, message: "Invalid evaluation method" },
            { status: 400 }
          );
        }
        
        const result = await setEvaluationMethod(method, currentJudge.id);
        if (!result) {
          return NextResponse.json(
            { success: false, message: "Failed to set evaluation method" },
            { status: 500 }
          );
        }
        
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