export interface Game {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  imageUrl: string;
}

export interface GameSession {
  id: string;
  gameId: string;
  score: number;
  date: Date;
  duration: number;
}

export interface GameStatistics {
  totalSessions: number;
  averageScore: number;
  bestScore: number;
  favoriteGame: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  isUnlocked: boolean;
  icon: string;
} 