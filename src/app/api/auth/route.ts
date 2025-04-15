import { NextRequest, NextResponse } from "next/server";
import { authenticateJudge, setEvaluationMethod } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Handle judge login
    if (data.action === "login" && data.pin) {
      const judge = await authenticateJudge(data.pin);
      
      if (judge) {
        return NextResponse.json({ 
          success: true, 
          message: "Authentication successful",
          judge: {
            id: judge.id,
            name: judge.name
          }
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          message: "Invalid PIN" 
        }, { status: 401 });
      }
    }
    
    // Handle setting evaluation method
    if (data.action === "setEvaluationMethod" && data.method) {
      if (data.method !== "checkbox" && data.method !== "scoring") {
        return NextResponse.json({ 
          success: false, 
          message: "Invalid evaluation method" 
        }, { status: 400 });
      }
      
      setEvaluationMethod(data.method);
      
      return NextResponse.json({ 
        success: true, 
        message: "Evaluation method set successfully"
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: "Invalid action" 
    }, { status: 400 });
    
  } catch (error) {
    console.error("Auth API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}