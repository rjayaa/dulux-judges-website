// src/app/api/auth/profile/route.ts
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
    
    // Fetch judge details from the database
    const [judges] = await pool.query(
      `SELECT id, fullName, evaluationMethod FROM Jury WHERE id = ?`,
      [judge.id]
    );
    
    const judgeDetails = (judges as any[])[0];
    
    if (!judgeDetails) {
      return NextResponse.json({ 
        success: false, 
        message: "Judge not found" 
      }, { status: 404 });
    }
    
    // Return judge information
    return NextResponse.json({ 
      success: true, 
      judge: {
        id: judgeDetails.id,
        fullName: judgeDetails.fullName,
        evaluationMethod: judgeDetails.evaluationMethod
      }
    });
    
  } catch (error) {
    console.error("Profile API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}