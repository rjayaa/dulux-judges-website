import { NextRequest, NextResponse } from "next/server";
import { getCurrentJudge, getJudgeEvaluationMethodFromDB } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check if judge is authenticated
    const judge = getCurrentJudge();
    
    if (!judge) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized" 
      }, { status: 401 });
    }
    
    // Get evaluation method directly from the database
    const method = await getJudgeEvaluationMethodFromDB(judge.id);
    
    return NextResponse.json({ 
      success: true, 
      method
    });
    
  } catch (error) {
    console.error("Method check API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}