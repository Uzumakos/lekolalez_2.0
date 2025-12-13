import { Module } from '../types';

export const generateCourseContent = (courseId: string, moduleCount: number): Module[] => {
  return Array.from({ length: moduleCount }).map((_, i) => ({
    id: `m-${courseId}-${i + 1}`,
    title: `Module ${i + 1}: ${['Introduction & Setup', 'Core Concepts', 'Advanced Techniques', 'Practical Application', 'Final Project'][i % 5]}`,
    lessons: [
      { 
        id: `l-${courseId}-${i + 1}-1`, 
        title: 'Video Lecture: Key Concepts', 
        duration: '15:00', 
        type: 'video',
        description: 'In this lecture, we explore the fundamental principles that drive this topic. We will cover the history, key terminology, and basic setup required to get started.'
      },
      { 
        id: `l-${courseId}-${i + 1}-2`, 
        title: 'Reading: Study Materials', 
        duration: '10:00', 
        type: 'reading',
        description: 'Please read through the attached PDF documentation which covers the lecture notes in detail. Pay special attention to chapter 3.'
      },
      { 
        id: `l-${courseId}-${i + 1}-3`, 
        title: 'Quiz: Knowledge Check', 
        duration: '5:00', 
        type: 'quiz',
        description: 'Test your understanding of the module concepts with this 5-question quiz. You need 80% to pass.'
      },
    ]
  }));
};

export const getCourseProgress = (courseId: string, moduleCount: number, completedLessonIds: string[] = []) => {
    // Based on the generator above, each module has 3 lessons
    const totalLessons = moduleCount * 3; 
    if (totalLessons === 0) return { completed: 0, total: 0, percentage: 0 };
    
    // Filter completed lessons to ensure they belong to this course (simple check based on ID convention or just trust the passed array)
    const count = completedLessonIds.length;
    
    return {
        completed: count,
        total: totalLessons,
        percentage: Math.round((count / totalLessons) * 100)
    };
};
