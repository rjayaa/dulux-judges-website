// src/app/api/admin/general-categories/results/route.ts
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
    
    // Get all submissions from GeneralCategorySelections with more details
    let finalistsQuery = `
      SELECT 
        g.id as generalSelectionId,
        g.rank,
        g.submissionId,
        s.title,
        s.submissionId as submissionNumber,
        c.name as categoryName,
        s.description
      FROM 
        GeneralCategorySelections g
      JOIN 
        SubmissionValid s ON g.submissionId = s.id
      JOIN 
        Category c ON s.categoryId = c.id
    `;
    
    const queryParams: any[] = [];
    
    if (categoryId && categoryId !== "all") {
      finalistsQuery += " WHERE g.categoryId = ?";
      queryParams.push(categoryId);
    }
    
    finalistsQuery += " ORDER BY g.rank ASC";
    
    const [finalists] = await pool.query(finalistsQuery, queryParams);
    
    // Get all judges who have provided scores for general categories
    let judgesQuery = `
      SELECT DISTINCT j.id, j.fullName as name
      FROM GeneralFinalScores gfs
      JOIN Jury j ON gfs.juryId = j.id
    `;
    
    if (categoryId && categoryId !== "all") {
      judgesQuery += " WHERE gfs.categoryId = ?";
    }
    
    judgesQuery += " ORDER BY j.fullName ASC";
    
    const [activeJudges] = await pool.query(
      judgesQuery, 
      categoryId && categoryId !== "all" ? [categoryId] : []
    );
    
    // Get all scores for all selected submissions with detailed information
    let scoresQuery = `
      SELECT 
        gfs.id,
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
        GeneralCategorySelections g ON gfs.submissionId = g.submissionId
    `;
    
    if (categoryId && categoryId !== "all") {
      scoresQuery += " WHERE gfs.categoryId = ?";
    }
    
    scoresQuery += " ORDER BY g.rank ASC, j.fullName ASC";
    
    const [allScores] = await pool.query(
      scoresQuery,
      categoryId && categoryId !== "all" ? [categoryId] : []
    );
    
    // Get all categories for filter dropdown
    const [categories] = await pool.query(`
      SELECT id, name 
      FROM Category 
      WHERE isActive = 1
      ORDER BY name ASC
    `);
    
    // Process the data to create a matrix of finalists and judges
    const judgesToShow = (activeJudges as any[]).map(j => ({
      id: j.id,
      name: j.name
    }));
    
    // For each finalist, create an entry with scores from each judge
    const resultsMatrix = (finalists as any[]).map(finalist => {
      const finalistScores = (allScores as any[]).filter(s => 
        s.submissionId === finalist.submissionId
      );
      
      // Map each judge to their scores for this finalist
      const judgeScores = judgesToShow.map(judge => {
        const score = finalistScores.find(s => s.juryId === judge.id);
        if (!score) return null;
        
        // Calculate weighted score
        const weightedScore = (
          (score.score1 * 4) + 
          (score.score2 * 3) + 
          (score.score3 * 2) + 
          (score.score4 * 1)
        );
        
        return {
          juryId: judge.id,
          juryName: judge.name,
          score1: score.score1,
          score2: score.score2,
          score3: score.score3,
          score4: score.score4,
          weightedScore,
          comments: score.comments || "",
          createdAt: score.createdAt,
          updatedAt: score.updatedAt
        };
      });
      
      // Calculate average score across all judges who scored this finalist
      const validScores = judgeScores.filter(s => s !== null) as any[];
      const avgScore = validScores.length > 0
        ? validScores.reduce((sum, s) => sum + s.weightedScore, 0) / validScores.length
        : null;
      
      return {
        id: finalist.submissionId,
        generalSelectionId: finalist.generalSelectionId,
        rank: finalist.rank,
        title: finalist.title,
        submissionNumber: finalist.submissionNumber,
        categoryName: finalist.categoryName,
        description: finalist.description,
        judgeScores,
        averageScore: avgScore ? parseFloat(avgScore.toFixed(2)) : null
      };
    });
    
    // Sort by average score descending (highest first)
    resultsMatrix.sort((a, b) => {
      if (a.averageScore === null) return 1;
      if (b.averageScore === null) return -1;
      return b.averageScore - a.averageScore;
    });
    
    return NextResponse.json({ 
      success: true, 
      judges: judgesToShow,
      results: resultsMatrix,
      categories: (categories as any[]).map(c => ({ id: c.id, name: c.name }))
    });
    
  } catch (error) {
    console.error("General categories results API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}

// Add DELETE method to handle score deletion
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and admin access
    const judge = getCurrentJudge();
    
    if (!judge || !isAdmin()) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - Admin access required" 
      }, { status: 401 });
    }
    
    // Get the score ID from the request
    const data = await request.json();
    const { scoreId } = data;
    
    if (!scoreId) {
      return NextResponse.json({ 
        success: false, 
        message: "Score ID is required" 
      }, { status: 400 });
    }
    
    // Delete the score from the database
    const [result] = await pool.query(
      "DELETE FROM GeneralFinalScores WHERE id = ?",
      [scoreId]
    );
    
    const deleteResult = result as any;
    
    if (deleteResult.affectedRows === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Score not found or already deleted" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Score deleted successfully" 
    });
    
  } catch (error) {
    console.error("Delete general category score API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}