import { NextRequest, NextResponse } from "next/server";
import { getCurrentJudge, getEvaluationMethod } from "@/lib/auth";

// Mock data with evaluated submissions
const mockSelectedSubmissions = [
  {
    id: "m99olqca000jyz3dwokh7ehn",
    title: "Tetap Bergerak menuju arah yang lebih baik",
    description: "Desain bertema \"Movement\" mencerminkan dinamika ini: garis melengkung, pencahayaan yang berubah, dan ruang yang mengalir, menjadi simbol adaptasi dan transformasi. Di saat stagnasi bukan pilihan, ruang ini mengajak kita untuk terus bergerak, berinovasi, dan menemukan harmoni di tengah perubahan. Dalam desain ini, gerak adalah harapan. Refleksi dari dunia yang hidup, tangguh, dan selalu menuju masa depan.",
    status: "SUBMITTED",
    submittedAt: "2025-04-09 08:42:51",
    categoryId: "cm7woadi6000tyzjp90iwliel",
    categoryName: "Interior Design",
    submissionId: "SBM-0700003",
    submissionType: "INDIVIDUAL",
    submissionFile: "https://st01.nos.wjv-1.neo.id/submissionFile/a59cf3ef45479239581f2c64ab3851d9.pdf",
    submissionFiles: [
      "https://st01.nos.wjv-1.neo.id/submissionFile/7795fe0ed55a9eed8952c3810f340022.pdf",
      "https://st01.nos.wjv-1.neo.id/submissionFile/ccb848001f1e8bb510e8f9f91be71031.pdf"
    ],
    evaluated: true,
    comment: "Excellent attention to detail and innovative approach to the theme."
  },
  {
    id: "n72plqca000jyz3dwokh8xyz",
    title: "Urban Flow: Connecting Spaces",
    description: "This design explores the concept of movement through urban landscapes. By creating interconnected spaces that flow seamlessly from public to private realms, the project addresses the need for dynamic yet cohesive environments in modern cities. Materials transition from transparent to opaque, guiding movement while maintaining visual connections.",
    status: "SUBMITTED",
    submittedAt: "2025-04-10 14:23:10",
    categoryId: "cm6v78vcu000ai0hyozdkfukr",
    categoryName: "Architecture",
    submissionId: "SBM-0700004",
    submissionType: "INDIVIDUAL",
    submissionFile: "https://st01.nos.wjv-1.neo.id/submissionFile/a59cf3ef45479239581f2c64ab3851d9.pdf",
    submissionFiles: [
      "https://st01.nos.wjv-1.neo.id/submissionFile/7795fe0ed55a9eed8952c3810f340022.pdf",
      "https://st01.nos.wjv-1.neo.id/submissionFile/ccb848001f1e8bb510e8f9f91be71031.pdf"
    ],
    evaluated: true,
    scores: {
      score1: "9",
      score2: "8",
      score3: "9",
      score4: "10"
    },
    comment: "Outstanding concept and execution. The spatial transitions are particularly noteworthy."
  }
];

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
    
    // Get evaluation method from cookies
    const evaluationMethod = getEvaluationMethod();
    
    if (!evaluationMethod) {
      return NextResponse.json({ 
        success: false, 
        message: "Evaluation method not selected" 
      }, { status: 400 });
    }
    
    // In a real app, you would fetch selected submissions from the database
    // based on the judge's ID
    
    // Return selected submissions
    return NextResponse.json({ 
      success: true, 
      submissions: mockSelectedSubmissions,
      evaluationMethod
    });
    
  } catch (error) {
    console.error("Selected submissions API error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}