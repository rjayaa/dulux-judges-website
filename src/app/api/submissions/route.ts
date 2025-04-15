import { NextRequest, NextResponse } from "next/server";
import { getCurrentJudge } from "@/lib/auth";

// Mock data for submissions
const mockSubmissions = [
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
      "https://st01.nos.wjv-1.neo.id/submissionFile/ccb848001f1e8bb510e8f9f91be71031.pdf",
      "https://st01.nos.wjv-1.neo.id/submissionFile/b50cc1147c81790f1ca9ad87e6e5f18d.pdf",
      "https://st01.nos.wjv-1.neo.id/submissionFile/7d7b2a0fcd6058d46695023b4ce4a7ab.pdf",
      "https://st01.nos.wjv-1.neo.id/submissionFile/33a9227ad06c95893962409278d5439d.pdf"
    ]
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
    ]
  },
  {
    id: "k45plqca000jyz3dwokh8abc",
    title: "Fluid Forms: Product Design Evolution",
    description: "Inspired by natural water movements, this product design series showcases how everyday objects can embody the grace of flowing water. Each piece transforms from static to dynamic through user interaction, creating an evolving experience that adapts to human behavior and needs.",
    status: "SUBMITTED",
    submittedAt: "2025-04-11 09:15:22",
    categoryId: "cm7woc3qw000uyzjpvbv4gy2x",
    categoryName: "Product Design",
    submissionId: "SBM-0700005",
    submissionType: "INDIVIDUAL",
    submissionFile: "https://st01.nos.wjv-1.neo.id/submissionFile/a59cf3ef45479239581f2c64ab3851d9.pdf",
    submissionFiles: [
      "https://st01.nos.wjv-1.neo.id/submissionFile/7795fe0ed55a9eed8952c3810f340022.pdf",
      "https://st01.nos.wjv-1.neo.id/submissionFile/ccb848001f1e8bb510e8f9f91be71031.pdf",
      "https://st01.nos.wjv-1.neo.id/submissionFile/b50cc1147c81790f1ca9ad87e6e5f18d.pdf"
    ]
  }
];

// Mock categories
const mockCategories = [
  { id: "cm7woadi6000tyzjp90iwliel", name: "Interior Design" },
  { id: "cm6v78vcu000ai0hyozdkfukr", name: "Architecture" },
  { id: "cm7woc3qw000uyzjpvbv4gy2x", name: "Product Design" },
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
    
    // Get query parameters
    const { searchParams } = request.nextUrl;
    const categoryId = searchParams.get("categoryId");
    
    // Filter submissions by category if provided
    let submissions = [...mockSubmissions];
    
    if (categoryId && categoryId !== "all") {
      submissions = submissions.filter(sub => sub.categoryId === categoryId);
    }
    
    // Return submissions with categories
    return NextResponse.json({ 
      success: true, 
      submissions,
      categories: mockCategories
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
      // In a real app, save the evaluation to database
      // For now, just return success
      
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