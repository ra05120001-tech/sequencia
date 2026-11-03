import { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface NumberBubble {
  id: number;
  value: number;
  x: number;
  y: number;
  clicked: boolean;
  wrong: boolean;
}

interface GameLevel {
  name: string;
  emoji: string;
  maxNumber: number;
  timeLimit: number;
  description: string;
  color: string;
}

// Game levels configuration
const LEVELS: GameLevel[] = [
  {
    name: 'Fácil',
    emoji: '🌟',
    maxNumber: 5,
    timeLimit: 30,
    description: 'Números de 1 a 5',
    color: 'from-green-400 to-emerald-500',
  },
  {
    name: 'Médio',
    emoji: '⭐',
    maxNumber: 10,
    timeLimit: 45,
    description: 'Números de 1 a 10',
    color: 'from-blue-400 to-cyan-500',
  },
  {
    name: 'Difícil',
    emoji: '🏆',
    maxNumber: 15,
    timeLimit: 60,
    description: 'Números de 1 a 15',
    color: 'from-purple-400 to-pink-500',
  },
  {
    name: 'Expert',
    emoji: '🎯',
    maxNumber: 20,
    timeLimit: 75,
    description: 'Números de 1 a 20',
    color: 'from-orange-400 to-red-500',
  },
];

const BUBBLE_COLORS = [
  'bg-red-400',
  'bg-blue-400',
  'bg-yellow-400',
  'bg-green-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-indigo-400',
  'bg-teal-400',
  'bg-orange-400',
  'bg-cyan-400',
];

function generateBubbles(maxNumber: number): NumberBubble[] {
  const bubbles: NumberBubble[] = [];
  const usedPositions: { x: number; y: number }[] = [];

  for (let i = 1; i <= maxNumber; i++) {
    let x: number, y: number;
    let attempts = 0;

    do {
      x = Math.random() * 75 + 5; // 5% to 80%
      y = Math.random() * 70 + 10; // 10% to 80%
      attempts++;
    } while (
      attempts < 100 &&
      usedPositions.some(
        (pos) => Math.abs(pos.x - x) < 12 && Math.abs(pos.y - y) < 12
      )
    );

    usedPositions.push({ x, y });

    bubbles.push({
      id: i,
      value: i,
      x,
      y,
      clicked: false,
      wrong: false,
    });
  }

  return bubbles;
}

type GameState = 'menu' | 'playing' | 'won' | 'lost';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [bubbles, setBubbles] = useState<NumberBubble[]>([]);
  const [nextNumber, setNextNumber] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [levelScores, setLevelScores] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer logic
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState('lost');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft > 0]);

  // Check win condition
  useEffect(() => {
    if (gameState === 'playing' && bubbles.length > 0) {
      const allClicked = bubbles.every((b) => b.clicked);
      if (allClicked) {
        setGameState('won');
        setShowConfetti(true);
        const timeBonus = timeLeft * 10;
        setScore((prev) => {
          const finalScore = prev + timeBonus;
          setTotalScore((total) => total + finalScore);
          setLevelScores((prevScores) => [...prevScores, finalScore]);
          return finalScore;
        });
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  }, [bubbles, gameState, timeLeft]);

  const startGame = useCallback((levelIndex: number) => {
    const level = LEVELS[levelIndex];
    setCurrentLevel(levelIndex);
    setBubbles(generateBubbles(level.maxNumber));
    setNextNumber(1);
    setTimeLeft(level.timeLimit);
    setScore(0);
    setStreak(0);
    setGameState('playing');
  }, []);

  const handleBubbleClick = useCallback(
    (bubbleId: number, value: number) => {
      if (gameState !== 'playing') return;

      if (value === nextNumber) {
        // Correct!
        setBubbles((prev) =>
          prev.map((b) => (b.id === bubbleId ? { ...b, clicked: true } : b))
        );
        setNextNumber((prev) => prev + 1);
        setScore((prev) => prev + 10 + streak * 5);
        setStreak((prev) => prev + 1);
      } else {
        // Wrong!
        setBubbles((prev) =>
          prev.map((b) => (b.id === bubbleId ? { ...b, wrong: true } : b))
        );
        setStreak(0);
        setShakeScreen(true);
        setTimeout(() => {
          setBubbles((prev) =>
            prev.map((b) => (b.id === bubbleId ? { ...b, wrong: false } : b))
          );
          setShakeScreen(false);
        }, 500);
      }
    },
    [gameState, nextNumber, streak]
  );

  const goToMenu = () => {
    setGameState('menu');
    setLevelScores([]);
    setTotalScore(0);
  };

  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      startGame(currentLevel + 1);
    } else {
      goToMenu();
    }
  };

  // MENU SCREEN
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8 animate-bounce-slow">
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
            🔢 Jogo dos Números
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-medium">
            Clique nos números em ordem crescente!
          </p>
          <div className="mt-4 text-lg text-gray-500">
            <p>🎯 Encontre o próximo número o mais rápido possível!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
          {LEVELS.map((level, index) => (
            <button
              key={index}
              onClick={() => startGame(index)}
              className={`bg-gradient-to-r ${level.color} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95`}
            >
              <div className="text-4xl mb-2">{level.emoji}</div>
              <div className="text-2xl font-bold">{level.name}</div>
              <div className="text-sm opacity-90 mt-1">{level.description}</div>
              <div className="text-xs opacity-75 mt-2">⏱️ {level.timeLimit} segundos</div>
            </button>
          ))}
        </div>

        <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-2xl p-6 max-w-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-3">📖 Como Jogar:</h2>
          <ul className="text-gray-600 space-y-2 text-left">
            <li>👆 Clique nos números começando pelo <strong>1</strong></li>
            <li>📈 Siga a ordem: 1, 2, 3, 4, 5...</li>
            <li>⏰ Termine antes do tempo acabar!</li>
            <li>🔥 Acertos seguidos dão pontos extras!</li>
            <li>❌ Erros não descontam tempo, mas perdem a sequência!</li>
          </ul>
        </div>
      </div>
    );
  }

  // WIN SCREEN
  if (gameState === 'won') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {showConfetti && <Confetti />}
        <div className="text-center z-10">
          <div className="text-8xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-5xl font-bold text-green-600 mb-4">Parabéns!</h1>
          <p className="text-2xl text-gray-600 mb-2">
            Você completou o nível <strong>{LEVELS[currentLevel].name}</strong>!
          </p>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg my-6 max-w-sm mx-auto">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              ⭐ {score} pontos
            </div>
            <div className="text-lg text-gray-500">
              ⏱️ Tempo restante: {timeLeft}s
            </div>
            <div className="text-lg text-gray-500">
              🔥 Melhor sequência: {streak}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {currentLevel < LEVELS.length - 1 && (
              <button
                onClick={nextLevel}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Próximo Nível ➡️
              </button>
            )}
            <button
              onClick={() => startGame(currentLevel)}
              className="bg-gradient-to-r from-orange-400 to-yellow-400 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Jogar Novamente 🔄
            </button>
            <button
              onClick={goToMenu}
              className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Menu 🏠
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOSE SCREEN
  if (gameState === 'lost') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-orange-50 to-yellow-100 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-8xl mb-4">⏰</div>
          <h1 className="text-5xl font-bold text-red-500 mb-4">Tempo Esgotado!</h1>
          <p className="text-2xl text-gray-600 mb-2">
            Você chegou até o número <strong>{nextNumber - 1}</strong> de{' '}
            <strong>{LEVELS[currentLevel].maxNumber}</strong>
          </p>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg my-6 max-w-sm mx-auto">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              ⭐ {score} pontos
            </div>
            <p className="text-gray-500 text-lg">
              💪 Não desista! Tente novamente!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => startGame(currentLevel)}
              className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Tentar Novamente 🔄
            </button>
            <button
              onClick={goToMenu}
              className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Menu 🏠
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PLAYING SCREEN
  const level = LEVELS[currentLevel];
  const progress = ((nextNumber - 1) / level.maxNumber) * 100;
  const timePercent = (timeLeft / level.timeLimit) * 100;
  const timeColor =
    timePercent > 50
      ? 'bg-green-500'
      : timePercent > 25
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col p-3 md:p-4 ${
        shakeScreen ? 'animate-shake' : ''
      }`}
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-3 md:p-4 mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={goToMenu}
              className="bg-gray-200 hover:bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center text-lg transition-colors"
            >
              🏠
            </button>
            <div>
              <span className="text-lg font-bold text-gray-700">
                {level.emoji} {level.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500">Pontos</div>
              <div className="text-xl font-bold text-purple-600">⭐ {score}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Sequência</div>
              <div className="text-xl font-bold text-orange-500">🔥 {streak}</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Progresso</span>
            <span>
              {nextNumber - 1}/{level.maxNumber}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Timer bar */}
        <div className="mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">⏰ Tempo</span>
            <span
              className={`font-bold ${
                timePercent > 50
                  ? 'text-green-600'
                  : timePercent > 25
                  ? 'text-yellow-600'
                  : 'text-red-600 animate-pulse'
              }`}
            >
              {timeLeft}s
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${timeColor} rounded-full transition-all duration-1000`}
              style={{ width: `${timePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Next number indicator */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-2 shadow-md">
          <span className="text-lg text-gray-600">Clique no número:</span>
          <span className="text-3xl font-bold text-purple-600 animate-pulse">
            {nextNumber}
          </span>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative bg-white/40 backdrop-blur-sm rounded-3xl shadow-inner border-2 border-white/60 min-h-[400px] md:min-h-[500px] overflow-hidden">
        {bubbles.map((bubble) => (
          <button
            key={bubble.id}
            onClick={() => handleBubbleClick(bubble.id, bubble.value)}
            disabled={bubble.clicked}
            className={`absolute w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold text-white shadow-lg transform transition-all duration-200 
              ${
                bubble.clicked
                  ? 'scale-0 opacity-0'
                  : bubble.wrong
                  ? 'animate-wrong bg-red-600 scale-110'
                  : `${BUBBLE_COLORS[bubble.value % BUBBLE_COLORS.length]} hover:scale-125 active:scale-95 cursor-pointer hover:shadow-xl`
              }
              ${!bubble.clicked && !bubble.wrong ? 'animate-float' : ''}
            `}
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              animationDelay: `${bubble.id * 0.2}s`,
              animationDuration: `${2 + (bubble.id % 3)}s`,
            }}
          >
            {bubble.value}
          </button>
        ))}
      </div>

      {/* Hint at bottom */}
      <div className="text-center mt-3 text-gray-500 text-sm">
        💡 Dica: Encontre o número <strong className="text-purple-600">{nextNumber}</strong> e clique nele!
      </div>
    </div>
  );
}

// Confetti component
function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    color: ['bg-red-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400'][
      Math.floor(Math.random() * 6)
    ],
    size: 8 + Math.random() * 12,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={`absolute ${piece.color} rounded-sm animate-confetti`}
          style={{
            left: `${piece.x}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
