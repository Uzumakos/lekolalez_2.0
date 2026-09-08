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

/**
 * Calculates a sorting rank for a course based on its title and grade level.
 * Guarantees standard Haitian curriculum order:
 * 1ère AF (rank 10) -> 2ème AF (rank 20) -> 3ème AF (rank 30) ... -> 9ème AF (rank 90)
 * Followed by Secondary cycle: NS1 (110) -> NS2 (120) -> NS3 (130) -> NS4 (140)
 * Other courses receive a base rank of 1000 and are sorted chronologically.
 */
export const getCourseSortRank = (course: { title?: string; level?: string }): number => {
  const title = (course.title || '').trim().toLowerCase();
  const level = (course.level || '').trim().toLowerCase();

  // Pattern 1: numbers followed by optional suffix and 'af' / 'année fondamentale' (e.g. "1ère af", "2ème af", "1 af", "2e annee fondamentale")
  const afRegex = /(?:^|\b)(\d+)\s*(?:[eèé]re?|[eèé]me?|i[eèé]me?|e|er|nd|eme|ème)?\s*(?:af\b|ann[eé]e\s*fondamentale|\baf\b)/i;
  // Pattern 2: "af 1", "af 2"
  const afPrefixRegex = /\baf\s*(\d+)\b/i;
  // Pattern 3: Starts with a number + ordinal (e.g. "1ère", "2ème", "1er", "2nd")
  const startOrdinalRegex = /^(\d+)\s*(?:[eèé]re?|[eèé]me?|i[eèé]me?|e|er|nd)\b/i;

  const match = title.match(afRegex) || level.match(afRegex) || title.match(afPrefixRegex) || title.match(startOrdinalRegex);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num >= 1 && num <= 20) {
      return num * 10;
    }
  }

  // Word-based fundamental levels:
  if (/premi[eè]re\s+ann[eé]e\s+fondamentale/i.test(title)) return 10;
  if (/deuxi[eè]me\s+ann[eé]e\s+fondamentale/i.test(title)) return 20;
  if (/troisi[eè]me\s+ann[eé]e\s+fondamentale/i.test(title)) return 30;
  if (/quatri[eè]me\s+ann[eé]e\s+fondamentale/i.test(title)) return 40;
  if (/cinqui[eè]me\s+ann[eé]e\s+fondamentale/i.test(title)) return 50;
  if (/sixi[eè]me\s+ann[eé]e\s+fondamentale/i.test(title)) return 60;
  if (/septi[eè]me\s+ann[eé]e\s+fondamentale/i.test(title)) return 70;
  if (/huiti[eè]me\s+ann[eé]e\s+fondamentale/i.test(title)) return 80;
  if (/neuvi[eè]me\s+ann[eé]e\s+fondamentale/i.test(title)) return 90;

  // Secondary cycle: NS1 to NS4 / Seconde to Philo
  const nsMatch = title.match(/\bns\s*(\d+)\b/i) || title.match(/nouveau\s*secondaire\s*(\d+)\b/i);
  if (nsMatch) {
    const num = parseInt(nsMatch[1], 10);
    if (!isNaN(num)) return 100 + num * 10;
  }
  if (/\bseconde\b/i.test(title)) return 110;
  if (/\brh[eé]to\b/i.test(title)) return 130;
  if (/\bphilo\b/i.test(title)) return 140;

  // Fallback rank for custom or non-academic courses
  return 1000;
};

/**
 * Sorts courses in logical academic sequence:
 * 1. 1ère AF first, then 2ème AF, 3ème AF, 4ème AF...
 * 2. Secondary classes (NS1, NS2, etc.)
 * 3. Other courses follow chronologically (oldest first) so newly added courses appear in sequence
 * 4. Fallback to natural alphabetical sort
 */
export const sortCourses = <T extends { title?: string; level?: string; createdAt?: string; created_at?: string }>(courses: T[]): T[] => {
  if (!Array.isArray(courses)) return [];

  return [...courses].sort((a, b) => {
    const rankA = getCourseSortRank(a);
    const rankB = getCourseSortRank(b);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // If same rank, maintain chronological creation order (oldest first, so newly added courses follow previous ones)
    const dateA = a.createdAt || (a as any).created_at;
    const dateB = b.createdAt || (b as any).created_at;
    if (dateA && dateB) {
      const timeA = new Date(dateA).getTime();
      const timeB = new Date(dateB).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeA - timeB;
      }
    }

    // Fallback: natural locale compare (handles numbers properly, e.g. "Part 1" before "Part 2")
    const titleA = a.title || '';
    const titleB = b.title || '';
    return titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: 'base' });
  });
};
