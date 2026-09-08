import { Module, Lesson, Trimester } from '../types';

/**
 * Extracts all lessons from a module, regardless of whether they are structured in
 * trimesters or in a flat legacy lessons array.
 */
export const getModuleLessons = (module: Module): Lesson[] => {
  if (module.trimesters && module.trimesters.length > 0) {
    return module.trimesters.flatMap(t => t.lessons || []);
  }
  return module.lessons || [];
};

/**
 * Normalizes a module ensuring it always has a valid `trimesters` array.
 * Converts legacy flat `lessons` into an initial Trimester container without data loss.
 */
export const normalizeModule = (module: Module, moduleIndex: number = 0): Module => {
  if (module.trimesters && module.trimesters.length > 0) {
    return module;
  }

  const legacyLessons = module.lessons || [];
  return {
    ...module,
    trimesters: [
      {
        id: `t-${module.id || Math.random().toString(36).substr(2, 9)}-1`,
        title: 'Trimester 1: Core Curriculum',
        isFree: moduleIndex === 0, // By default, first module's trimester is a free preview
        lessons: legacyLessons,
        order: 0,
      }
    ],
    lessons: legacyLessons,
  };
};

export const generateCourseContent = (courseId: string, moduleCount: number): Module[] => {
  return Array.from({ length: moduleCount }).map((_, i) => {
    const moduleId = `m-${courseId}-${i + 1}`;
    const trimesters: Trimester[] = [
      {
        id: `t-${moduleId}-1`,
        title: 'Trimester 1: Fundamentals & Core Concepts',
        description: 'Foundational lessons and preliminary knowledge.',
        isFree: i === 0, // First trimester of first module is Free Preview
        order: 0,
        lessons: [
          {
            id: `l-${courseId}-${i + 1}-1-1`,
            title: 'Video Lecture: Key Concepts & Overview',
            duration: '15:00',
            type: 'video',
            description: 'Fundamental principles, history, and basic setup required to get started.',
          },
          {
            id: `l-${courseId}-${i + 1}-1-2`,
            title: 'Reading: Primary Study Guide',
            duration: '10:00',
            type: 'reading',
            description: 'Detailed documentation covering core principles and reference materials.',
          },
        ],
      },
      {
        id: `t-${moduleId}-2`,
        title: 'Trimester 2: Advanced Techniques & Application',
        description: 'In-depth exercises, advanced methodologies, and assessments.',
        isFree: false, // Requires paid subscription
        order: 1,
        lessons: [
          {
            id: `l-${courseId}-${i + 1}-2-1`,
            title: 'Video Lecture: Deep Dive & Real-World Use Cases',
            duration: '25:00',
            type: 'video',
            description: 'Advanced walkthroughs and architectural best practices.',
          },
          {
            id: `l-${courseId}-${i + 1}-2-2`,
            title: 'Quiz: Term Mastery Check',
            duration: '10:00',
            type: 'quiz',
            description: 'Comprehensive knowledge check for this trimester.',
          },
        ],
      },
    ];

    return {
      id: moduleId,
      title: `Module ${i + 1}: ${['Introduction & Setup', 'Core Concepts', 'Advanced Techniques', 'Practical Application', 'Final Project'][i % 5]}`,
      trimesters,
      lessons: trimesters.flatMap(t => t.lessons),
    };
  });
};

export const getCourseProgress = (courseId: string, moduleCount: number, completedLessonIds: string[] = []) => {
  // Based on the generator above, each module has 4 lessons (2 per trimester)
  const totalLessons = moduleCount * 4;
  if (totalLessons === 0) return { completed: 0, total: 0, percentage: 0 };

  const count = completedLessonIds.length;

  return {
    completed: count,
    total: totalLessons,
    percentage: Math.round((count / totalLessons) * 100),
  };
};
