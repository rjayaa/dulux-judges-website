// src/app/api/admin/general-categories/route.ts
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

    const { searchParams } = request.nextUrl;
    const categoryId = searchParams.get("categoryId");
    
    // Get all valid submissions for the category (directly from SubmissionValid)
    let submissionsQuery = `
      SELECT 
        s.id,
        s.title,
        s.description,
        s.submissionId as submissionNumber,
        s.categoryId,
        c.name as categoryName,
        s.createdAt as submittedAt,
        s.submissionType,
        s.submissionFile,
        s.submissionFiles
      FROM 
        SubmissionValid s
      JOIN 
        Category c ON s.categoryId = c.id
      WHERE 
        s.status = 'SUBMITTED' AND s.isActive = 1
    `;
    
    const queryParams: any[] = [];
    
    if (categoryId && categoryId !== "all") {
      submissionsQuery += " AND s.categoryId = ?";
      queryParams.push(categoryId);
    }
    
    submissionsQuery += " ORDER BY s.createdAt DESC";
    
    const [submissions] = await pool.query(submissionsQuery, queryParams);
    
    // Get available judges
    const [judges] = await pool.query(`
      SELECT id, fullName 
      FROM Jury 
      WHERE isActive = 1
      ORDER BY fullName ASC
    `);
    
    // Get all categories for filter dropdown
    const [categories] = await pool.query(`
      SELECT id, name 
      FROM Category 
      WHERE isActive = 1
      ORDER BY name ASC
    `);
    
    // Get scores for all submissions in the category
    let scoresQuery = `
      SELECT 
        gfs.id as finalScoreId,
        gfs.juryId,
        j.fullName as juryName,
        gfs.submissionId,
        gfs.score1,
        gfs.score2,
        gfs.score3,
        gfs.score4,
        gfs.comments,
        gfs.createdAt,
        gfs.updatedAt
      FROM 
        GeneralFinalScores gfs
      JOIN
        Jury j ON gfs.juryId = j.id
      JOIN
        SubmissionValid s ON gfs.submissionId = s.id
      WHERE 
        s.status = 'SUBMITTED' AND s.isActive = 1
    `;
    
    const scoresQueryParams: any[] = [];
    
    if (categoryId && categoryId !== "all") {
      scoresQuery += " AND gfs.categoryId = ?";
      scoresQueryParams.push(categoryId);
    }
    
    scoresQuery += " ORDER BY j.fullName ASC";
    
    const [scores] = await pool.query(scoresQuery, scoresQueryParams);
    
    // Process the data to create submissions with their judges' scores
    const processedSubmissions = (submissions as any[]).map(submission => {
      const submissionScores = (scores as any[]).filter(s => 
        s.submissionId === submission.id
      );
      
      // Map scores to judge format
      const judgeScores = submissionScores.map(score => ({
        id: score.juryId,
        name: score.juryName,
        finalScoreId: score.finalScoreId,
        scores: {
          score1: score.score1?.toString() || "",
          score2: score.score2?.toString() || "",
          score3: score.score3?.toString() || "",
          score4: score.score4?.toString() || ""
        },
        comments: score.comments || "",
        createdAt: score.createdAt?.toString() || "",
        updatedAt: score.updatedAt?.toString() || ""
      }));
      
      return {
        id: submission.id,
        title: submission.title,
        description: submission.description || "",
        submissionNumber: submission.submissionNumber || "",
        categoryId: submission.categoryId,
        categoryName: submission.categoryName,
        submittedAt: submission.submittedAt?.toString() || "",
        submissionType: submission.submissionType || "INDIVIDUAL",
        submissionFile: submission.submissionFile,
        submissionFiles: submission.submissionFiles ? JSON.parse(submission.submissionFiles) : [],
        judges: judgeScores
      };
    });
    
    return NextResponse.json({ 
      success: true, 
      submissions: processedSubmissions,
      judges: (judges as any[]).map(j => ({ id: j.id, fullName: j.fullName })),
      categories: (categories as any[]).map(c => ({ id: c.id, name: c.name }))
    });
    
  } catch (error) {
    console.error("General categories API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin access
    const judge = getCurrentJudge();
    
    if (!judge || !isAdmin()) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - Admin access required" 
      }, { status: 401 });
    }
    
    const data = await request.json();
    const { submissionId, juryId, scores, comments, categoryId } = data;
    
    // Validate input
    if (!submissionId || !juryId || !scores || !categoryId) {
      return NextResponse.json({ 
        success: false, 
        message: "Missing required fields" 
      }, { status: 400 });
    }
    
    // Validate scores
    const { score1, score2, score3, score4 } = scores;
    if (!score1 || !score2 || !score3 || !score4) {
      return NextResponse.json({ 
        success: false, 
        message: "All scores are required" 
      }, { status: 400 });
    }
    
    // Check score ranges
    const allScores = [parseInt(score1), parseInt(score2), parseInt(score3), parseInt(score4)];
    for (const score of allScores) {
      if (isNaN(score) || score < 1 || score > 10) {
        return NextResponse.json({ 
          success: false, 
          message: "All scores must be between 1 and 10" 
        }, { status: 400 });
      }
    }
    
    // Check if score already exists (for update)
    const [existingScore] = await pool.query(`
      SELECT id FROM GeneralFinalScores 
      WHERE juryId = ? AND submissionId = ? AND categoryId = ?
    `, [juryId, submissionId, categoryId]);
    
    if (existingScore && (existingScore as any[]).length > 0) {
      // Update existing score
      const scoreId = (existingScore as any[])[0].id;
      await pool.query(`
        UPDATE GeneralFinalScores 
        SET score1 = ?, score2 = ?, score3 = ?, score4 = ?, comments = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [parseInt(score1), parseInt(score2), parseInt(score3), parseInt(score4), comments || null, scoreId]);
    } else {
      // Insert new score
      const scoreId = `gfs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await pool.query(`
        INSERT INTO GeneralFinalScores 
        (id, juryId, submissionId, categoryId, score1, score2, score3, score4, comments)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [scoreId, juryId, submissionId, categoryId, parseInt(score1), parseInt(score2), parseInt(score3), parseInt(score4), comments || null]);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Score saved successfully" 
    });
    
  } catch (error) {
    console.error("Save general category score API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}