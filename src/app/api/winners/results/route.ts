// src/app/api/admin/winners/results/route.ts
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
    
    // Get all submissions from TopFiveSelections
    const [finalists] = await pool.query(`
      SELECT 
        t.id as topFiveId,
        t.rank,
        t.submissionId,
        s.title,
        s.submissionId as submissionNumber,
        c.name as categoryName
      FROM 
        TopFiveSelections t
      JOIN 
        SubmissionValid s ON t.submissionId = s.id
      JOIN 
        Category c ON s.categoryId = c.id
      ORDER BY 
        t.rank ASC
    `);
    
    // Get all judges who have provided scores
    const [activeJudges] = await pool.query(`
      SELECT DISTINCT j.id, j.fullName
      FROM FinalScores fs
      JOIN Jury j ON fs.juryId = j.id
      ORDER BY j.fullName ASC
    `);
    
    // Get all scores for all finalists
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
        fs.comments
      FROM 
        FinalScores fs
      JOIN
        Jury j ON fs.juryId = j.id
      JOIN
        TopFiveSelections t ON fs.submissionId = t.submissionId
      ORDER BY
        t.rank ASC, j.fullName ASC
    `);
    
    // Process the data to create a matrix of finalists and judges
    const judgesToShow = (activeJudges as any[]).map(j => ({
      id: j.id,
      name: j.fullName
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
          comments: score.comments
        };
      });
      
      // Calculate average score across all judges who scored this finalist
      const validScores = judgeScores.filter(s => s !== null) as any[];
      const avgScore = validScores.length > 0
        ? validScores.reduce((sum, s) => sum + s.weightedScore, 0) / validScores.length
        : null;
      
      return {
        id: finalist.submissionId,
        topFiveId: finalist.topFiveId,
        rank: finalist.rank,
        title: finalist.title,
        submissionNumber: finalist.submissionNumber,
        categoryName: finalist.categoryName,
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
      results: resultsMatrix
    });
    
  } catch (error) {
    console.error("Winners results API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}