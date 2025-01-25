import React, { useState, useEffect } from 'react';
import { X, Circle, RotateCcw, Trophy, Sparkles } from 'lucide-react';

type Player = 'X' | 'O';
type Cell = Player | null;
type Board = Cell[];

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6] // Diagonals
];

function App() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [winningCombo, setWinningCombo] = useState<number[] | null>(null);

  const checkWinner = (boardState: Board): { winner: Player | null; combo: number[] | null } => {
    for (const combo of WINNING_COMBINATIONS) {
      if (
        boardState[combo[0]] &&
        boardState[combo[0]] === boardState[combo[1]] &&
        boardState[combo[0]] === boardState[combo[2]]
      ) {
        return { winner: boardState[combo[0]] as Player, combo };
      }
    }
    return { winner: null, combo: null };
  };

  const isBoardFull = (boardState: Board): boolean => {
    return boardState.every((cell) => cell !== null);
  };

  const getAvailableMoves = (boardState: Board): number[] => {
    return boardState
      .map((cell, index) => (cell === null ? index : -1))
      .filter((index) => index !== -1);
  };

  const minimax = (
    boardState: Board,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number
  ): { score: number; move?: number } => {
    const { winner } = checkWinner(boardState);
    if (winner) {
      return { score: isMaximizing ? -100 + depth : 100 - depth };
    }
    if (isBoardFull(boardState)) {
      return { score: 0 };
    }

    const availableMoves = getAvailableMoves(boardState);
    let bestScore = isMaximizing ? -Infinity : Infinity;
    let bestMove;

    for (const move of availableMoves) {
      const newBoard = [...boardState];
      newBoard[move] = isMaximizing ? 'O' : 'X';
      const result = minimax(newBoard, depth + 1, !isMaximizing, alpha, beta);

      if (isMaximizing) {
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
      } else {
        if (result.score < bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        beta = Math.min(beta, bestScore);
      }

      if (beta <= alpha) {
        break;
      }
    }

    return { score: bestScore, move: bestMove };
  };

  const makeAiMove = async () => {
    setAiThinking(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const { move } = minimax(board, 0, true, -Infinity, Infinity);
    if (move !== undefined) {
      const newBoard = [...board];
      newBoard[move] = 'O';
      setBoard(newBoard);

      const { winner, combo } = checkWinner(newBoard);
      if (winner) {
        setWinningCombo(combo);
        setWinner(winner === 'O' ? 'X' : 'O');
        setGameOver(true);
      } else if (isBoardFull(newBoard)) {
        setWinner('Draw');
        setGameOver(true);
      } else {
        setCurrentPlayer('X');
      }
    }
    setAiThinking(false);
  };

  const handleCellClick = (index: number) => {
    if (board[index] || gameOver || currentPlayer === 'O' || aiThinking) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const { winner, combo } = checkWinner(newBoard);
    if (winner) {
      setWinningCombo(combo);
      setWinner(winner === 'X' ? 'O' : 'X');
      setGameOver(true);
    } else if (isBoardFull(newBoard)) {
      setWinner('Draw');
      setGameOver(true);
    } else {
      setCurrentPlayer('O');
    }
  };

  useEffect(() => {
    let timeoutId: number;
    if (currentPlayer === 'O' && !gameOver) {
      timeoutId = window.setTimeout(() => {
        makeAiMove();
      }, 100);
    }
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [currentPlayer, gameOver]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setGameOver(false);
    setWinner(null);
    setAiThinking(false);
    setWinningCombo(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20">
        <div className="relative">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
            Tic Tac Toe
          </h1>
          <Sparkles className="absolute top-0 right-0 w-6 h-6 text-yellow-400 animate-pulse" />
        </div>
        <p className="text-center text-gray-600 mb-8">
          Goal: Force your opponent to make three in a row!
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={gameOver || cell !== null || currentPlayer === 'O' || aiThinking}
              className={`
                aspect-square flex items-center justify-center rounded-xl text-4xl
                transition-all duration-300 transform
                ${winningCombo?.includes(index) 
                  ? 'bg-yellow-100 scale-105' 
                  : 'bg-red-300 hover:bg-red-400 hover:scale-105'}
                ${!gameOver && cell === null && currentPlayer === 'X' && !aiThinking
                  ? 'hover:shadow-lg'
                  : ''}
                ${cell ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {cell === 'X' && (
                <X className={`w-12 h-12 transition-all duration-300 ${
                  winningCombo?.includes(index) ? 'text-purple-500' : 'text-blue-500'
                }`} />
              )}
              {cell === 'O' && (
                <Circle className={`w-12 h-12 transition-all duration-300 ${
                  winningCombo?.includes(index) ? 'text-purple-500' : 'text-pink-500'
                }`} />
              )}
            </button>
          ))}
        </div>

        <div className="text-center">
          {gameOver ? (
            <div className="mb-6 transform transition-all duration-300">
              {winner === 'Draw' ? (
                <div className="flex flex-col items-center gap-2 animate-bounce">
                  <p className="text-2xl font-semibold text-gray-700">It's a draw!</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Trophy className="w-12 h-12 text-yellow-500 animate-bounce" />
                  <p className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                    {winner === 'X' ? 'You lost!' : 'You won!'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xl font-medium text-gray-700 mb-6">
              {aiThinking ? (
                <span className="inline-flex items-center gap-2">
                  AI is thinking...
                  <span className="animate-spin">⚡</span>
                </span>
              ) : (
                "Your turn! Place an 'X'"
              )}
            </p>
          )}

          <button
            onClick={resetGame}
            className="flex items-center gap-2 mx-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
        </div>
        <h1 class="text-center text-blue-500">Made by Anand ❤️</h1> 
      </div>
     
    </div>
  
  
  );
}

export default App;