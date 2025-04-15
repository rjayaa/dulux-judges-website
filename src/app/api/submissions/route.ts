// src/app/api/submissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentJudge } from "@/lib/auth";
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
    
    // Get query parameters
    const { searchParams } = request.nextUrl;
    const categoryId = searchParams.get("categoryId");
    
    // Base query for submissions
    let submissionsQuery = `
      SELECT s.*, c.name as categoryName
      FROM Submission s
      JOIN Category c ON s.categoryId = c.id
      WHERE s.status = 'SUBMITTED' AND s.isActive = 1
    `;
    
    const queryParams: any[] = [];
    
    // Add category filter if provided
    if (categoryId && categoryId !== "all") {
      submissionsQuery += " AND s.categoryId = ?";
      queryParams.push(categoryId);
    }
    
    submissionsQuery += " ORDER BY s.createdAt DESC";
    
    // Execute query
    const [submissions] = await pool.query(submissionsQuery, queryParams);
    
    // Get evaluations by this judge
    const [evaluations] = await pool.query(
      `SELECT * FROM JuryEvaluation WHERE juryId = ?`,
      [judge.id]
    );
    
    // Convert to expected format
    const submissionsWithEvaluations = (submissions as any[]).map(submission => {
      const evaluation = (evaluations as any[]).find(e => e.submissionId === submission.id);
      
      return {
        id: submission.id,
        title: submission.title,
        description: submission.description || "",
        status: submission.status,
        submittedAt: submission.createdAt.toString(),
        categoryId: submission.categoryId,
        categoryName: submission.categoryName,
        submissionId: submission.submissionId || "",
        submissionType: submission.submissionType || "INDIVIDUAL",
        submissionFile: submission.submissionFile,
        submissionFiles: submission.submissionFiles ? JSON.parse(submission.submissionFiles) : [],
        evaluated: !!evaluation,
        comment: evaluation?.comments || "",
        ...(evaluation?.evaluationMethod === "scoring" ? {
          scores: {
            score1: evaluation.score1?.toString() || "",
            score2: evaluation.score2?.toString() || "",
            score3: evaluation.score3?.toString() || "",
            score4: evaluation.score4?.toString() || ""
          }
        } : {})
      };
    });
    
    // Get all active categories
    const [categories] = await pool.query(
      `SELECT id, name FROM Category WHERE isActive = 1`
    );
    
    // Return submissions with categories
    return NextResponse.json({ 
      success: true, 
      submissions: submissionsWithEvaluations,
      categories
    });
    
  } catch (error) {
    console.error("Submissions API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}

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
    
    const data = await request.json();
    
    // Handle submission evaluation
    if (data.action === "evaluate" && data.submissionId) {
      // Check if evaluation already exists
      const [existingEvaluations] = await pool.query(
        `SELECT * FROM JuryEvaluation WHERE juryId = ? AND submissionId = ?`,
        [judge.id, data.submissionId]
      );
      
      const existingEvaluation = (existingEvaluations as any[])[0];
      
      if (data.remove) {
        // Remove evaluation if it exists
        if (existingEvaluation) {
          await pool.query(
            `DELETE FROM JuryEvaluation WHERE id = ?`,
            [existingEvaluation.id]
          );
        }
      } else if (existingEvaluation) {
        // Update existing evaluation
        let updateQuery = `
          UPDATE JuryEvaluation SET
          evaluationMethod = ?,
          selected = ?,
          comments = ?,
          updatedAt = NOW()
        `;
        
        const params = [
          data.method,
          data.selected ? 1 : 0,
          data.comments || null
        ];
        
        // Add score fields if scoring method
        if (data.method === "scoring") {
          updateQuery += `, score1 = ?, score2 = ?, score3 = ?, score4 = ?`;
          params.push(
            data.scores?.score1 ? parseInt(data.scores.score1) : null,
            data.scores?.score2 ? parseInt(data.scores.score2) : null,
            data.scores?.score3 ? parseInt(data.scores.score3) : null,
            data.scores?.score4 ? parseInt(data.scores.score4) : null
          );
        }
        
        updateQuery += ` WHERE id = ?`;
        params.push(existingEvaluation.id);
        
        await pool.query(updateQuery, params);
      } else {
        // Create new evaluation
        const evaluationId = `eval_${Date.now()}`;
        
        let insertQuery = `
          INSERT INTO JuryEvaluation (
            id, juryId, submissionId, evaluationMethod, 
            selected, comments
        `;
        
        let placeholders = `?, ?, ?, ?, ?, ?`;
        
        const params = [
          evaluationId,
          judge.id,
          data.submissionId,
          data.method,
          data.selected ? 1 : 0,
          data.comments || null
        ];
        
        // Add score fields if scoring method
        if (data.method === "scoring") {
          insertQuery += `, score1, score2, score3, score4`;
          placeholders += `, ?, ?, ?, ?`;
          
          params.push(
            data.scores?.score1 ? parseInt(data.scores.score1) : null,
            data.scores?.score2 ? parseInt(data.scores.score2) : null,
            data.scores?.score3 ? parseInt(data.scores.score3) : null,
            data.scores?.score4 ? parseInt(data.scores.score4) : null
          );
        }
        
        insertQuery += `) VALUES (${placeholders})`;
        
        await pool.query(insertQuery, params);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "Evaluation submitted successfully"
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: "Invalid action" 
    }, { status: 400 });
    
  } catch (error) {
    console.error("Submissions API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}