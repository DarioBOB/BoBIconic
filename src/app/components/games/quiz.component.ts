import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

interface GameState {
  currentQuestionIndex: number;
  score: number;
  totalQuestions: number;
  timeLeft: number;
  selectedAnswer: number | null;
  answered: boolean;
  gameStarted: boolean;
  gameOver: boolean;
  showResults: boolean;
  streak: number;
  bestStreak: number;
}

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class QuizComponent implements OnInit {
  gameState: GameState = {
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions: 10,
    timeLeft: 30,
    selectedAnswer: null,
    answered: false,
    gameStarted: false,
    gameOver: false,
    showResults: false,
    streak: 0,
    bestStreak: 0
  };

  questions: Question[] = [];
  private gameTimer: any;
  private questionTimer: any;

  ngOnInit() {
    this.initializeGame();
  }

  ngOnDestroy() {
    this.clearTimers();
  }

  initializeGame() {
    this.gameState = {
      currentQuestionIndex: 0,
      score: 0,
      totalQuestions: 10,
      timeLeft: 30,
      selectedAnswer: null,
      answered: false,
      gameStarted: false,
      gameOver: false,
      showResults: false,
      streak: 0,
      bestStreak: 0
    };
    this.generateQuestions();
  }

  generateQuestions() {
    this.questions = [
      {
        id: 1,
        question: "Quelle est la capitale de la France ?",
        options: ["Londres", "Berlin", "Paris", "Madrid"],
        correctAnswer: 2,
        category: "Géographie",
        difficulty: "easy"
      },
      {
        id: 2,
        question: "Quel est le plus grand océan du monde ?",
        options: ["Océan Atlantique", "Océan Pacifique", "Océan Indien", "Océan Arctique"],
        correctAnswer: 1,
        category: "Géographie",
        difficulty: "easy"
      },
      {
        id: 3,
        question: "Qui a peint la Joconde ?",
        options: ["Michel-Ange", "Leonard de Vinci", "Raphaël", "Botticelli"],
        correctAnswer: 1,
        category: "Art",
        difficulty: "medium"
      },
      {
        id: 4,
        question: "Combien de planètes dans notre système solaire ?",
        options: ["7", "8", "9", "10"],
        correctAnswer: 1,
        category: "Sciences",
        difficulty: "easy"
      },
      {
        id: 5,
        question: "Quel est le plus grand désert du monde ?",
        options: ["Sahara", "Gobi", "Antarctique", "Kalahari"],
        correctAnswer: 2,
        category: "Géographie",
        difficulty: "medium"
      },
      {
        id: 6,
        question: "En quelle année a eu lieu la Révolution française ?",
        options: ["1789", "1799", "1769", "1779"],
        correctAnswer: 0,
        category: "Histoire",
        difficulty: "medium"
      },
      {
        id: 7,
        question: "Quel est le symbole chimique de l'or ?",
        options: ["Ag", "Au", "Fe", "Cu"],
        correctAnswer: 1,
        category: "Sciences",
        difficulty: "medium"
      },
      {
        id: 8,
        question: "Quel est le plus grand mammifère terrestre ?",
        options: ["Éléphant d'Afrique", "Girafe", "Rhinocéros", "Hippopotame"],
        correctAnswer: 0,
        category: "Sciences",
        difficulty: "easy"
      },
      {
        id: 9,
        question: "Quel est le nom du plus grand volcan actif d'Europe ?",
        options: ["Vésuve", "Etna", "Stromboli", "Mont Blanc"],
        correctAnswer: 1,
        category: "Géographie",
        difficulty: "hard"
      },
      {
        id: 10,
        question: "Quel est le plus ancien monument de Paris ?",
        options: ["Tour Eiffel", "Arc de Triomphe", "Notre-Dame", "Arena de Lutèce"],
        correctAnswer: 3,
        category: "Histoire",
        difficulty: "hard"
      }
    ];
  }

  startGame() {
    this.gameState.gameStarted = true;
    this.startQuestionTimer();
  }

  startQuestionTimer() {
    this.gameState.timeLeft = 30;
    this.questionTimer = setInterval(() => {
      this.gameState.timeLeft--;
      if (this.gameState.timeLeft <= 0) {
        this.timeUp();
      }
    }, 1000);
  }

  selectAnswer(answerIndex: number) {
    if (this.gameState.answered) return;
    
    this.gameState.selectedAnswer = answerIndex;
    this.gameState.answered = true;
    this.checkAnswer();
  }

  checkAnswer() {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return;

    const isCorrect = this.gameState.selectedAnswer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      this.gameState.score += this.calculateScore();
      this.gameState.streak++;
      if (this.gameState.streak > this.gameState.bestStreak) {
        this.gameState.bestStreak = this.gameState.streak;
      }
    } else {
      this.gameState.streak = 0;
    }

    this.clearTimers();
    
    // Attendre 2 secondes avant la question suivante
    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  }

  calculateScore(): number {
    const baseScore = 100;
    const timeBonus = Math.floor(this.gameState.timeLeft * 2);
    const streakBonus = this.gameState.streak * 50;
    return baseScore + timeBonus + streakBonus;
  }

  timeUp() {
    if (!this.gameState.answered) {
      this.gameState.selectedAnswer = -1; // Aucune réponse
      this.gameState.answered = true;
      this.gameState.streak = 0;
      this.checkAnswer();
    }
  }

  nextQuestion() {
    this.gameState.currentQuestionIndex++;
    
    if (this.gameState.currentQuestionIndex >= this.gameState.totalQuestions) {
      this.endGame();
    } else {
      this.gameState.selectedAnswer = null;
      this.gameState.answered = false;
      this.startQuestionTimer();
    }
  }

  endGame() {
    this.gameState.gameOver = true;
    this.clearTimers();
  }

  showResults() {
    this.gameState.showResults = true;
  }

  restart() {
    this.clearTimers();
    this.initializeGame();
  }

  clearTimers() {
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
      this.questionTimer = null;
    }
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
  }

  getCurrentQuestion(): Question | null {
    return this.questions[this.gameState.currentQuestionIndex] || null;
  }

  isCorrectAnswer(answerIndex: number): boolean {
    const currentQuestion = this.getCurrentQuestion();
    return currentQuestion ? answerIndex === currentQuestion.correctAnswer : false;
  }

  isSelectedAnswer(answerIndex: number): boolean {
    return this.gameState.selectedAnswer === answerIndex;
  }

  getAnswerClass(answerIndex: number): string {
    if (!this.gameState.answered) return '';
    
    if (this.isCorrectAnswer(answerIndex)) {
      return 'correct';
    } else if (this.isSelectedAnswer(answerIndex)) {
      return 'incorrect';
    }
    return '';
  }

  getProgressPercentage(): number {
    return (this.gameState.currentQuestionIndex / this.gameState.totalQuestions) * 100;
  }

  getTimeColor(): string {
    if (this.gameState.timeLeft <= 10) return 'danger';
    if (this.gameState.timeLeft <= 20) return 'warning';
    return 'success';
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'medium';
    }
  }

  getDifficultyText(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
      default: return 'Inconnu';
    }
  }

  getScorePercentage(): number {
    return (this.gameState.score / (this.gameState.totalQuestions * 150)) * 100;
  }

  getPerformanceMessage(): string {
    const percentage = this.getScorePercentage();
    if (percentage >= 80) return 'Excellent !';
    if (percentage >= 60) return 'Bien joué !';
    if (percentage >= 40) return 'Pas mal !';
    return 'Continuez à vous entraîner !';
  }

  // Méthode pour convertir l'index en lettre (A, B, C, D)
  getAnswerLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
} 