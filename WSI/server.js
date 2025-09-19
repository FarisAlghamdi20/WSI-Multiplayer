const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    allowEIO3: true
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Game data
const quotes = [
    {
        quote: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        answers: ["Steve Jobs", "Bill Gates", "Elon Musk", "Warren Buffett"],
        correctAnswer: 0,
        authorInfo: "Co-founder of Apple Inc. and visionary entrepreneur"
    },
    {
        quote: "Innovation distinguishes between a leader and a follower.",
        author: "Steve Jobs",
        answers: ["Steve Jobs", "Jeff Bezos", "Mark Zuckerberg", "Tim Cook"],
        correctAnswer: 0,
        authorInfo: "Co-founder of Apple Inc. and visionary entrepreneur"
    },
    {
        quote: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
        answers: ["Eleanor Roosevelt", "Oprah Winfrey", "Maya Angelou", "Michelle Obama"],
        correctAnswer: 0,
        authorInfo: "Former First Lady of the United States and diplomat"
    },
    {
        quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
        answers: ["Winston Churchill", "Abraham Lincoln", "Franklin D. Roosevelt", "Theodore Roosevelt"],
        correctAnswer: 0,
        authorInfo: "British Prime Minister during World War II"
    },
    {
        quote: "The only impossible journey is the one you never begin.",
        author: "Tony Robbins",
        answers: ["Tony Robbins", "Dale Carnegie", "Napoleon Hill", "Robert Kiyosaki"],
        correctAnswer: 0,
        authorInfo: "American motivational speaker and life coach"
    },
    {
        quote: "In the middle of difficulty lies opportunity.",
        author: "Albert Einstein",
        answers: ["Albert Einstein", "Isaac Newton", "Stephen Hawking", "Nikola Tesla"],
        correctAnswer: 0,
        authorInfo: "German-born theoretical physicist who developed the theory of relativity"
    },
    {
        quote: "Life is what happens to you while you're busy making other plans.",
        author: "John Lennon",
        answers: ["John Lennon", "Paul McCartney", "Bob Dylan", "Mick Jagger"],
        correctAnswer: 0,
        authorInfo: "English musician, singer, and songwriter, co-founder of the Beatles"
    },
    {
        quote: "The way to get started is to quit talking and begin doing.",
        author: "Walt Disney",
        answers: ["Walt Disney", "Steve Jobs", "Henry Ford", "Thomas Edison"],
        correctAnswer: 0,
        authorInfo: "American entrepreneur, animator, and film producer, founder of Disney"
    },
    {
        quote: "Don't be afraid to give up the good to go for the great.",
        author: "John D. Rockefeller",
        answers: ["John D. Rockefeller", "Andrew Carnegie", "J.P. Morgan", "Henry Ford"],
        correctAnswer: 0,
        authorInfo: "American business magnate and philanthropist, founder of Standard Oil"
    },
    {
        quote: "The only person you are destined to become is the person you decide to be.",
        author: "Ralph Waldo Emerson",
        answers: ["Ralph Waldo Emerson", "Henry David Thoreau", "Walt Whitman", "Mark Twain"],
        correctAnswer: 0,
        authorInfo: "American essayist, lecturer, and poet, leader of the transcendentalist movement"
    },
    {
        quote: "Your time is limited, don't waste it living someone else's life.",
        author: "Steve Jobs",
        answers: ["Steve Jobs", "Bill Gates", "Elon Musk", "Warren Buffett"],
        correctAnswer: 0,
        authorInfo: "Co-founder of Apple Inc. and visionary entrepreneur"
    },
    {
        quote: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
        author: "Nelson Mandela",
        answers: ["Nelson Mandela", "Martin Luther King Jr.", "Mahatma Gandhi", "Malcolm X"],
        correctAnswer: 0,
        authorInfo: "South African anti-apartheid revolutionary and political leader"
    },
    {
        quote: "If you really look closely, most overnight successes took a long time.",
        author: "Steve Jobs",
        answers: ["Steve Jobs", "Bill Gates", "Elon Musk", "Jeff Bezos"],
        correctAnswer: 0,
        authorInfo: "Co-founder of Apple Inc. and visionary entrepreneur"
    },
    {
        quote: "The future belongs to those who prepare for it today.",
        author: "Malcolm X",
        answers: ["Malcolm X", "Martin Luther King Jr.", "Nelson Mandela", "Frederick Douglass"],
        correctAnswer: 0,
        authorInfo: "American civil rights activist and minister"
    },
    {
        quote: "It is during our darkest moments that we must focus to see the light.",
        author: "Aristotle",
        answers: ["Aristotle", "Plato", "Socrates", "Confucius"],
        correctAnswer: 0,
        authorInfo: "Ancient Greek philosopher and scientist"
    }
];

// Game state management
const games = new Map();
const players = new Map();

class Game {
    constructor(gameCode, hostId) {
        this.gameCode = gameCode;
        this.hostId = hostId;
        this.players = new Map();
        this.gameStarted = false;
        this.currentRound = 0;
        this.totalRounds = 10;
        this.currentQuestion = null;
        this.playerAnswers = new Map();
        this.scores = new Map();
        this.questionTimer = null;
    }

    addPlayer(playerId, playerData) {
        this.players.set(playerId, {
            ...playerData,
            ready: false,
            answered: false,
            score: 0
        });
        this.scores.set(playerId, 0);
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        this.scores.delete(playerId);
        this.playerAnswers.delete(playerId);
    }

    setPlayerReady(playerId, ready) {
        const player = this.players.get(playerId);
        if (player) {
            player.ready = ready;
        }
    }

    canStartGame() {
        const allReady = Array.from(this.players.values()).every(player => player.ready);
        const hasEnoughPlayers = this.players.size >= 2;
        return allReady && hasEnoughPlayers;
    }

    startGame() {
        this.gameStarted = true;
        this.currentRound = 0;
        this.nextQuestion();
    }

    nextQuestion() {
        if (this.currentRound >= this.totalRounds) {
            this.endGame();
            return;
        }

        this.currentRound++;
        this.currentQuestion = this.getRandomQuestion();
        this.playerAnswers.clear();
        
        // Reset player answered status
        this.players.forEach(player => {
            player.answered = false;
        });

        // Start timer
        this.questionTimer = setTimeout(() => {
            this.endQuestion();
        }, 15000);

        return this.currentQuestion;
    }

    getRandomQuestion() {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        return quotes[randomIndex];
    }

    submitAnswer(playerId, answerIndex) {
        if (!this.currentQuestion || this.playerAnswers.has(playerId)) {
            return false;
        }

        this.playerAnswers.set(playerId, answerIndex);
        
        const player = this.players.get(playerId);
        if (player) {
            player.answered = true;
        }

        // Check if all players have answered
        if (this.playerAnswers.size === this.players.size) {
            clearTimeout(this.questionTimer);
            setTimeout(() => this.endQuestion(), 1000);
        }

        return true;
    }

    endQuestion() {
        if (this.questionTimer) {
            clearTimeout(this.questionTimer);
            this.questionTimer = null;
        }

        const correctAnswer = this.currentQuestion.correctAnswer;
        const correctPlayers = [];

        // Calculate scores
        this.playerAnswers.forEach((answer, playerId) => {
            if (answer === correctAnswer) {
                let points = 10;
                
                // Bonus points for speed (first 3 correct answers)
                if (correctPlayers.length < 3) {
                    points += 5;
                }
                
                correctPlayers.push(playerId);
                this.scores.set(playerId, (this.scores.get(playerId) || 0) + points);
                
                const player = this.players.get(playerId);
                if (player) {
                    player.score = this.scores.get(playerId);
                }
            }
        });

        // Emit results
        // Convert Maps to objects for JSON serialization
        const playerAnswersObject = {};
        this.playerAnswers.forEach((answer, playerId) => {
            playerAnswersObject[playerId] = answer;
        });
        
        const scoresObject = {};
        this.scores.forEach((score, playerId) => {
            scoresObject[playerId] = score;
        });
        
        io.to(this.gameCode).emit('questionResults', {
            correctAnswer,
            playerAnswers: playerAnswersObject,
            scores: scoresObject,
            correctPlayers
        });

        // Move to next question after delay
        setTimeout(() => {
            if (this.currentRound < this.totalRounds) {
                this.nextQuestion();
                io.to(this.gameCode).emit('questionData', this.currentQuestion);
            } else {
                // Game is complete, show final results
                this.endGame();
            }
        }, 3000);
    }

    endGame() {
        this.gameStarted = false;
        
        const finalScores = Array.from(this.players.entries())
            .map(([playerId, player]) => ({
                playerId,
                name: player.name,
                score: player.score || 0
            }))
            .sort((a, b) => b.score - a.score);

        io.to(this.gameCode).emit('gameOver', { finalScores });
    }

    getGameData() {
        // Convert players Map to object for JSON serialization
        const playersObject = {};
        this.players.forEach((player, playerId) => {
            playersObject[playerId] = player;
        });
        
        return {
            gameCode: this.gameCode,
            players: playersObject,
            isHost: false
        };
    }
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create game
    socket.on('createGame', (data) => {
        console.log('Creating game for player:', data.playerName);
        const gameCode = generateGameCode();
        const game = new Game(gameCode, socket.id);
        
        game.addPlayer(socket.id, {
            name: data.playerName,
            id: socket.id
        });
        
        games.set(gameCode, game);
        players.set(socket.id, { gameCode, isHost: true });
        
        socket.join(gameCode);
        console.log('Game created with code:', gameCode);
        socket.emit('gameCreated', { gameCode });
    });

    // Join game
    socket.on('joinGame', (data) => {
        const game = games.get(data.gameCode);
        
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        if (game.players.size >= 8) {
            socket.emit('error', { message: 'Game is full' });
            return;
        }

        if (game.gameStarted) {
            socket.emit('error', { message: 'Game has already started' });
            return;
        }

        game.addPlayer(socket.id, {
            name: data.playerName,
            id: socket.id
        });
        
        players.set(socket.id, { gameCode: data.gameCode, isHost: false });
        socket.join(data.gameCode);
        
        // Convert players Map to object for JSON serialization
        const playersObject = {};
        game.players.forEach((player, playerId) => {
            playersObject[playerId] = player;
        });
        
        socket.emit('gameJoined', {
            gameCode: data.gameCode,
            players: playersObject,
            isHost: false
        });
        
        socket.to(data.gameCode).emit('playerJoined', {
            playerId: socket.id,
            player: { name: data.playerName, id: socket.id, ready: false, score: 0 }
        });
    });

    // Toggle ready status
    socket.on('toggleReady', (data) => {
        const player = players.get(socket.id);
        if (!player) return;

        const game = games.get(player.gameCode);
        if (!game) return;

        game.setPlayerReady(socket.id, data.ready);
        
        io.to(player.gameCode).emit('playerReady', {
            playerId: socket.id,
            ready: data.ready
        });
    });

    // Start game
    socket.on('startGame', () => {
        const player = players.get(socket.id);
        if (!player) return;

        const game = games.get(player.gameCode);
        if (!game || game.hostId !== socket.id) return;

        if (!game.canStartGame()) {
            socket.emit('error', { message: 'Not all players are ready or not enough players' });
            return;
        }

        game.startGame();
        io.to(player.gameCode).emit('gameStarted');
        io.to(player.gameCode).emit('questionData', game.currentQuestion);
    });

    // Submit answer
    socket.on('answerSelected', (data) => {
        const player = players.get(socket.id);
        if (!player) return;

        const game = games.get(player.gameCode);
        if (!game || !game.gameStarted) return;

        const success = game.submitAnswer(socket.id, data.answerIndex);
        if (success) {
            io.to(player.gameCode).emit('playerAnswered', {
                playerId: socket.id
            });
        }
    });

    // Chat message
    socket.on('chatMessage', (data) => {
        const player = players.get(socket.id);
        if (!player) return;

        const game = games.get(player.gameCode);
        if (!game) return;

        const playerData = game.players.get(socket.id);
        if (!playerData) return;

        io.to(player.gameCode).emit('chatMessage', {
            sender: playerData.name,
            message: data.message
        });
    });

    // Play again
    socket.on('playAgain', () => {
        const player = players.get(socket.id);
        if (!player) return;

        const game = games.get(player.gameCode);
        if (!game) return;

        // Reset game state
        game.gameStarted = false;
        game.currentRound = 0;
        game.playerAnswers.clear();
        
        game.players.forEach(player => {
            player.ready = false;
            player.answered = false;
            player.score = 0;
        });
        
        game.scores.clear();
        game.players.forEach((_, playerId) => {
            game.scores.set(playerId, 0);
        });

        io.to(player.gameCode).emit('gameReset');
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        const player = players.get(socket.id);
        if (!player) return;

        const game = games.get(player.gameCode);
        if (!game) return;

        const playerData = game.players.get(socket.id);
        if (playerData) {
            socket.to(player.gameCode).emit('playerLeft', {
                playerId: socket.id,
                playerName: playerData.name
            });
        }

        game.removePlayer(socket.id);
        players.delete(socket.id);

        // Clean up empty games
        if (game.players.size === 0) {
            games.delete(player.gameCode);
        }
    });
});

// Utility functions
function generateGameCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to play the game`);
});