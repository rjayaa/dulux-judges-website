import { cookies } from "next/headers";
import pool from "./db";


type Judge = {
  id: string;
  name: string;
};

/**
 * Authenticate a judge with their PIN
 * @param pin Six-digit PIN code
 * @returns Judge object if authenticated, null otherwise
 */
/**
 * Authenticate a judge with their PIN
 * @param pin Six-digit PIN code
 * @returns Judge object if authenticated, null otherwise
 */
// Update the authenticateJudge function to use the new Jury table
export async function authenticateJudge(pin: string): Promise<Judge | null> {
  try {
    // Query the dedicated Jury table instead of User table
    const [rows] = await pool.query(
      `SELECT id, fullName FROM Jury WHERE pin = ? AND isActive = 1`,
      [pin]
    );
    
    const judges = rows as any[];
    
    if (judges.length > 0) {
      const judge = judges[0];
      
      const cookieStore = cookies();
      
      cookieStore.set("judge_session", JSON.stringify({
        id: judge.id,
        name: judge.fullName,
        authenticated: true,
        timestamp: Date.now()
      }), {
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      });
      
      return {
        id: judge.id,
        name: judge.fullName
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
 */
export function setEvaluationMethod(method: "checkbox" | "scoring"): void {
  const cookieStore = cookies();
  
  cookieStore.set("evaluation_method", method, {
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });
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
        name: session.name
      };
    }
  } catch (e) {
    return null;
  }
  
  return null;
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