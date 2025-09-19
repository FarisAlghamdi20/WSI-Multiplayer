const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Load environment variables
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    },
    allowEIO3: true
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Game data with categories and difficulty levels - Saudi Arabia Focused Content for Younger Generation
const quotes = [
    // Saudi Social Media Influencers & Content Creators
    {
        quote: "من قال 'أهلاً وسهلاً بكم في قناتي'؟",
        author: "أحمد الشقيري",
        answers: ["أحمد الشقيري", "عبدالله القصيمي", "أنس العبادي", "خالد المالكي"],
        correctAnswer: 0,
        authorInfo: "مقدم برنامج خواطر والداعية السعودي المشهور",
        category: "المؤثرون السعوديون",
        difficulty: "سهل"
    },
    {
        quote: "من قال 'خليني أقولك حاجة'؟",
        author: "أنس بوخش",
        answers: ["أنس بوخش", "صالح العنزي", "محمد القحطاني", "فهد البتيري"],
        correctAnswer: 0,
        authorInfo: "يوتيوبر سعودي مشهور بالكوميديا",
        category: "المؤثرون السعوديون",
        difficulty: "سهل"
    },
    {
        quote: "من هو صاحب قناة 'فريج'؟",
        author: "فريج",
        answers: ["فريج", "أنس بوخش", "صالح العنزي", "محمد القحطاني"],
        correctAnswer: 0,
        authorInfo: "يوتيوبر سعودي مشهور بمقاطع الكوميديا والتفاعل",
        category: "المؤثرون السعوديون",
        difficulty: "سهل"
    },
    {
        quote: "من هو صاحب قناة 'صالح العنزي'؟",
        author: "صالح العنزي",
        answers: ["صالح العنزي", "أنس بوخش", "فريج", "محمد القحطاني"],
        correctAnswer: 0,
        authorInfo: "يوتيوبر سعودي مشهور بمقاطع الكوميديا والتفاعل",
        category: "المؤثرون السعوديون",
        difficulty: "سهل"
    },
    {
        quote: "من هو صاحب قناة 'محمد القحطاني'؟",
        author: "محمد القحطاني",
        answers: ["محمد القحطاني", "أنس بوخش", "فريج", "صالح العنزي"],
        correctAnswer: 0,
        authorInfo: "يوتيوبر سعودي مشهور بمقاطع الكوميديا والتفاعل",
        category: "المؤثرون السعوديون",
        difficulty: "سهل"
    },
    {
        quote: "من هو صاحب قناة 'فهد البتيري'؟",
        author: "فهد البتيري",
        answers: ["فهد البتيري", "أنس بوخش", "فريج", "صالح العنزي"],
        correctAnswer: 0,
        authorInfo: "يوتيوبر سعودي مشهور بمقاطع الكوميديا والتفاعل",
        category: "المؤثرون السعوديون",
        difficulty: "سهل"
    },
    {
        quote: "من هو صاحب قناة 'خالد المالكي'؟",
        author: "خالد المالكي",
        answers: ["خالد المالكي", "أنس بوخش", "فريج", "صالح العنزي"],
        correctAnswer: 0,
        authorInfo: "يوتيوبر سعودي مشهور بمقاطع الكوميديا والتفاعل",
        category: "المؤثرون السعوديون",
        difficulty: "سهل"
    },
    {
        quote: "من هو صاحب قناة 'عبدالله القصيمي'؟",
        author: "عبدالله القصيمي",
        answers: ["عبدالله القصيمي", "أنس بوخش", "فريج", "صالح العنزي"],
        correctAnswer: 0,
        authorInfo: "يوتيوبر سعودي مشهور بمقاطع الكوميديا والتفاعل",
        category: "المؤثرون السعوديون",
        difficulty: "سهل"
    },
    {
        quote: "من هو صاحب قناة 'محمد الشناوي'؟",
        author: "محمد الشناوي",
        answers: ["محمد الشناوي", "أنس بوخش", "فريج", "صالح العنزي"],
        correctAnswer: 0,
        authorInfo: "يوتيوبر سعودي مشهور بمقاطع الكوميديا والتفاعل",
        category: "المؤثرون السعوديون",
        difficulty: "سهل"
    },
    {
        quote: "من هو صاحب قناة 'علي السلامي'؟",
        author: "علي السلامي",
        answers: ["علي السلامي", "أنس بوخش", "فريج", "صالح العنزي"],
        correctAnswer: 0,
        authorInfo: "يوتيوبر سعودي مشهور بمقاطع الكوميديا والتفاعل",
        category: "المؤثرون السعوديون",
        difficulty: "سهل"
    },
    {
        quote: "من هو صاحب قناة 'خالد الفراج'؟",
        author: "خالد الفراج",
        answers: ["خالد الفراج", "أنس بوخش", "فريج", "صالح العنزي"],
        correctAnswer: 0,
        authorInfo: "يوتيوبر سعودي مشهور بمقاطع الكوميديا والتفاعل",
        category: "المؤثرون السعوديون",
        difficulty: "سهل"
    },
    {
        quote: "من هو مؤسس قناة 'ثمانية'؟",
        author: "عبدالرحمن أبو مالح",
        answers: ["عبدالرحمن أبو مالح", "محمد العبدلي", "فيصل العلي", "أحمد الربعي"],
        correctAnswer: 0,
        authorInfo: "رائد أعمال ومؤسس شبكة ثمانية الإعلامية",
        category: "رواد الأعمال السعوديون",
        difficulty: "متوسط"
    },
    {
        quote: "من هو صاحب قناة 'محمد العبدلي'؟",
        author: "محمد العبدلي",
        answers: ["محمد العبدلي", "أنس بوخش", "فريج", "صالح العنزي"],
        correctAnswer: 0,
        authorInfo: "يوتيوبر سعودي مشهور بمقاطع الكوميديا والتفاعل",
        category: "المؤثرون السعوديون",
        difficulty: "سهل"
    },
    {
        quote: "من هو صاحب قناة 'فيصل العلي'؟",
        author: "فيصل العلي",
        answers: ["فيصل العلي", "أنس بوخش", "فريج", "صالح العنزي"],
        correctAnswer: 0,
        authorInfo: "يوتيوبر سعودي مشهور بمقاطع الكوميديا والتفاعل",
        category: "المؤثرون السعوديون",
        difficulty: "سهل"
    },
    {
        quote: "من هو صاحب قناة 'أحمد الربعي'؟",
        author: "أحمد الربعي",
        answers: ["أحمد الربعي", "أنس بوخش", "فريج", "صالح العنزي"],
        correctAnswer: 0,
        authorInfo: "يوتيوبر سعودي مشهور بمقاطع الكوميديا والتفاعل",
        category: "المؤثرون السعوديون",
        difficulty: "سهل"
    },
    
    // Saudi Leadership & Vision 2030
    {
        quote: "من قال 'السعودية بلد الفرص'؟",
        author: "محمد بن سلمان",
        answers: ["محمد بن سلمان", "سلمان بن عبدالعزيز", "عبدالله بن عبدالعزيز", "خالد الفيصل"],
        correctAnswer: 0,
        authorInfo: "ولي العهد السعودي ومهندس رؤية 2030",
        category: "القيادة السعودية",
        difficulty: "متوسط"
    },
    {
        quote: "من قال 'رؤية 2030 ستجعل السعودية من أكبر 15 اقتصاد في العالم'؟",
        author: "محمد بن سلمان",
        answers: ["محمد بن سلمان", "سلمان بن عبدالعزيز", "عبدالله بن عبدالعزيز", "خالد الفيصل"],
        correctAnswer: 0,
        authorInfo: "ولي العهد السعودي ومهندس رؤية 2030",
        category: "القيادة السعودية",
        difficulty: "متوسط"
    },
    {
        quote: "من هو مؤسس 'نيوم'؟",
        author: "محمد بن سلمان",
        answers: ["محمد بن سلمان", "سلمان بن عبدالعزيز", "عبدالله بن عبدالعزيز", "خالد الفيصل"],
        correctAnswer: 0,
        authorInfo: "ولي العهد السعودي ومهندس رؤية 2030",
        category: "القيادة السعودية",
        difficulty: "متوسط"
    },
    {
        quote: "من قال 'السعودية ستكون محايدة كربونياً بحلول 2060'؟",
        author: "محمد بن سلمان",
        answers: ["محمد بن سلمان", "سلمان بن عبدالعزيز", "عبدالله بن عبدالعزيز", "خالد الفيصل"],
        correctAnswer: 0,
        authorInfo: "ولي العهد السعودي ومهندس رؤية 2030",
        category: "القيادة السعودية",
        difficulty: "متوسط"
    },
    {
        quote: "من هو مؤسس 'ذا لاين' في نيوم؟",
        author: "محمد بن سلمان",
        answers: ["محمد بن سلمان", "سلمان بن عبدالعزيز", "عبدالله بن عبدالعزيز", "خالد الفيصل"],
        correctAnswer: 0,
        authorInfo: "ولي العهد السعودي ومهندس رؤية 2030",
        category: "القيادة السعودية",
        difficulty: "متوسط"
    },
    
    // Saudi Sports & Entertainment
    {
        quote: "من هو نجم الهلال السعودي المشهور؟",
        author: "سالم الدوسري",
        answers: ["سالم الدوسري", "محمد الشلهوب", "ياسر القحطاني", "نواف العابد"],
        correctAnswer: 0,
        authorInfo: "لاعب كرة قدم سعودي في نادي الهلال والمنتخب الوطني",
        category: "الرياضة السعودية",
        difficulty: "سهل"
    },
    {
        quote: "من هو قائد المنتخب السعودي لكرة القدم؟",
        author: "سالم الدوسري",
        answers: ["سالم الدوسري", "محمد الشلهوب", "ياسر القحطاني", "نواف العابد"],
        correctAnswer: 0,
        authorInfo: "لاعب كرة قدم سعودي في نادي الهلال والمنتخب الوطني",
        category: "الرياضة السعودية",
        difficulty: "سهل"
    },
    {
        quote: "من هو الممثل السعودي المشهور في 'طاش ما طاش'؟",
        author: "ناصر القصبي",
        answers: ["ناصر القصبي", "عبدالله السدحان", "فؤاد المهندس", "عبدالرحمن أبو مالح"],
        correctAnswer: 0,
        authorInfo: "ممثل ومقدم برامج سعودي مشهور",
        category: "الترفيه السعودي",
        difficulty: "سهل"
    },
    {
        quote: "من هو الممثل السعودي المشهور في 'طاش ما طاش'؟",
        author: "عبدالله السدحان",
        answers: ["عبدالله السدحان", "ناصر القصبي", "فؤاد المهندس", "عبدالرحمن أبو مالح"],
        correctAnswer: 0,
        authorInfo: "ممثل ومقدم برامج سعودي مشهور",
        category: "الترفيه السعودي",
        difficulty: "سهل"
    },
    
    // Saudi Culture & Heritage
    {
        quote: "من هو شاعر النبط السعودي المشهور؟",
        author: "محمد العبدالله العوني",
        answers: ["محمد العبدالله العوني", "عبدالله بن خميس", "عبدالله البرقاوي", "محمد بن راشد"],
        correctAnswer: 0,
        authorInfo: "شاعر نبط سعودي مشهور",
        category: "الثقافة السعودية",
        difficulty: "متوسط"
    },
    {
        quote: "من هو مؤلف 'موسوعة المملكة العربية السعودية'؟",
        author: "عبدالله بن خميس",
        answers: ["عبدالله بن خميس", "محمد العبدالله العوني", "عبدالله البرقاوي", "محمد بن راشد"],
        correctAnswer: 0,
        authorInfo: "كاتب ومؤرخ سعودي مشهور",
        category: "الثقافة السعودية",
        difficulty: "متوسط"
    },
    
    // Saudi Geography & Cities
    {
        quote: "ما هي العاصمة السعودية؟",
        author: "الرياض",
        answers: ["الرياض", "جدة", "مكة المكرمة", "الدمام"],
        correctAnswer: 0,
        authorInfo: "عاصمة المملكة العربية السعودية",
        category: "الجغرافيا السعودية",
        difficulty: "سهل"
    },
    {
        quote: "ما هي المدينة المقدسة في السعودية؟",
        author: "مكة المكرمة",
        answers: ["مكة المكرمة", "المدينة المنورة", "الرياض", "جدة"],
        correctAnswer: 0,
        authorInfo: "المدينة المقدسة التي يوجد فيها الكعبة المشرفة",
        category: "الجغرافيا السعودية",
        difficulty: "سهل"
    },
    {
        quote: "ما هي المدينة التي يوجد فيها المسجد النبوي؟",
        author: "المدينة المنورة",
        answers: ["المدينة المنورة", "مكة المكرمة", "الرياض", "جدة"],
        correctAnswer: 0,
        authorInfo: "المدينة التي يوجد فيها المسجد النبوي الشريف",
        category: "الجغرافيا السعودية",
        difficulty: "سهل"
    },
    {
        quote: "ما هي المدينة الساحلية المشهورة في السعودية؟",
        author: "جدة",
        answers: ["جدة", "الدمام", "الخبر", "القطيف"],
        correctAnswer: 0,
        authorInfo: "المدينة الساحلية الرئيسية في السعودية",
        category: "الجغرافيا السعودية",
        difficulty: "سهل"
    },
    
    // Saudi Technology & Innovation
    {
        quote: "من هو مؤسس 'ستيب' السعودية؟",
        author: "نواف السبيعي",
        answers: ["نواف السبيعي", "عبدالرحمن أبو مالح", "محمد العبدلي", "فيصل العلي"],
        correctAnswer: 0,
        authorInfo: "رائد أعمال سعودي ومؤسس منصة ستيب",
        category: "التكنولوجيا السعودية",
        difficulty: "متوسط"
    },
    {
        quote: "من هو مؤسس 'تامر' السعودية؟",
        author: "عبدالله الشمري",
        answers: ["عبدالله الشمري", "نواف السبيعي", "عبدالرحمن أبو مالح", "محمد العبدلي"],
        correctAnswer: 0,
        authorInfo: "رائد أعمال سعودي ومؤسس منصة تامر",
        category: "التكنولوجيا السعودية",
        difficulty: "متوسط"
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
        this.gameSettings = {
            totalRounds: 10,
            questionTimer: 15,
            maxPlayers: 8,
            allowSpectators: true,
            showCorrectAnswer: true,
            allowAnswerChanges: true,
            showTimer: true,
            shuffleAnswers: true,
            bonusPoints: 5,
            categories: ["All"],
            difficulty: "All"
        };
    }

    addPlayer(playerId, playerData) {
        const player = {
            ...playerData,
            avatar: playerData.avatar || '🎮',
            ready: false,
            answered: false,
            score: 0,
            isHost: playerData.isHost || false
        };
        this.players.set(playerId, player);
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
        const hasEnoughPlayers = this.players.size >= 1; // Allow solo games
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
        }, this.gameSettings.questionTimer * 1000);

        return this.currentQuestion;
    }

    getRandomQuestion() {
        let filteredQuotes = quotes;
        
        // Filter by category if not "All"
        if (this.gameSettings.categories && !this.gameSettings.categories.includes("All")) {
            filteredQuotes = filteredQuotes.filter(quote => 
                this.gameSettings.categories.includes(quote.category)
            );
        }
        
        // Filter by difficulty if not "All"
        if (this.gameSettings.difficulty && this.gameSettings.difficulty !== "All") {
            filteredQuotes = filteredQuotes.filter(quote => 
                quote.difficulty === this.gameSettings.difficulty
            );
        }
        
        // If no quotes match the filters, use all quotes
        if (filteredQuotes.length === 0) {
            filteredQuotes = quotes;
        }
        
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const question = { ...filteredQuotes[randomIndex] };
        
        // Shuffle answers if enabled
        if (this.gameSettings.shuffleAnswers) {
            const answers = [...question.answers];
            const correctAnswer = question.correctAnswer;
            
            // Shuffle the answers array
            for (let i = answers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [answers[i], answers[j]] = [answers[j], answers[i]];
            }
            
            // Find new position of correct answer
            const newCorrectIndex = answers.findIndex(answer => answer === question.answers[correctAnswer]);
            
            question.answers = answers;
            question.correctAnswer = newCorrectIndex;
        }
        
        return question;
    }

    submitAnswer(playerId, answerIndex) {
        if (!this.currentQuestion) {
            return false;
        }
        
        // Check if answer changes are allowed
        if (this.playerAnswers.has(playerId) && !this.gameSettings.allowAnswerChanges) {
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
                if (correctPlayers.length < 3 && this.gameSettings.bonusPoints > 0) {
                    points += this.gameSettings.bonusPoints;
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

    getAvailableCategories() {
        const categories = [...new Set(quotes.map(quote => quote.category))];
        return categories.sort();
    }

    getAvailableDifficulties() {
        const difficulties = [...new Set(quotes.map(quote => quote.difficulty))];
        return difficulties.sort();
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
            id: socket.id,
            avatar: data.playerAvatar || '🎮',
            isHost: true
        });
        
        games.set(gameCode, game);
        players.set(socket.id, { gameCode, isHost: true });
        
        socket.join(gameCode);
        console.log('Game created with code:', gameCode);
        socket.emit('gameCreated', { gameCode, isHost: true });
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
            id: socket.id,
            avatar: data.playerAvatar || '🎮',
            isHost: false
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
            player: { name: data.playerName, id: socket.id, avatar: data.playerAvatar || '🎮', ready: false, score: 0 }
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
            message: data.message,
            context: data.context || 'lobby'
        });
    });

    // Reaction
    socket.on('reaction', (data) => {
        const player = players.get(socket.id);
        if (!player) return;

        const game = games.get(player.gameCode);
        if (!game) return;

        const playerData = game.players.get(socket.id);
        if (!playerData) return;

        io.to(player.gameCode).emit('reaction', {
            sender: playerData.name,
            reaction: data.reaction
        });
    });

    // Update game settings
    socket.on('updateGameSettings', (data) => {
        const player = players.get(socket.id);
        if (!player) return;

        const game = games.get(player.gameCode);
        if (!game || game.hostId !== socket.id) return;

        // Update game settings
        game.gameSettings = { ...game.gameSettings, ...data };
        game.totalRounds = game.gameSettings.totalRounds;

        // Notify all players of settings update
        io.to(player.gameCode).emit('gameSettingsUpdated', game.gameSettings);
    });

    // Get available categories and difficulties
    socket.on('getQuestionOptions', () => {
        const categories = [...new Set(quotes.map(quote => quote.category))].sort();
        const difficulties = [...new Set(quotes.map(quote => quote.difficulty))].sort();
        
        socket.emit('questionOptions', { categories, difficulties });
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
        
        // Reset all player scores and status
        game.players.forEach(player => {
            player.ready = false;
            player.answered = false;
            player.score = 0;
        });
        
        // Clear and reset scores map
        game.scores.clear();
        game.players.forEach((_, playerId) => {
            game.scores.set(playerId, 0);
        });

        // Emit updated player data with reset scores
        const playersObject = {};
        game.players.forEach((player, playerId) => {
            playersObject[playerId] = player;
        });

        io.to(player.gameCode).emit('gameReset', { players: playersObject });
    });

    // Leave game
    socket.on('leaveGame', () => {
        const player = players.get(socket.id);
        if (!player) return;

        const game = games.get(player.gameCode);
        if (!game) return;

        const playerData = game.players.get(socket.id);
        if (!playerData) return;

        // Remove player from game
        game.players.delete(socket.id);
        players.delete(socket.id);

        // Notify other players
        const playersObject = Object.fromEntries(game.players);
        socket.to(player.gameCode).emit('playerLeft', {
            playerId: socket.id,
            playerName: playerData.name
        });

        // If no players left, delete the game
        if (game.players.size === 0) {
            games.delete(player.gameCode);
        }

        // Leave the game room
        socket.leave(player.gameCode);
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