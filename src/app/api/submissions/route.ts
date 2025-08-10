// src/app/api/submissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentJudge } from "@/lib/auth";
import pool from "@/lib/db";
import fs from "fs";
import path from "path";

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
    
    // Base query for submissions with new categories
    let submissionsQuery = `
      SELECT s.*, c.name as categoryName
      FROM Submission s
      JOIN Category c ON s.categoryId = c.id
      WHERE s.categoryId IN (
        "cm6v78vcq0004i0hygkb72no8", 
        "cm6v78vcr0005i0hylhqh6cua", 
        "cm6v78vcs0006i0hyeillv4p2", 
        "cm6v78vct0007i0hybnag0u2p", 
        "cm6v78vct0008i0hyfv0pkxc5", 
        "cm6v78vct0009i0hyq3qid6bl"
      ) AND s.status = "SUBMITTED" AND s.isActive = 1
    `;
    
    const queryParams: any[] = [];
    
    // Add category filter if provided (additional filter on top of the base categories)
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
      
      // Get local files from public/hasil_submission/{submissionId}/
      let localFiles: string[] = [];
      if (submission.submissionId) {
        const submissionFolder = path.join(process.cwd(), 'public', 'hasil_submission', submission.submissionId);
        try {
          if (fs.existsSync(submissionFolder)) {
            const files = fs.readdirSync(submissionFolder);
            localFiles = files
              .filter(file => file.endsWith('.pdf')) // Only PDF files
              .map(file => `/hasil_submission/${submission.submissionId}/${file}`);
          }
        } catch (error) {
          console.warn(`Could not read files for submission ${submission.submissionId}:`, error);
        }
      }
      
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
        submissionFile: localFiles[0] || "", // Use first local file or empty string
        submissionFiles: localFiles, // Use local files instead of S3
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