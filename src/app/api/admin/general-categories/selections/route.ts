// src/app/api/admin/general-categories/selections/route.ts
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
        (g.id IS NOT NULL) as isSelected
      FROM 
        SubmissionValid s
      JOIN 
        Category c ON s.categoryId = c.id
      LEFT JOIN 
        GeneralCategorySelections g ON s.id = g.submissionId
      WHERE 
        s.status = 'SUBMITTED' AND s.isActive = 1
    `;
    
    const queryParams: any[] = [];
    
    // Add category filter if provided
    if (categoryId && categoryId !== "all") {
      query += " AND s.categoryId = ?";
      queryParams.push(categoryId);
    }
    
    // Order by selected first, then by submission date
    query += " ORDER BY (g.id IS NOT NULL) DESC, s.createdAt DESC";
    
    // Execute query
    const [submissions] = await pool.query(query, queryParams);
    
    // Get categories
    const [categories] = await pool.query(
      `SELECT id, name FROM Category WHERE isActive = 1`
    );
    
    // Get current selections for the category
    let selectionsQuery = `
      SELECT 
        g.*,
        s.title as submissionTitle,
        c.name as categoryName
      FROM 
        GeneralCategorySelections g
      JOIN 
        SubmissionValid s ON g.submissionId = s.id
      JOIN 
        Category c ON s.categoryId = c.id
    `;
    
    if (categoryId && categoryId !== "all") {
      selectionsQuery += " WHERE g.categoryId = ?";
    }
    
    selectionsQuery += " ORDER BY g.rank ASC";
    
    const [currentSelections] = await pool.query(
      selectionsQuery,
      categoryId && categoryId !== "all" ? [categoryId] : []
    );
    
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
      isSelected: !!submission.isSelected
    }));
    
    return NextResponse.json({ 
      success: true, 
      submissions: formattedSubmissions,
      categories,
      currentSelections
    });
    
  } catch (error) {
    console.error("General categories selections API error:", error);
    
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
        message: "No submissions provided for selection" 
      }, { status: 400 });
    }
    
    // Validate categoryId
    if (!data.categoryId) {
      return NextResponse.json({ 
        success: false, 
        message: "Category ID is required" 
      }, { status: 400 });
    }
    
    // Begin transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // First, clear previous selections for this category
      await connection.query(
        `DELETE FROM GeneralCategorySelections WHERE categoryId = ?`,
        [data.categoryId]
      );
      
      // Then insert new selections
      if (data.submissions.length > 0) {
        // Create values for batch insert
        const values = data.submissions.map((submission: any, index: number) => 
          [
            `gcs_${Date.now()}_${index}`, // Generate ID
            judge.id, // Use admin ID from session
            submission.id, // Submission ID
            data.categoryId, // Category ID
            index + 1 // Rank from 1 to N
          ]
        );
        
        // Prepare placeholders for SQL query
        const placeholders = values.map(() => '(?, ?, ?, ?, ?)').join(',');
        
        // Flatten values array for query parameters
        const flatValues = values.flat();
        
        await connection.query(`
          INSERT INTO GeneralCategorySelections (id, juryId, submissionId, categoryId, rank)
          VALUES ${placeholders}
        `, flatValues);
      }
      
      // Commit transaction
      await connection.commit();
      
      // Return success
      return NextResponse.json({ 
        success: true, 
        message: `${data.submissions.length} submissions saved successfully for evaluation`
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
    console.error("Save general categories selections API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}