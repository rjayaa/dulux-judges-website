// src/app/api/admin/winners/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentJudge, isAdmin } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin access
    const judge = getCurrentJudge();
    
    if (!judge || !isAdmin()) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - Admin access required" 
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
        s.submissionType
      FROM 
        TopFiveSelections t
      JOIN 
        SubmissionValid s ON t.submissionId = s.id
      JOIN 
        Category c ON s.categoryId = c.id
      ORDER BY 
        t.rank ASC
    `);
    
    // Get all judges for the dropdown
    const [judges] = await pool.query(`
      SELECT id, fullName
      FROM Jury
      WHERE isActive = 1
      ORDER BY fullName ASC
    `);
    
    // Get all final scores for each finalist and judge
    const [allScores] = await pool.query(`
      SELECT 
        fs.id,
        fs.juryId,
        j.fullName as juryName,
        fs.submissionId,
        fs.score1,
        fs.score2,
        fs.score3,
        fs.score4,
        fs.comments,
        fs.createdAt,
        fs.updatedAt
      FROM 
        FinalScores fs
      JOIN
        Jury j ON fs.juryId = j.id
      JOIN
        TopFiveSelections t ON fs.submissionId = t.submissionId
      ORDER BY
        fs.juryId, t.rank ASC
    `);
    
    // Format the data
    const formattedFinalists = (finalists as any[]).map(finalist => {
      // Get scores for this finalist
      const finalistScores = (allScores as any[]).filter(s => 
        s.submissionId === finalist.submissionId
      );
      
      return {
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
        judges: finalistScores.map(score => ({
          id: score.juryId,
          name: score.juryName,
          finalScoreId: score.id,
          scores: {
            score1: score.score1?.toString() || "",
            score2: score.score2?.toString() || "",
            score3: score.score3?.toString() || "",
            score4: score.score4?.toString() || ""
          },
          comments: score.comments || "",
          createdAt: score.createdAt.toString(),
          updatedAt: score.updatedAt.toString()
        }))
      };
    });
    
    return NextResponse.json({ 
      success: true, 
      finalists: formattedFinalists,
      judges: judges
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
    
    if (!judge || !isAdmin()) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - Admin access required" 
      }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate the data
    if (!data.submissionId || !data.juryId || !data.scores || 
        !data.scores.score1 || !data.scores.score2 || 
        !data.scores.score3 || !data.scores.score4) {
      return NextResponse.json({ 
        success: false, 
        message: "Missing required data"
      }, { status: 400 });
    }
    
    // Check if there is an existing score to update
    const [existingScores] = await pool.query(`
      SELECT id FROM FinalScores 
      WHERE submissionId = '${data.submissionId}' 
      AND juryId = '${data.juryId}'
    `);
    
    let result;
    
    if ((existingScores as any[]).length > 0) {
      // Update existing score
      const scoreId = (existingScores as any[])[0].id;
      
      result = await pool.query(`
        UPDATE FinalScores SET 
          score1 = ${parseInt(data.scores.score1)}, 
          score2 = ${parseInt(data.scores.score2)}, 
          score3 = ${parseInt(data.scores.score3)}, 
          score4 = ${parseInt(data.scores.score4)}, 
          comments = '${data.comments || ""}', 
          updatedAt = NOW()
        WHERE id = '${scoreId}'
      `);
    } else {
      // Create new score
      const scoreId = `final_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      result = await pool.query(`
        INSERT INTO FinalScores (
          id, juryId, submissionId, score1, score2, score3, score4, comments
        ) VALUES (
          '${scoreId}',
          '${data.juryId}',
          '${data.submissionId}',
          ${parseInt(data.scores.score1)},
          ${parseInt(data.scores.score2)},
          ${parseInt(data.scores.score3)},
          ${parseInt(data.scores.score4)},
          '${data.comments || ""}'
        )
      `);
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