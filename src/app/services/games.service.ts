import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { 
  Game, 
  GameSession, 
  GamePlayer, 
  GameScore, 
  GameSettings, 
  GameLeaderboard,
  GameAchievement,
  GameStatistics,
  GameCategory,
  GameDifficulty,
  GameSessionStatus,
  Question,
  Puzzle
} from '../models/game.interface';

@Injectable({
  providedIn: 'root'
})
export class GamesService {
  private gamesSubject = new BehaviorSubject<Game[]>([]);
  private activeSessionsSubject = new BehaviorSubject<GameSession[]>([]);
  private leaderboardsSubject = new BehaviorSubject<Map<string, GameLeaderboard>>(new Map());
  private achievementsSubject = new BehaviorSubject<GameAchievement[]>([]);
  private statisticsSubject = new BehaviorSubject<GameStatistics | null>(null);

  public games$ = this.gamesSubject.asObservable();
  public activeSessions$ = this.activeSessionsSubject.asObservable();
  public leaderboards$ = this.leaderboardsSubject.asObservable();
  public achievements$ = this.achievementsSubject.asObservable();
  public statistics$ = this.statisticsSubject.asObservable();

  constructor() {
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Créer les jeux de démo
    const demoGames: Game[] = [
      {
        id: 'word-hangman',
        name: 'Pendu Aérien',
        description: 'Devinez le mot lié à l\'aviation avant que l\'avion ne s\'écrase !',
        category: GameCategory.WORD,
        difficulty: GameDifficulty.MEDIUM,
        minPlayers: 1,
        maxPlayers: 4,
        estimatedDuration: 10,
        icon: 'airplane',
        isActive: true,
        rules: [
          'Un mot lié à l\'aviation est choisi',
          'Devinez les lettres une par une',
          '6 tentatives maximum avant la défaite',
          'Bonus pour les mots longs'
        ],
        tags: ['aviation', 'mots', 'devinez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'trivia-aviation',
        name: 'Quiz Aviation',
        description: 'Testez vos connaissances sur l\'aviation et les voyages !',
        category: GameCategory.TRIVIA,
        difficulty: GameDifficulty.MEDIUM,
        minPlayers: 1,
        maxPlayers: 6,
        estimatedDuration: 15,
        icon: 'help-circle',
        isActive: true,
        rules: [
          'Questions à choix multiples',
          '30 secondes par question',
          'Points selon la difficulté',
          'Bonus pour les réponses rapides'
        ],
        tags: ['quiz', 'aviation', 'connaissances'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'puzzle-flight',
        name: 'Puzzle de Vol',
        description: 'Résolvez des énigmes logiques liées aux voyages !',
        category: GameCategory.PUZZLE,
        difficulty: GameDifficulty.HARD,
        minPlayers: 1,
        maxPlayers: 2,
        estimatedDuration: 20,
        icon: 'puzzle',
        isActive: true,
        rules: [
          'Puzzles de logique',
          'Temps limité',
          'Indices disponibles',
          'Score basé sur le temps et les indices'
        ],
        tags: ['puzzle', 'logique', 'énigmes'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'memory-destinations',
        name: 'Mémoire des Destinations',
        description: 'Retrouvez les paires de destinations et monuments !',
        category: GameCategory.MEMORY,
        difficulty: GameDifficulty.EASY,
        minPlayers: 1,
        maxPlayers: 4,
        estimatedDuration: 8,
        icon: 'images',
        isActive: true,
        rules: [
          'Retrouvez les paires identiques',
          'Temps limité',
          'Moins de coups = plus de points',
          'Thème des destinations'
        ],
        tags: ['mémoire', 'destinations', 'images'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'riddle-travel',
        name: 'Énigmes de Voyage',
        description: 'Résolvez des énigmes intelligentes sur les voyages !',
        category: GameCategory.RIDDLE,
        difficulty: GameDifficulty.HARD,
        minPlayers: 1,
        maxPlayers: 3,
        estimatedDuration: 12,
        icon: 'bulb',
        isActive: true,
        rules: [
          'Énigmes de logique',
          'Indices progressifs',
          'Points selon la rapidité',
          'Thème voyage et aviation'
        ],
        tags: ['énigmes', 'logique', 'voyage'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.gamesSubject.next(demoGames);

    // Créer des sessions de démo
    this.createDemoSessions();

    // Créer des classements de démo
    this.createDemoLeaderboards();

    // Créer des achievements de démo
    this.createDemoAchievements();

    // Créer des statistiques de démo
    this.createDemoStatistics();
  }

  private createDemoSessions() {
    const demoPlayers: GamePlayer[] = [
      {
        id: 'player-1',
        name: 'Marie Dubois',
        avatar: 'assets/avatars/avatar-1.jpg',
        isHost: true,
        isReady: true,
        joinedAt: new Date(),
        score: 0,
        rank: 1
      },
      {
        id: 'player-2',
        name: 'Jean Martin',
        avatar: 'assets/avatars/avatar-2.jpg',
        isHost: false,
        isReady: true,
        joinedAt: new Date(),
        score: 0,
        rank: 2
      }
    ];

    const demoSession: GameSession = {
      id: 'session-1',
      gameId: 'word-hangman',
      players: demoPlayers,
      status: GameSessionStatus.WAITING,
      startTime: new Date(),
      currentRound: 0,
      totalRounds: 5,
      settings: {
        rounds: 5,
        difficulty: GameDifficulty.MEDIUM,
        timeLimit: 60
      },
      scores: [],
      chat: [
        {
          id: 'msg-1',
          playerId: 'player-1',
          playerName: 'Marie Dubois',
          message: 'Salut ! Prêt pour une partie ?',
          timestamp: new Date(Date.now() - 300000),
          type: 'text'
        },
        {
          id: 'msg-2',
          playerId: 'player-2',
          playerName: 'Jean Martin',
          message: 'Oui, j\'adore le Pendu Aérien !',
          timestamp: new Date(Date.now() - 240000),
          type: 'text'
        }
      ]
    };

    this.activeSessionsSubject.next([demoSession]);
  }

  private createDemoLeaderboards() {
    const leaderboards = new Map<string, GameLeaderboard>();

    // Classement pour le Pendu Aérien
    leaderboards.set('word-hangman', {
      gameId: 'word-hangman',
      entries: [
        {
          playerId: 'player-1',
          playerName: 'Marie Dubois',
          playerAvatar: 'assets/avatars/avatar-1.jpg',
          score: 1250,
          gamesPlayed: 15,
          wins: 12,
          rank: 1,
          lastPlayed: new Date(Date.now() - 3600000)
        },
        {
          playerId: 'player-2',
          playerName: 'Jean Martin',
          playerAvatar: 'assets/avatars/avatar-2.jpg',
          score: 980,
          gamesPlayed: 12,
          wins: 8,
          rank: 2,
          lastPlayed: new Date(Date.now() - 7200000)
        },
        {
          playerId: 'player-3',
          playerName: 'Pierre Durand',
          playerAvatar: 'assets/avatars/avatar-3.jpg',
          score: 750,
          gamesPlayed: 8,
          wins: 5,
          rank: 3,
          lastPlayed: new Date(Date.now() - 10800000)
        }
      ],
      lastUpdated: new Date()
    });

    // Classement pour le Quiz Aviation
    leaderboards.set('trivia-aviation', {
      gameId: 'trivia-aviation',
      entries: [
        {
          playerId: 'player-2',
          playerName: 'Jean Martin',
          playerAvatar: 'assets/avatars/avatar-2.jpg',
          score: 2100,
          gamesPlayed: 20,
          wins: 18,
          rank: 1,
          lastPlayed: new Date(Date.now() - 1800000)
        },
        {
          playerId: 'player-1',
          playerName: 'Marie Dubois',
          playerAvatar: 'assets/avatars/avatar-1.jpg',
          score: 1850,
          gamesPlayed: 18,
          wins: 15,
          rank: 2,
          lastPlayed: new Date(Date.now() - 5400000)
        }
      ],
      lastUpdated: new Date()
    });

    this.leaderboardsSubject.next(leaderboards);
  }

  private createDemoAchievements() {
    const achievements: GameAchievement[] = [
      {
        id: 'first-win',
        name: 'Première Victoire',
        description: 'Gagnez votre première partie',
        icon: 'trophy',
        category: GameCategory.WORD,
        requirement: 'Gagner 1 partie',
        points: 10,
        isUnlocked: true,
        unlockedAt: new Date(Date.now() - 86400000)
      },
      {
        id: 'word-master',
        name: 'Maître des Mots',
        description: 'Gagnez 10 parties de Pendu Aérien',
        icon: 'book',
        category: GameCategory.WORD,
        requirement: 'Gagner 10 parties de mots',
        points: 50,
        isUnlocked: true,
        unlockedAt: new Date(Date.now() - 172800000)
      },
      {
        id: 'trivia-expert',
        name: 'Expert Quiz',
        description: 'Répondez correctement à 50 questions',
        icon: 'help-circle',
        category: GameCategory.TRIVIA,
        requirement: '50 bonnes réponses',
        points: 75,
        isUnlocked: false
      },
      {
        id: 'puzzle-solver',
        name: 'Résolveur d\'Énigmes',
        description: 'Résolvez 5 puzzles sans indice',
        icon: 'puzzle',
        category: GameCategory.PUZZLE,
        requirement: '5 puzzles sans indice',
        points: 100,
        isUnlocked: false
      },
      {
        id: 'memory-champion',
        name: 'Champion de Mémoire',
        description: 'Terminez un jeu de mémoire en moins de 30 secondes',
        icon: 'images',
        category: GameCategory.MEMORY,
        requirement: 'Mémoire en < 30s',
        points: 25,
        isUnlocked: false
      }
    ];

    this.achievementsSubject.next(achievements);
  }

  private createDemoStatistics() {
    const statistics: GameStatistics = {
      totalGamesPlayed: 45,
      totalTimePlayed: 360, // 6 heures
      favoriteGame: 'word-hangman',
      bestScore: 1250,
      achievements: this.achievementsSubject.value.filter(a => a.isUnlocked),
      winRate: 0.73, // 73%
      averageScore: 850
    };

    this.statisticsSubject.next(statistics);
  }

  // Méthodes publiques
  getGames(): Observable<Game[]> {
    return this.games$;
  }

  getGameById(id: string): Observable<Game | undefined> {
    return this.games$.pipe(
      map(games => games.find(game => game.id === id))
    );
  }

  getGamesByCategory(category: GameCategory): Observable<Game[]> {
    return this.games$.pipe(
      map(games => games.filter(game => game.category === category))
    );
  }

  getActiveSessions(): Observable<GameSession[]> {
    return this.activeSessions$;
  }

  getSessionById(id: string): Observable<GameSession | undefined> {
    return this.activeSessions$.pipe(
      map(sessions => sessions.find(session => session.id === id))
    );
  }

  createSession(gameId: string, hostPlayer: GamePlayer, settings: GameSettings): Observable<GameSession> {
    const newSession: GameSession = {
      id: `session-${Date.now()}`,
      gameId,
      players: [hostPlayer],
      status: GameSessionStatus.WAITING,
      startTime: new Date(),
      currentRound: 0,
      totalRounds: settings.rounds,
      settings,
      scores: [],
      chat: []
    };

    const currentSessions = this.activeSessionsSubject.value;
    this.activeSessionsSubject.next([...currentSessions, newSession]);

    return of(newSession);
  }

  joinSession(sessionId: string, player: GamePlayer): Observable<boolean> {
    const currentSessions = this.activeSessionsSubject.value;
    const sessionIndex = currentSessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) return of(false);

    const session = currentSessions[sessionIndex];
    if (session.players.length >= 6) return of(false); // Limite par défaut

    session.players.push(player);
    currentSessions[sessionIndex] = session;
    this.activeSessionsSubject.next([...currentSessions]);

    return of(true);
  }

  startSession(sessionId: string): Observable<boolean> {
    const currentSessions = this.activeSessionsSubject.value;
    const sessionIndex = currentSessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) return of(false);

    const session = currentSessions[sessionIndex];
    session.status = GameSessionStatus.ACTIVE;
    session.currentRound = 1;
    
    currentSessions[sessionIndex] = session;
    this.activeSessionsSubject.next([...currentSessions]);

    return of(true);
  }

  updateScore(sessionId: string, playerId: string, score: number, round: number): Observable<boolean> {
    const currentSessions = this.activeSessionsSubject.value;
    const sessionIndex = currentSessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) return of(false);

    const session = currentSessions[sessionIndex];
    const newScore: GameScore = {
      playerId,
      round,
      score,
      bonus: 0,
      total: score,
      timestamp: new Date()
    };

    session.scores.push(newScore);
    
    // Mettre à jour le score du joueur
    const player = session.players.find(p => p.id === playerId);
    if (player) {
      player.score += score;
    }

    currentSessions[sessionIndex] = session;
    this.activeSessionsSubject.next([...currentSessions]);

    return of(true);
  }

  getLeaderboard(gameId: string): Observable<GameLeaderboard | undefined> {
    return this.leaderboards$.pipe(
      map(leaderboards => leaderboards.get(gameId))
    );
  }

  getAchievements(): Observable<GameAchievement[]> {
    return this.achievements$;
  }

  getStatistics(): Observable<GameStatistics | null> {
    return this.statistics$;
  }

  // Méthodes pour les jeux spécifiques
  getQuestions(category: string, difficulty: GameDifficulty): Observable<Question[]> {
    const questions: Question[] = [
      {
        id: 'q1',
        question: 'Quel est le plus grand avion de passagers au monde ?',
        options: ['Airbus A380', 'Boeing 747', 'Airbus A350', 'Boeing 777'],
        correctAnswer: 0,
        category: 'aviation',
        difficulty: GameDifficulty.MEDIUM,
        explanation: 'L\'Airbus A380 est le plus grand avion de passagers avec une capacité de 853 passagers.'
      },
      {
        id: 'q2',
        question: 'Quelle est la capitale de la Grèce ?',
        options: ['Rome', 'Athènes', 'Madrid', 'Lisbonne'],
        correctAnswer: 1,
        category: 'géographie',
        difficulty: GameDifficulty.EASY,
        explanation: 'Athènes est la capitale de la Grèce depuis 1834.'
      },
      {
        id: 'q3',
        question: 'En quelle année a eu lieu le premier vol commercial ?',
        options: ['1903', '1914', '1927', '1939'],
        correctAnswer: 1,
        category: 'histoire',
        difficulty: GameDifficulty.HARD,
        explanation: 'Le premier vol commercial a eu lieu en 1914 entre St. Petersburg et Tampa en Floride.'
      }
    ];

    return of(questions.filter(q => q.category === category && q.difficulty === difficulty));
  }

  getWordList(category: string): Observable<string[]> {
    const wordLists: { [key: string]: string[] } = {
      'aviation': ['AVION', 'PILOTE', 'AEROPORT', 'CABINE', 'TURBULENCE', 'DECOLLAGE', 'ATTERRISSAGE'],
      'destinations': ['PARIS', 'LONDRES', 'ROME', 'ATHENES', 'TOKYO', 'NEWYORK', 'SYDNEY'],
      'transport': ['TRAIN', 'BATEAU', 'BUS', 'METRO', 'TAXI', 'VELO', 'MOTO']
    };

    return of(wordLists[category] || wordLists['aviation']);
  }

  // Simulation de parties en temps réel
  simulateGameSession(sessionId: string): Observable<GameSession> {
    return timer(0, 5000).pipe(
      switchMap(() => {
        const currentSessions = this.activeSessionsSubject.value;
        const session = currentSessions.find(s => s.id === sessionId);
        
        if (session && session.status === GameSessionStatus.ACTIVE) {
          // Simuler des scores aléatoires
          session.players.forEach(player => {
            const randomScore = Math.floor(Math.random() * 100) + 50;
            this.updateScore(sessionId, player.id, randomScore, session.currentRound);
          });

          // Passer au round suivant
          if (session.currentRound < session.totalRounds) {
            session.currentRound++;
          } else {
            session.status = GameSessionStatus.FINISHED;
            session.endTime = new Date();
          }
        }

        return of(session!);
      })
    );
  }
} 