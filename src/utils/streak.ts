export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastPracticedDate: string; // YYYY-MM-DD
  historyDates: string[]; // List of dates in YYYY-MM-DD
  totalPracticeDays: number;
  streakMilestonesClaimed: number[];
}

const STORAGE_KEY_STREAK = 'math_studio_student_streak_v1';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const yesterday = new Date(Date.now() - 86400000);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadStreakData(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STREAK);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }

  const today = getTodayDateString();
  return {
    currentStreak: 1,
    bestStreak: 1,
    lastPracticedDate: today,
    historyDates: [today],
    totalPracticeDays: 1,
    streakMilestonesClaimed: [],
  };
}

export function recordActivityPractice(): { streak: StreakData; isNewDay: boolean; milestoneReached?: number } {
  const current = loadStreakData();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  let isNewDay = false;
  let milestoneReached: number | undefined = undefined;

  if (current.lastPracticedDate === today) {
    // Already recorded today, maintain streak
    return { streak: current, isNewDay: false };
  } else if (current.lastPracticedDate === yesterday) {
    // Continued from yesterday! Increment streak
    isNewDay = true;
    current.currentStreak += 1;
    if (current.currentStreak > current.bestStreak) {
      current.bestStreak = current.currentStreak;
    }
    current.lastPracticedDate = today;
    if (!current.historyDates.includes(today)) {
      current.historyDates.push(today);
    }
    current.totalPracticeDays += 1;

    // Check milestones: 3, 7, 14, 30
    const milestones = [3, 7, 14, 30, 50, 100];
    for (const m of milestones) {
      if (current.currentStreak >= m && !current.streakMilestonesClaimed.includes(m)) {
        current.streakMilestonesClaimed.push(m);
        milestoneReached = m;
        break;
      }
    }
  } else {
    // Missed one or more days, reset streak to 1
    isNewDay = true;
    current.currentStreak = 1;
    current.lastPracticedDate = today;
    if (!current.historyDates.includes(today)) {
      current.historyDates.push(today);
    }
    current.totalPracticeDays += 1;
  }

  try {
    localStorage.setItem(STORAGE_KEY_STREAK, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to save streak to localStorage:', e);
  }

  return { streak: current, isNewDay, milestoneReached };
}
