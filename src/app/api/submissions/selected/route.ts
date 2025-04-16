// src/app/api/submissions/selected/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentJudge, getEvaluationMethod } from "@/lib/auth";
import pool from "@/lib/db";

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
    
    // Get evaluation method from cookies
    const evaluationMethod = getEvaluationMethod();
    
    if (!evaluationMethod) {
      return NextResponse.json({ 
        success: false, 
        message: "Evaluation method not selected" 
      }, { status: 400 });
    }
    
    // Fetch selected submissions with joined data
  const [evaluations] = await pool.query(`
  SELECT 
    e.*,
    s.*,
    c.name as categoryName
  FROM 
    JuryEvaluation e
  JOIN 
    SubmissionValid s ON e.submissionId = s.id  
  JOIN 
    Category c ON s.categoryId = c.id
  WHERE 
    e.juryId = ? AND e.selected = 1
`, [judge.id]);
    
    // Map to the expected format
    const selectedSubmissions = (evaluations as any[]).map(evaluation => ({
      id: evaluation.submissionId,
      title: evaluation.title,
      description: evaluation.description || "",
      status: evaluation.status,
      submittedAt: evaluation.createdAt.toString(),
      categoryId: evaluation.categoryId,
      categoryName: evaluation.categoryName,
      submissionId: evaluation.submissionId || "",
      submissionType: evaluation.submissionType || "INDIVIDUAL",
      submissionFile: evaluation.submissionFile,
      submissionFiles: evaluation.submissionFiles ? JSON.parse(evaluation.submissionFiles) : [],
      evaluated: true,
      comment: evaluation.comments || "",
      ...(evaluationMethod === "scoring" ? {
        scores: {
          score1: evaluation.score1?.toString() || "",
          score2: evaluation.score2?.toString() || "",
          score3: evaluation.score3?.toString() || "",
          score4: evaluation.score4?.toString() || ""
        }
      } : {})
    }));
    
    // Return selected submissions
    return NextResponse.json({ 
      success: true, 
      submissions: selectedSubmissions,
      evaluationMethod
    });
    
  } catch (error) {
    console.error("Selected submissions API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}