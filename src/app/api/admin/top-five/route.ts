
// src/app/api/admin/top-five/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentJudge, isAdmin } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const judge = getCurrentJudge();
    
    if (!judge || !isAdmin()) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - Admin access required" 
      }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = request.nextUrl;
    const categoryId = searchParams.get("categoryId");
    
    // Build query with optional category filter
    let query = `
      SELECT 
        s.*,
        c.name as categoryName,
        (t.id IS NOT NULL) as isTopFive
      FROM 
        SubmissionValid s
      JOIN 
        Category c ON s.categoryId = c.id
      LEFT JOIN 
        TopFiveSelections t ON s.id = t.submissionId
      WHERE 
        s.status = 'SUBMITTED' AND s.isActive = 1
    `;
    
    const queryParams: any[] = [];
    
    // Add category filter if provided
    if (categoryId && categoryId !== "all") {
      query += " AND s.categoryId = ?";
      queryParams.push(categoryId);
    }
    
    // Order by top five first, then by submission date
    query += " ORDER BY (t.id IS NOT NULL) DESC, s.createdAt DESC";
    
    // Execute query
    const [submissions] = await pool.query(query, queryParams);
    
    // Get categories
    const [categories] = await pool.query(
      `SELECT id, name FROM Category WHERE isActive = 1`
    );
    
    // Get current top 5 selections
    const [topFive] = await pool.query(`
      SELECT 
        t.*,
        s.title as submissionTitle
      FROM 
        TopFiveSelections t
      JOIN 
        SubmissionValid s ON t.submissionId = s.id
      ORDER BY 
        t.rank ASC
    `);
    
    // Fetch jury evaluations (only for selected submissions and limit to 10)
    const [juryEvaluations] = await pool.query(`
      SELECT 
        je.id,
        je.juryId,
        j.fullName as juryName,
        je.submissionId,
        s.title as submissionTitle,
        s.description as submissionDescription,
        c.name as categoryName,
        je.evaluationMethod,
        je.selected,
        je.score1,
        je.score2,
        je.score3,
        je.score4,
        je.comments,
        je.isFinalized,
        je.createdAt,
        s.submissionFile,
        s.submissionFiles
      FROM 
        JuryEvaluation je
      JOIN 
        Jury j ON je.juryId = j.id
      JOIN 
        SubmissionValid s ON je.submissionId = s.id
      JOIN 
        Category c ON s.categoryId = c.id
      WHERE 
        je.selected = 1
      ORDER BY 
        je.createdAt DESC
      LIMIT 10
    `);
    
    // Format submissions 
    const formattedSubmissions = (submissions as any[]).map(submission => ({
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
      isTopFive: !!submission.isTopFive
    }));
    
    // Format jury evaluations
    const formattedEvaluations = (juryEvaluations as any[]).map(evaluation => ({
      id: evaluation.id,
      juryId: evaluation.juryId,
      juryName: evaluation.juryName,
      submissionId: evaluation.submissionId,
      submissionTitle: evaluation.submissionTitle,
      submissionDescription: evaluation.submissionDescription || "",
      categoryName: evaluation.categoryName,
      evaluationMethod: evaluation.evaluationMethod,
      selected: !!evaluation.selected,
      score1: evaluation.score1,
      score2: evaluation.score2,
      score3: evaluation.score3,
      score4: evaluation.score4,
      comments: evaluation.comments,
      isFinalized: !!evaluation.isFinalized,
      createdAt: evaluation.createdAt.toString(),
      submissionFile: evaluation.submissionFile,
      submissionFiles: evaluation.submissionFiles ? JSON.parse(evaluation.submissionFiles) : []
    }));
    
    return NextResponse.json({ 
      success: true, 
      submissions: formattedSubmissions,
      categories,
      topFive,
      juryEvaluations: formattedEvaluations
    });
    
  } catch (error) {
    console.error("Admin top 5 submissions API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const judge = getCurrentJudge();
    
    if (!judge || !isAdmin()) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - Admin access required" 
      }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate submissions
    if (!data.submissions || !Array.isArray(data.submissions) || data.submissions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "No submissions provided for Top 5" 
      }, { status: 400 });
    }
    
    const MAX_TOP_SELECTIONS = 5;
    
    if (data.submissions.length > MAX_TOP_SELECTIONS) {
      return NextResponse.json({ 
        success: false, 
        message: `You can only select up to ${MAX_TOP_SELECTIONS} submissions` 
      }, { status: 400 });
    }
    
    // Begin transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // First, clear previous top 5 selections
      await connection.query(`DELETE FROM TopFiveSelections`);
      
      // Then insert new selections
      if (data.submissions.length > 0) {
        // Create values for batch insert
        const values = data.submissions.map((submission, index) => 
          [
            `top5_${Date.now()}_${index}`, // Generate ID
            judge.id, // Use admin ID from session
            submission.id, // Submission ID
            index + 1 // Rank from 1 to 5
          ]
        );
        
        // Prepare placeholders for SQL query
        const placeholders = values.map(() => '(?, ?, ?, ?)').join(',');
        
        // Flatten values array for query parameters
        const flatValues = values.flat();
        
        await connection.query(`
          INSERT INTO TopFiveSelections (id, juryId, submissionId, rank)
          VALUES ${placeholders}
        `, flatValues);
      }
      
      // Commit transaction
      await connection.commit();
      
      // Return success
      return NextResponse.json({ 
        success: true, 
        message: "Top 5 submissions saved successfully"
      });
    } catch (error) {
      // Rollback transaction if error
      await connection.rollback();
      throw error;
    } finally {
      // Release connection
      connection.release();
    }
    
  } catch (error) {
    console.error("Save Admin Top 5 API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}