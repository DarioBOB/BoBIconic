export interface Game {
  id: string;
  name: string;
  description: string;
  category: GameCategory;
  difficulty: GameDifficulty;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: number; // en minutes
  icon: string;
  isActive: boolean;
  rules: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GameSession {
  id: string;
  gameId: string;
  players: GamePlayer[];
  status: GameSessionStatus;
  startTime: Date;
  endTime?: Date;
  scores: GameScore[];
  currentRound: number;
  totalRounds: number;
  settings: GameSettings;
  chat: GameChatMessage[];
}

export interface GamePlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: Date;
  score: number;
  rank: number;
}

export interface GameScore {
  playerId: string;
  round: number;
  score: number;
  bonus: number;
  total: number;
  timestamp: Date;
}

export interface GameSettings {
  timeLimit?: number; // en secondes
  rounds: number;
  difficulty: GameDifficulty;
  customRules?: string[];
}

export interface GameChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'game_action' | 'system';
}

export interface GameLeaderboard {
  gameId: string;
  entries: GameLeaderboardEntry[];
  lastUpdated: Date;
}

export interface GameLeaderboardEntry {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  score: number;
  gamesPlayed: number;
  wins: number;
  rank: number;
  lastPlayed: Date;
}

export interface GameAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: GameCategory;
  requirement: string;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

export interface GameStatistics {
  totalGamesPlayed: number;
  totalTimePlayed: number; // en minutes
  favoriteGame: string;
  bestScore: number;
  achievements: GameAchievement[];
  winRate: number;
  averageScore: number;
}

// Types spécifiques pour différents jeux
export interface WordGameData {
  currentWord: string;
  hints: string[];
  usedLetters: string[];
  remainingAttempts: number;
  category: string;
}

export interface TriviaGameData {
  currentQuestion: Question;
  answeredQuestions: string[];
  correctAnswers: number;
  totalQuestions: number;
}

export interface PuzzleGameData {
  currentPuzzle: Puzzle;
  moves: number;
  timeElapsed: number;
  hintsUsed: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: GameDifficulty;
  explanation?: string;
}

export interface Puzzle {
  id: string;
  type: 'sliding' | 'pattern' | 'logic' | 'memory';
  data: any;
  solution: any;
  difficulty: GameDifficulty;
  hints: string[];
}

// Enums
export enum GameCategory {
  WORD = 'word',
  TRIVIA = 'trivia',
  PUZZLE = 'puzzle',
  STRATEGY = 'strategy',
  REACTION = 'reaction',
  MEMORY = 'memory',
  QUIZ = 'quiz',
  RIDDLE = 'riddle'
}

export enum GameDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

export enum GameSessionStatus {
  WAITING = 'waiting',
  STARTING = 'starting',
  ACTIVE = 'active',
  PAUSED = 'paused',
  FINISHED = 'finished',
  CANCELLED = 'cancelled'
}

// Types pour les jeux spécifiques
export interface WordGame extends Game {
  category: GameCategory.WORD;
  wordLists: string[];
  categories: string[];
  maxAttempts: number;
}

export interface TriviaGame extends Game {
  category: GameCategory.TRIVIA;
  questions: Question[];
  categories: string[];
  timePerQuestion: number;
}

export interface PuzzleGame extends Game {
  category: GameCategory.PUZZLE;
  puzzles: Puzzle[];
  puzzleTypes: string[];
  maxHints: number;
} 