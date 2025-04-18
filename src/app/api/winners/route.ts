// src/app/api/winners/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentJudge, isAdmin } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const judge = getCurrentJudge();
    
    if (!judge) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized" 
      }, { status: 401 });
    }
    
    // Get the top 5 finalists
    const [finalists] = await pool.query(`
      SELECT 
        t.id as topFiveId,
        t.submissionId,
        s.title,
        s.description,
        s.submissionId as submissionNumber,
        s.submissionFile,
        s.submissionFiles,
        s.categoryId,
        c.name as categoryName,
        s.createdAt as submittedAt,
        s.submissionType,
        f.id as finalScoreId,
        f.score1,
        f.score2,
        f.score3,
        f.score4,
        f.comments
      FROM 
        TopFiveSelections t
      JOIN 
        SubmissionValid s ON t.submissionId = s.id
      JOIN 
        Category c ON s.categoryId = c.id
      LEFT JOIN
        FinalScores f ON t.submissionId = f.submissionId AND f.juryId = ?
      ORDER BY 
        t.rank ASC
    `, [judge.id]);
    
    // Format the data
    const formattedFinalists = (finalists as any[]).map(finalist => ({
      id: finalist.submissionId,
      topFiveId: finalist.topFiveId,
      title: finalist.title,
      description: finalist.description || "",
      submissionNumber: finalist.submissionNumber || "",
      categoryId: finalist.categoryId,
      categoryName: finalist.categoryName,
      submittedAt: finalist.submittedAt.toString(),
      submissionType: finalist.submissionType || "INDIVIDUAL",
      submissionFile: finalist.submissionFile,
      submissionFiles: finalist.submissionFiles ? JSON.parse(finalist.submissionFiles) : [],
      finalScoreId: finalist.finalScoreId || null,
      hasScore: !!finalist.finalScoreId,
      scores: finalist.finalScoreId ? {
        score1: finalist.score1?.toString() || "",
        score2: finalist.score2?.toString() || "",
        score3: finalist.score3?.toString() || "",
        score4: finalist.score4?.toString() || ""
      } : null,
      comments: finalist.comments || ""
    }));
    
    return NextResponse.json({ 
      success: true, 
      finalists: formattedFinalists
    });
    
  } catch (error) {
    console.error("Winners API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}

// Save scores for a finalist
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const judge = getCurrentJudge();
    
    if (!judge) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized" 
      }, { status: 401 });
    }
    
    // Only admins can score the finalists
    if (!isAdmin()) {
      return NextResponse.json({ 
        success: false, 
        message: "Only administrators can evaluate finalists" 
      }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Validate the data
    if (!data.submissionId || !data.scores || 
        !data.scores.score1 || !data.scores.score2 || 
        !data.scores.score3 || !data.scores.score4) {
      return NextResponse.json({ 
        success: false, 
        message: "Missing required data"
      }, { status: 400 });
    }
    
    // Check if there is an existing score to update
    const [existingScores] = await pool.query(
      "SELECT id FROM FinalScores WHERE submissionId = ? AND juryId = ?",
      [data.submissionId, judge.id]
    );
    
    let result;
    
    if ((existingScores as any[]).length > 0) {
      // Update existing score
      const scoreId = (existingScores as any[])[0].id;
      
      result = await pool.query(
        `UPDATE FinalScores SET 
          score1 = ?, score2 = ?, score3 = ?, score4 = ?, 
          comments = ?, updatedAt = NOW()
        WHERE id = ?`,
        [
          parseInt(data.scores.score1),
          parseInt(data.scores.score2),
          parseInt(data.scores.score3),
          parseInt(data.scores.score4),
          data.comments || "",
          scoreId
        ]
      );
    } else {
      // Create new score
      const scoreId = `final_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      result = await pool.query(
        `INSERT INTO FinalScores (
          id, juryId, submissionId, score1, score2, score3, score4, comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scoreId,
          judge.id,
          data.submissionId,
          parseInt(data.scores.score1),
          parseInt(data.scores.score2),
          parseInt(data.scores.score3),
          parseInt(data.scores.score4),
          data.comments || ""
        ]
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Scores saved successfully"
    });
    
  } catch (error) {
    console.error("Save finalist scores error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}