import { NextRequest, NextResponse } from "next/server";
import { getCurrentJudge, getEvaluationMethod } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check if judge is authenticated
    const judge = getCurrentJudge();
    
    if (!judge) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized" 
      }, { status: 401 });
    }
    
    // Get evaluation method from cookies
    const evaluationMethod = getEvaluationMethod();
    
    if (!evaluationMethod) {
      return NextResponse.json({ 
        success: false, 
        message: "Evaluation method not selected" 
      }, { status: 400 });
    }
    
    const data = await request.json();
    
    // Validate submissions
    if (!data.submissions || !Array.isArray(data.submissions) || data.submissions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "No submissions provided for finalization" 
      }, { status: 400 });
    }
    
    const MAX_EVALUATIONS = 10;
    
    if (data.submissions.length > MAX_EVALUATIONS) {
      return NextResponse.json({ 
        success: false, 
        message: `You can only finalize up to ${MAX_EVALUATIONS} submissions` 
      }, { status: 400 });
    }
    
    // In a real app, you would save the finalized submissions to the database
    // and mark them as final so they can't be changed
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return success
    return NextResponse.json({ 
      success: true, 
      message: "Submissions finalized successfully"
    });
    
  } catch (error) {
    console.error("Finalize submissions API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}