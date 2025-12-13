import { GoogleGenAI, Chat } from "@google/genai";
import { Course } from "../types";
import { getCourseProgress } from "../utils/courseUtils";

// Initialize the client
// NOTE: In a real app, ensure process.env.API_KEY is available.
// The runtime environment injects this.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const createLMSChatSession = (
  courses: Course[],
  enrolledCourseIds: string[] = [],
  completedLessons: Record<string, string[]> = {}
): Chat => {
  // Convert course data to a string for the system prompt
  const courseContext = courses.map(c => 
    `- Title: ${c.title}\n  ID: ${c.id}\n  Instructor: ${c.instructor}\n  Category: ${c.category}\n  Level: ${c.level}\n  Description: ${c.description}\n  Tags: ${c.tags?.join(', ') || 'General'}\n`
  ).join('\n');

  // Build Student Context
  let studentContext = "User Status: Guest (Not logged in or no enrollments).";
  if (enrolledCourseIds.length > 0) {
      const progressDetails = enrolledCourseIds.map(id => {
          const c = courses.find(course => course.id === id);
          if (!c) return null;
          const { percentage } = getCourseProgress(c.id, c.modules, completedLessons[c.id] || []);
          return `  * ${c.title}: ${percentage}% Complete`;
      }).filter(Boolean).join('\n');
      
      studentContext = `User Status: Student.\nEnrolled Courses:\n${progressDetails}`;
  }

  const systemInstruction = `
    You are "Konseye Lekol Alèz", an intelligent AI assistant for the 'Lekol Alèz' Learning Management System.
    
    YOUR LANGUAGE SKILLS:
    - You MUST be able to speak fluent English, French, and Haitian Creole (Kreyòl Ayisyen).
    - Detect the user's language and reply in the same language.
    - If the user switches languages, switch with them immediately.
    
    YOUR ROLE:
    - Help students find courses based on their interests.
    - Provide personalized recommendations based on their current enrollments and progress.
    - Suggest "Next Steps" if a student is stuck or has finished a course.
    - Answer questions about the platform (quizzes, modules, instructors).
    - Be encouraging, polite, and educational.
    
    STUDENT CONTEXT:
    ${studentContext}

    AVAILABLE COURSES DATA:
    ${courseContext}
    
    GUIDELINES:
    1. RECOMMENDATIONS:
       - If the student is enrolled in courses, use their progress to suggest specific "next steps" (e.g., "Keep going with React, you are 50% there!").
       - If they finished a course (100%), suggest "related courses" based on matching Category or Tags (e.g., "Since you finished HTML, try CSS").
       - If they are a Guest, ask about their interests to recommend the best starter course.
    2. TONE:
       - Friendly, professional, and culturally aware of Haitian context if addressing in Creole.
       - Keep answers concise.
    3. GENERAL:
       - If asked about "Lekol Alèz", mention it means "School at Ease" or learning comfortably.
       - Use emojis occasionally.
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7,
    },
  });
};