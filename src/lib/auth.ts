import { cookies } from "next/headers";

// In a real application, this would connect to your database
// This is a simple mock implementation for demonstration purposes

// Example predefined PINs for judges
const JUDGE_PINS = {
  "123456": { id: "j1", name: "Judge One" },
  "654321": { id: "j2", name: "Judge Two" },
  "111111": { id: "j3", name: "Judge Three" },
};

type Judge = {
  id: string;
  name: string;
};

/**
 * Authenticate a judge with their PIN
 * @param pin Six-digit PIN code
 * @returns Judge object if authenticated, null otherwise
 */
export async function authenticateJudge(pin: string): Promise<Judge | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if PIN exists in our mock database
  if (pin in JUDGE_PINS) {
    const judge = JUDGE_PINS[pin as keyof typeof JUDGE_PINS];
    
    // In a real app, you'd set a secure HTTP-only cookie with proper expiration
    // For demo purposes, we'll just set a simple cookie
    const cookieStore = cookies();
    
    // Set a cookie with judge info (in a real app, use JWT or session ID)
    cookieStore.set("judge_session", JSON.stringify({
      id: judge.id,
      name: judge.name,
      authenticated: true,
      timestamp: Date.now()
    }), {
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    
    return judge;
  }
  
  return null;
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