// import { cookies } from "next/headers";
// import pool from "./db";

// type Judge = {
//   id: string;
//   name: string;
//   evaluationMethod?: "checkbox" | "scoring" | null;
// };

// /**
//  * Authenticate a judge with their PIN
//  * @param pin Six-digit PIN code
//  * @returns Judge object if authenticated, null otherwise
//  */
// export async function authenticateJudge(pin: string): Promise<Judge | null> {
//   try {
//     // Query the dedicated Jury table including evaluationMethod
//     const [rows] = await pool.query(
//       `SELECT id, fullName, evaluationMethod FROM Jury WHERE pin = ? AND isActive = 1`,
//       [pin]
//     );
    
//     const judges = rows as any[];
    
//     if (judges.length > 0) {
//       const judge = judges[0];
      
//       const cookieStore = cookies();
      
//       cookieStore.set("judge_session", JSON.stringify({
//         id: judge.id,
//         name: judge.fullName,
//         authenticated: true,
//         timestamp: Date.now()
//       }), {
//         path: "/",
//         maxAge: 60 * 60 * 24, // 1 day
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict"
//       });
      
//       // If judge already has an evaluation method set, store it in cookies too
//       if (judge.evaluationMethod) {
//         cookieStore.set("evaluation_method", judge.evaluationMethod, {
//           path: "/",
//           maxAge: 60 * 60 * 24, // 1 day
//           httpOnly: true,
//           secure: process.env.NODE_ENV === "production",
//           sameSite: "strict"
//         });
//       }
      
//       return {
//         id: judge.id,
//         name: judge.fullName,
//         evaluationMethod: judge.evaluationMethod || null
//       };
//     }
    
//     return null;
//   } catch (error) {
//     console.error("Authentication error:", error);
//     return null;
//   }
// }

// /**
//  * Set the evaluation method chosen by the judge
//  * @param method "checkbox" or "scoring"
//  * @param judgeId The ID of the judge
//  */
// export async function setEvaluationMethod(method: "checkbox" | "scoring", judgeId?: string): Promise<boolean> {
//   try {
//     const cookieStore = cookies();
    
//     // Set the cookie regardless of database update
//     cookieStore.set("evaluation_method", method, {
//       path: "/",
//       maxAge: 60 * 60 * 24, // 1 day
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict"
//     });
    
//     // If no judgeId provided, try to get from session
//     if (!judgeId) {
//       const judge = getCurrentJudge();
//       if (!judge) return false;
//       judgeId = judge.id;
//     }
    
//     // First check if the judge already has an evaluation method set
//     const [existingRows] = await pool.query(
//       `SELECT evaluationMethod FROM Jury WHERE id = ?`,
//       [judgeId]
//     );
    
//     const judges = existingRows as any[];
    
//     // If judge already has a method set, don't update it
//     if (judges.length > 0 && judges[0].evaluationMethod) {
//       return true; // Return true because we're using the existing method
//     }
    
//     // Update the judge's evaluation method in the database
//     await pool.query(
//       `UPDATE Jury SET evaluationMethod = ? WHERE id = ?`,
//       [method, judgeId]
//     );
    
//     return true;
//   } catch (error) {
//     console.error("Error setting evaluation method:", error);
//     return false;
//   }
// }

// /**
//  * Get current judge information from session
//  * @returns Judge information or null if not authenticated
//  */
// export function getCurrentJudge(): Judge | null {
//   const cookieStore = cookies();
//   const sessionCookie = cookieStore.get("judge_session");
  
//   if (!sessionCookie) return null;
  
//   try {
//     const session = JSON.parse(sessionCookie.value);
//     if (session && session.authenticated) {
//       return {
//         id: session.id,
//         name: session.name
//       };
//     }
//   } catch (e) {
//     return null;
//   }
  
//   return null;
// }

// /**
//  * Get the judge's evaluation method directly from the database
//  * @param judgeId The ID of the judge
//  * @returns "checkbox" or "scoring" or null if not set
//  */
// export async function getJudgeEvaluationMethodFromDB(judgeId: string): Promise<"checkbox" | "scoring" | null> {
//   try {
//     const [rows] = await pool.query(
//       `SELECT evaluationMethod FROM Jury WHERE id = ?`,
//       [judgeId]
//     );
    
//     const judges = rows as any[];
    
//     if (judges.length > 0 && judges[0].evaluationMethod) {
//       const method = judges[0].evaluationMethod;
//       if (method === "checkbox" || method === "scoring") {
//         return method;
//       }
//     }
    
//     return null;
//   } catch (error) {
//     console.error("Error getting evaluation method:", error);
//     return null;
//   }
// }

// /**
//  * Get the evaluation method chosen by the judge
//  * @returns "checkbox" or "scoring" or null if not set
//  */
// export function getEvaluationMethod(): "checkbox" | "scoring" | null {
//   const cookieStore = cookies();
//   const methodCookie = cookieStore.get("evaluation_method");
  
//   if (!methodCookie) return null;
  
//   const method = methodCookie.value;
//   if (method === "checkbox" || method === "scoring") {
//     return method;
//   }
  
//   return null;
// }

// /**
//  * Log out the current judge
//  */
// export function logoutJudge(): void {
//   const cookieStore = cookies();
  
//   cookieStore.delete("judge_session");
//   cookieStore.delete("evaluation_method");
// }

// src/lib/auth.ts
import { cookies } from "next/headers";
import pool from "./db";

type Judge = {
  id: string;
  name: string;
  evaluationMethod?: "checkbox" | "scoring" | null;
  isAdmin?: boolean;
};

// Admin ID constant
const ADMIN_ID = "00832";

/**
 * Authenticate a judge with their PIN
 * @param pin Six-digit PIN code
 * @returns Judge object if authenticated, null otherwise
 */
export async function authenticateJudge(pin: string): Promise<Judge | null> {
  try {
    // Query the dedicated Jury table including evaluationMethod
    const [rows] = await pool.query(
      `SELECT id, fullName, evaluationMethod FROM Jury WHERE pin = ? AND isActive = 1`,
      [pin]
    );
    
    const judges = rows as any[];
    
    if (judges.length > 0) {
      const judge = judges[0];
      
      // Check if this is the admin account
      const isAdmin = judge.id === ADMIN_ID;
      
      const cookieStore = cookies();
      
      cookieStore.set("judge_session", JSON.stringify({
        id: judge.id,
        name: judge.fullName,
        authenticated: true,
        isAdmin: isAdmin,
        timestamp: Date.now()
      }), {
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      });
      
      // If judge already has an evaluation method set, store it in cookies too
      if (judge.evaluationMethod) {
        cookieStore.set("evaluation_method", judge.evaluationMethod, {
          path: "/",
          maxAge: 60 * 60 * 24, // 1 day
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict"
        });
      }
      
      return {
        id: judge.id,
        name: judge.fullName,
        evaluationMethod: judge.evaluationMethod || null,
        isAdmin: isAdmin
      };
    }
    
    return null;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

/**
 * Set the evaluation method chosen by the judge
 * @param method "checkbox" or "scoring"
 * @param judgeId The ID of the judge
 */
export async function setEvaluationMethod(method: "checkbox" | "scoring", judgeId?: string): Promise<boolean> {
  try {
    const cookieStore = cookies();
    
    // Set the cookie regardless of database update
    cookieStore.set("evaluation_method", method, {
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    
    // If no judgeId provided, try to get from session
    if (!judgeId) {
      const judge = getCurrentJudge();
      if (!judge) return false;
      judgeId = judge.id;
    }
    
    // First check if the judge already has an evaluation method set
    const [existingRows] = await pool.query(
      `SELECT evaluationMethod FROM Jury WHERE id = ?`,
      [judgeId]
    );
    
    const judges = existingRows as any[];
    
    // If judge already has a method set, don't update it
    if (judges.length > 0 && judges[0].evaluationMethod) {
      return true; // Return true because we're using the existing method
    }
    
    // Update the judge's evaluation method in the database
    await pool.query(
      `UPDATE Jury SET evaluationMethod = ? WHERE id = ?`,
      [method, judgeId]
    );
    
    return true;
  } catch (error) {
    console.error("Error setting evaluation method:", error);
    return false;
  }
}

/**
 * Get current judge information from session
 * @returns Judge information or null if not authenticated
 */
export function getCurrentJudge(): Judge | null {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("judge_session");
  
  if (!sessionCookie) return null;
  
  try {
    const session = JSON.parse(sessionCookie.value);
    if (session && session.authenticated) {
      return {
        id: session.id,
        name: session.name,
        isAdmin: session.isAdmin || false
      };
    }
  } catch (e) {
    return null;
  }
  
  return null;
}

/**
 * Check if the current user is an admin
 * @returns True if the user is an admin, false otherwise
 */
export function isAdmin(): boolean {
  const judge = getCurrentJudge();
  return judge?.isAdmin === true;
}

/**
 * Get the judge's evaluation method directly from the database
 * @param judgeId The ID of the judge
 * @returns "checkbox" or "scoring" or null if not set
 */
export async function getJudgeEvaluationMethodFromDB(judgeId: string): Promise<"checkbox" | "scoring" | null> {
  try {
    const [rows] = await pool.query(
      `SELECT evaluationMethod FROM Jury WHERE id = ?`,
      [judgeId]
    );
    
    const judges = rows as any[];
    
    if (judges.length > 0 && judges[0].evaluationMethod) {
      const method = judges[0].evaluationMethod;
      if (method === "checkbox" || method === "scoring") {
        return method;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting evaluation method:", error);
    return null;
  }
}

/**
 * Get the evaluation method chosen by the judge
 * @returns "checkbox" or "scoring" or null if not set
 */
export function getEvaluationMethod(): "checkbox" | "scoring" | null {
  const cookieStore = cookies();
  const methodCookie = cookieStore.get("evaluation_method");
  
  if (!methodCookie) return null;
  
  const method = methodCookie.value;
  if (method === "checkbox" || method === "scoring") {
    return method;
  }
  
  return null;
}

/**
 * Log out the current judge
 */
export function logoutJudge(): void {
  const cookieStore = cookies();
  
  cookieStore.delete("judge_session");
  cookieStore.delete("evaluation_method");
}