// Mobile Game JavaScript - Retro Quiz Style
// Handles mobile UI interactions and game logic

class MobileGame {
    constructor() {
        // Socket and connection
        this.socket = null;
        this.playerId = null;
        
        // Player data
        this.playerName = '';
        this.playerAvatar = '🎮';
        this.gameCode = '';
        this.isHost = false;
        this.isReady = false;
        
        // Game state
        this.gameStarted = false;
        this.answered = false;
        this.score = 0;
        this.currentRound = 0;
        this.totalRounds = 10;
        this.currentQuestion = null;
        this.selectedAnswer = null;
        
        // Timer management
        this.timer = null;
        this.timeLeft = 15;
        
        // Players management
        this.players = new Map();
        
        // UI state
        this.currentScreen = 'mobile-home';
        
        // Game settings (matching desktop)
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
        
        // Question options
        this.questionOptions = {
            categories: [],
            difficulties: []
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.connectToServer();
        this.showScreen('mobile-home');
    }

    // Reset game state to initial values (matching desktop)
    resetGameState() {
        this.playerId = null;
        this.playerName = '';
        this.playerAvatar = '🎮';
        this.gameCode = '';
        this.isHost = false;
        this.isReady = false;
        this.players.clear();
        this.currentQuestion = null;
        this.gameStarted = false;
        this.answered = false;
        this.score = 0;
        this.currentRound = 0;
        this.selectedAnswer = null;
        this.timeLeft = 15;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    connectToServer() {
        this.socket = io();
        
        // Socket event listeners
        this.socket.on('connect', () => {
            console.log('✅ Connected to server! Socket ID:', this.socket.id);
            this.playerId = this.socket.id;
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
        });

        this.socket.on('gameCreated', (data) => {
            console.log('🎮 Game created event received:', data);
            this.gameCode = data.gameCode;
            this.isHost = true; // Set host status
            
            // Add the current player to the players list (matching desktop)
            this.players.set(this.socket.id, {
                name: this.playerName,
                id: this.socket.id,
                avatar: this.playerAvatar,
                ready: false,
                score: 0,
                isHost: true
            });
            
            this.hideModal('mobileCreateModal');
            this.showLoading(false); // Hide loading overlay
            this.showLobby();
            this.showToast('تم إنشاء الغرفة بنجاح!', 'success');
        });

        this.socket.on('gameJoined', (data) => {
            this.gameCode = data.gameCode;
            this.isHost = data.isHost || false;
            
            // Populate players map from server data (matching desktop)
            this.players.clear();
            Object.entries(data.players).forEach(([playerId, playerData]) => {
                this.players.set(playerId, playerData);
            });
            
            this.hideModal('mobileJoinModal');
            this.showLoading(false); // Hide loading overlay
            this.showLobby();
            this.updatePlayersList(data.players);
            this.showToast('تم الانضمام للغرفة بنجاح!', 'success');
        });

        this.socket.on('playerJoined', (data) => {
            // Add player to players map (matching desktop)
            this.players.set(data.playerId, {
                name: data.player.name,
                id: data.playerId,
                avatar: data.player.avatar,
                ready: data.player.ready || false,
                score: data.player.score || 0,
                isHost: data.player.isHost || false
            });
            
            this.addPlayerToList(data.player.name, data.player.avatar, data.player.isHost, data.playerId, data.player.ready);
            this.updatePlayerCount();
        });

        this.socket.on('playerLeft', (data) => {
            // Remove player from players map (matching desktop)
            this.players.delete(data.playerId);
            
            this.removePlayerFromList(data.playerId);
            this.updatePlayerCount();
            this.showToast(`${data.playerName} غادر اللعبة`, 'info');
        });

        this.socket.on('playerReady', (data) => {
            // Update player ready status in players map (matching desktop)
            const player = this.players.get(data.playerId);
            if (player) {
                player.ready = data.ready;
            }
            
            this.updatePlayerReadyStatus(data.playerId, data.ready);
        });

        this.socket.on('gameStarted', () => {
            // Set game state (matching desktop)
            this.gameStarted = true;
            this.currentRound = 0;
            this.answered = false;
            
            this.showLoading(false); // Hide loading overlay
            this.showGameScreen();
            this.showToast('بدأت اللعبة!', 'success');
        });

        this.socket.on('questionData', (question) => {
            // Update game state (matching desktop)
            this.currentQuestion = question;
            this.answered = false;
            this.timeLeft = this.gameSettings.questionTimer;
            this.currentRound++;
            
            this.loadQuestion(question);
            this.startTimer();
        });

        this.socket.on('playerAnswered', (data) => {
            // Update player answered status (matching desktop)
            const player = this.players.get(data.playerId);
            if (player) {
                player.answered = true;
            }
            console.log(`Player ${data.playerId} answered`);
        });

        this.socket.on('questionResults', (data) => {
            this.stopTimer(); // Stop timer when results arrive (matching desktop)
            this.showQuestionResults(data);
        });

        this.socket.on('gameOver', (data) => {
            this.showGameOver(data.finalScores);
        });

        this.socket.on('gameReset', (data) => {
            // Reset game state (matching desktop)
            this.gameStarted = false;
            this.currentRound = 0;
            this.answered = false;
            this.score = 0;
            
            // Reset all player scores and status
            this.players.forEach(player => {
                player.ready = false;
                player.answered = false;
                player.score = 0;
            });
            
            // Update players list with reset data
            if (data && data.players) {
                this.updatePlayersList(data.players);
            }
            
            console.log('Game reset received');
        });

        this.socket.on('error', (data) => {
            this.showLoading(false); // Hide loading overlay on error
            this.showToast(data.message, 'error');
        });

        this.socket.on('chatMessage', (data) => {
            this.addChatMessage(data.sender, data.message, data.context);
        });
    }

    setupEventListeners() {
        // Home screen buttons
        document.getElementById('mobileCreateBtn').addEventListener('click', () => {
            this.showModal('mobileCreateModal');
        });

        document.getElementById('mobileJoinBtn').addEventListener('click', () => {
            this.showModal('mobileJoinModal');
        });

        // Modal close buttons
        document.getElementById('closeMobileCreateModal').addEventListener('click', () => {
            this.hideModal('mobileCreateModal');
        });

        document.getElementById('closeMobileJoinModal').addEventListener('click', () => {
            this.hideModal('mobileJoinModal');
        });

        // Create game
        document.getElementById('mobileCreateConfirm').addEventListener('click', () => {
            this.createGame();
        });

        // Join game
        document.getElementById('mobileJoinConfirm').addEventListener('click', () => {
            this.joinGame();
        });

        // Avatar selection
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectAvatar(e.target);
            });
        });

        // Lobby actions
        document.getElementById('mobileReadyBtn').addEventListener('click', () => {
            this.toggleReady();
        });

        document.getElementById('mobileStartBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('mobileLeaveBtn').addEventListener('click', () => {
            this.leaveGame();
        });

        document.getElementById('mobileCopyCode').addEventListener('click', () => {
            this.copyGameCode();
        });

        // Game actions
        document.getElementById('mobileGameLeaveBtn').addEventListener('click', () => {
            this.leaveGame();
        });

        // Results actions - removed since we auto-continue now

        // Game over actions
        document.getElementById('mobilePlayAgainBtn').addEventListener('click', () => {
            this.playAgain();
        });

        document.getElementById('mobileNewGameBtn').addEventListener('click', () => {
            this.newGame();
        });

        document.getElementById('mobileExitBtn').addEventListener('click', () => {
            this.exitGame();
        });

        // Input validation
        document.getElementById('mobilePlayerName').addEventListener('input', (e) => {
            this.validateInput(e.target);
        });

        document.getElementById('mobileJoinPlayerName').addEventListener('input', (e) => {
            this.validateInput(e.target);
        });

        document.getElementById('mobileGameCode').addEventListener('input', (e) => {
            this.validateGameCode(e.target);
        });
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.mobile-screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            console.log(`✅ Screen ${screenId} is now active`);

            // Add animation
            targetScreen.classList.add('fade-in');
            setTimeout(() => {
                targetScreen.classList.remove('fade-in');
            }, 500);
        } else {
            console.error(`❌ Screen ${screenId} not found!`);
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.getElementById(modalId).classList.add('slide-up');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.getElementById(modalId).classList.remove('slide-up');
    }

    selectAvatar(element) {
        // Remove previous selection
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Select new avatar
        element.classList.add('selected');
        this.playerAvatar = element.dataset.avatar;
    }

    validateInput(input) {
        const value = input.value.trim();
        const button = input.closest('.modal-body').querySelector('.retro-btn');
        
        if (value.length >= 2) {
            button.disabled = false;
            button.style.opacity = '1';
        } else {
            button.disabled = true;
            button.style.opacity = '0.6';
        }
    }

    validateGameCode(input) {
        const value = input.value.trim();
        const button = input.closest('.modal-body').querySelector('.retro-btn');
        
        if (value.length === 6 && /^\d+$/.test(value)) {
            button.disabled = false;
            button.style.opacity = '1';
        } else {
            button.disabled = true;
            button.style.opacity = '0.6';
        }
    }

    createGame() {
        const playerName = document.getElementById('mobilePlayerName').value.trim();
        
        if (!playerName || playerName.length < 2) {
            this.showToast('يرجى إدخال اسم صحيح', 'error');
            return;
        }

        if (!this.playerAvatar) {
            this.showToast('يرجى اختيار صورة رمزية', 'error');
            return;
        }

        this.playerName = playerName;
        this.showLoading(true);
        
        console.log('Creating game with:', {
            playerName: this.playerName,
            playerAvatar: this.playerAvatar
        });
        
        // Check if socket is connected
        if (!this.socket || !this.socket.connected) {
            this.showToast('غير متصل بالخادم', 'error');
            this.showLoading(false);
            return;
        }
        
        console.log('✅ Socket is connected, creating game...');
        
        // Create game via socket
        this.socket.emit('createGame', {
            playerName: this.playerName,
            playerAvatar: this.playerAvatar
        });
        
        // Add timeout to prevent stuck loading
        setTimeout(() => {
            if (this.currentScreen === 'mobile-home') {
                console.log('⏰ Game creation timeout - still on home screen');
                this.showLoading(false);
                this.showToast('انتهت مهلة إنشاء الغرفة', 'error');
            }
        }, 10000); // 10 second timeout
    }

    joinGame() {
        const gameCode = document.getElementById('mobileGameCode').value.trim();
        const playerName = document.getElementById('mobileJoinPlayerName').value.trim();
        
        if (!gameCode || gameCode.length !== 6) {
            this.showToast('يرجى إدخال رمز صحيح', 'error');
            return;
        }

        if (!playerName || playerName.length < 2) {
            this.showToast('يرجى إدخال اسم صحيح', 'error');
            return;
        }

        if (!this.playerAvatar) {
            this.showToast('يرجى اختيار صورة رمزية', 'error');
            return;
        }

        this.playerName = playerName;
        this.gameCode = gameCode;
        this.showLoading(true);
        
        // Join game via socket
        this.socket.emit('joinGame', {
            gameCode: this.gameCode,
            playerName: this.playerName,
            playerAvatar: this.playerAvatar
        });
    }

    showLobby() {
        console.log('🏠 Showing lobby screen...');
        this.showScreen('mobile-lobby');
        this.updateLobbyInfo();
        // Clear existing players list first
        document.getElementById('mobilePlayersList').innerHTML = '';
        // Add host to players list (not ready by default, matching desktop logic)
        this.addPlayerToList(this.playerName, this.playerAvatar, true, this.socket.id, false);
        console.log('🏠 Lobby screen shown');
    }

    updateLobbyInfo() {
        document.getElementById('mobileRoomCode').textContent = this.gameCode;
        document.getElementById('mobilePlayerCount').textContent = '1';
    }

    addPlayerToList(name, avatar, isHost = false, playerId = null, ready = false) {
        const playersList = document.getElementById('mobilePlayersList');
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        if (playerId) {
            playerCard.setAttribute('data-player-id', playerId);
        }
        
        let statusText = 'في الانتظار';
        let statusClass = '';
        
        if (isHost) {
            statusText = 'مضيف';
            statusClass = 'ready';
        } else if (ready) {
            statusText = 'جاهز';
            statusClass = 'ready';
        }
        
        playerCard.innerHTML = `
            <div class="player-avatar">${avatar}</div>
            <div class="player-name">${name}</div>
            <div class="player-status ${statusClass}">${statusText}</div>
        `;
        playersList.appendChild(playerCard);
    }

    updateReadyButton() {
        const readyBtn = document.getElementById('mobileReadyBtn');
        
        if (this.isReady) {
            readyBtn.textContent = 'غير جاهز';
            readyBtn.classList.remove('primary-btn');
            readyBtn.classList.add('secondary-btn');
        } else {
            readyBtn.textContent = 'جاهز';
            readyBtn.classList.remove('secondary-btn');
            readyBtn.classList.add('primary-btn');
        }
    }

    toggleReady() {
        this.isReady = !this.isReady;
        this.updateReadyButton();
        this.updateStartButton();

        // Send ready status to server
        this.socket.emit('toggleReady', { ready: this.isReady });
    }

    startGame() {
        this.showLoading(true);
        
        // Start game via socket
        this.socket.emit('startGame');
    }

    showGameScreen() {
        this.showScreen('mobile-game');
        this.loadQuestion();
        this.startTimer();
    }

    loadQuestion(question = null) {
        if (question) {
            this.currentQuestion = question;
        }
        
        if (!this.currentQuestion) {
            // Simulate loading question for testing
            const questionText = document.getElementById('mobileQuoteText');
            questionText.textContent = '"العلم نور والجهل ظلام"';
            
            // Simulate answer options
            const answersList = document.getElementById('mobileAnswersList');
            answersList.innerHTML = `
                <div class="answer-option" data-answer="0">أ) الإمام علي</div>
                <div class="answer-option" data-answer="1">ب) ابن سينا</div>
                <div class="answer-option" data-answer="2">ج) الخوارزمي</div>
                <div class="answer-option" data-answer="3">د) ابن خلدون</div>
            `;
        } else {
            // Use real question data (matching desktop)
            const questionText = document.getElementById('mobileQuoteText');
            questionText.textContent = this.currentQuestion.quote;
            
            const answersList = document.getElementById('mobileAnswersList');
            answersList.innerHTML = '';
            
            this.currentQuestion.answers.forEach((answer, index) => {
                const option = document.createElement('div');
                option.className = 'answer-option';
                option.dataset.answer = index;
                option.textContent = `${String.fromCharCode(65 + index)}) ${answer}`;
                answersList.appendChild(option);
            });
        }

        // Reset answer selection state
        this.selectedAnswer = null;
        this.answered = false;

        // Add click listeners to answer options
        document.querySelectorAll('.answer-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectAnswer(e.target);
            });
        });
        
        // Update question counter
        document.getElementById('mobileCurrentQuestion').textContent = this.currentRound;
        document.getElementById('mobileTotalQuestions').textContent = this.totalRounds;
        
        // Update score display
        this.updateScoreDisplay();
    }

    selectAnswer(element) {
        // Check if answer changes are allowed (matching desktop)
        if (this.answered && !this.gameSettings.allowAnswerChanges) {
            return;
        }
        
        // Remove previous selection
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Select new answer
        element.classList.add('selected');
        this.selectedAnswer = parseInt(element.dataset.answer);
        this.answered = true;
        
        // Update player answered status in players map
        const player = this.players.get(this.socket.id);
        if (player) {
            player.answered = true;
        }
        
        // Send answer to server
        this.socket.emit('answerSelected', { answerIndex: this.selectedAnswer });
        
        console.log(`Answer selected: ${this.selectedAnswer}`);
    }

    startTimer() {
        // Clear any existing timer (matching desktop)
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timeLeft = this.gameSettings.questionTimer;
        const timerDisplay = document.getElementById('mobileTimer');
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            timerDisplay.textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.timeUp();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    timeUp() {
        this.stopTimer();
        this.showToast('انتهى الوقت!', 'error');
        
        // If no answer was selected, mark as no answer
        if (!this.answered) {
            this.selectedAnswer = null;
            this.answered = true;
            
            // Update player status
            const player = this.players.get(this.socket.id);
            if (player) {
                player.answered = true;
            }
        }
        
        // Show results after a short delay
        setTimeout(() => {
            this.showResults();
        }, 2000);
    }

    showQuestionResults(data) {
        // Show results directly on game screen (matching desktop)
        const answers = document.querySelectorAll('.answer-option');
        const correctIndex = data.correctAnswer;
        
        // Clear previous player avatars from answers
        answers.forEach(answer => {
            const existingAvatars = answer.querySelectorAll('.player-avatar-container');
            existingAvatars.forEach(avatar => avatar.remove());
        });
        
        // Show player answer reveals (matching desktop)
        if (data.playerAnswerReveal) {
            // Group players by answer index
            const playersByAnswer = {};
            Object.values(data.playerAnswerReveal).forEach(playerData => {
                if (!playersByAnswer[playerData.answerIndex]) {
                    playersByAnswer[playerData.answerIndex] = [];
                }
                playersByAnswer[playerData.answerIndex].push(playerData);
            });

            // Create avatar containers for each answer
            Object.keys(playersByAnswer).forEach(answerIndex => {
                const answerElement = answers[answerIndex];
                if (answerElement) {
                    const avatarContainer = document.createElement('div');
                    avatarContainer.className = 'player-avatar-container';
                    
                    playersByAnswer[answerIndex].forEach(playerData => {
                        const playerElement = document.createElement('div');
                        playerElement.className = 'player-result';
                        
                        const avatar = document.createElement('span');
                        avatar.className = `player-avatar ${playerData.isCorrect ? 'correct' : 'incorrect'}`;
                        avatar.textContent = playerData.avatar;
                        
                        const name = document.createElement('span');
                        name.className = 'player-name';
                        name.textContent = playerData.playerName;
                        
                        playerElement.appendChild(avatar);
                        playerElement.appendChild(name);
                        avatarContainer.appendChild(playerElement);
                    });
                    
                    answerElement.appendChild(avatarContainer);
                }
            });
        }
        
        // Highlight correct and incorrect answers
        answers.forEach((answer, index) => {
            answer.classList.remove('selected');
            if (index === correctIndex) {
                answer.classList.add('correct');
            } else if (data.playerAnswers[this.socket.id] === index) {
                answer.classList.add('incorrect');
            }
        });
        
        // Update player scores (matching desktop)
        if (data.scores) {
            Object.entries(data.scores).forEach(([playerId, score]) => {
                const player = this.players.get(playerId);
                if (player) {
                    player.score = score;
                }
                
                // Update current player's score
                if (playerId === this.socket.id) {
                    this.score = score;
                }
            });
        }
        
        // Show answer explanation
        this.showAnswerExplanation(data.question);
        
        // Update score display
        this.updateScoreDisplay();
        
        // Auto-continue to next question after 3 seconds (matching desktop)
        setTimeout(() => {
            if (this.currentRound < this.totalRounds) {
                this.nextQuestion();
            } else {
                // Game is complete, show final results
                this.showGameOver(data.finalScores);
            }
        }, 3000);
    }

    // Removed showResults() - now handled by showQuestionResults()

    showAnswerExplanation(question) {
        // Create or update answer explanation element
        let explanationElement = document.getElementById('answerExplanation');
        if (!explanationElement) {
            explanationElement = document.createElement('div');
            explanationElement.id = 'answerExplanation';
            explanationElement.className = 'answer-explanation';
            
            // Insert after the question box
            const questionBox = document.querySelector('.question-box');
            if (questionBox) {
                questionBox.parentNode.insertBefore(explanationElement, questionBox.nextSibling);
            }
        }
        
        if (question && question.authorInfo) {
            explanationElement.innerHTML = `
                <div class="explanation-content">
                    <h4>المعلومات الإضافية:</h4>
                    <p>${question.authorInfo}</p>
                </div>
            `;
            explanationElement.style.display = 'block';
        } else {
            explanationElement.style.display = 'none';
        }
    }

    updateScoreDisplay() {
        const scoreElement = document.getElementById('mobilePlayerScore');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
    }

    updateScoreboard(scores = null) {
        const scoreboard = document.getElementById('mobileScoreboard');
        scoreboard.innerHTML = '';
        
        if (scores) {
            // Convert scores to array and sort by score (matching desktop)
            const sortedScores = Object.entries(scores)
                .map(([playerId, score]) => ({
                    playerId,
                    player: this.players.get(playerId),
                    score
                }))
                .filter(item => item.player) // Only include players that exist
                .sort((a, b) => b.score - a.score); // Sort by score descending
            
            sortedScores.forEach((item, index) => {
                const scoreItem = document.createElement('div');
                scoreItem.className = 'scoreboard-item';
                scoreItem.innerHTML = `
                    <div class="player-info">
                        <span class="avatar">${item.player.avatar}</span>
                        <span class="name">${item.player.name}</span>
                    </div>
                    <span class="player-score">${item.score}</span>
                `;
                scoreboard.appendChild(scoreItem);
            });
        } else {
            // Fallback for testing
            scoreboard.innerHTML = `
                <div class="scoreboard-item">
                    <div class="player-info">
                        <span class="avatar">${this.playerAvatar}</span>
                        <span class="name">${this.playerName}</span>
                    </div>
                    <span class="player-score">${this.score}</span>
                </div>
            `;
        }
    }

    nextQuestion() {
        // Clear answer highlights and avatars
        const answers = document.querySelectorAll('.answer-option');
        answers.forEach(answer => {
            answer.classList.remove('correct', 'incorrect', 'selected');
            const existingAvatars = answer.querySelectorAll('.player-avatar-container');
            existingAvatars.forEach(avatar => avatar.remove());
        });
        
        // Hide answer explanation
        const explanationElement = document.getElementById('answerExplanation');
        if (explanationElement) {
            explanationElement.style.display = 'none';
        }
        
        // Reset answer state
        this.selectedAnswer = null;
        this.answered = false;
        
        // The next question will be loaded automatically by the server
        // via the questionData event, so we just need to wait
        console.log('Waiting for next question...');
    }

    backToLobby() {
        this.showLobby();
    }

    showGameOver(finalScores) {
        this.showScreen('mobile-game-over');
        
        // Show winner
        const winner = finalScores[0];
        document.getElementById('mobileWinnerName').textContent = winner.name;
        document.getElementById('mobileWinnerScore').textContent = `${winner.score} نقطة`;
        
        // Show final leaderboard
        this.updateFinalLeaderboard(finalScores);
    }

    updateFinalLeaderboard(finalScores) {
        const leaderboard = document.getElementById('mobileFinalLeaderboard');
        leaderboard.innerHTML = '';
        
        finalScores.forEach((player, index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}`;
            item.innerHTML = `
                <span class="rank">${index + 1}</span>
                <div class="player-info">
                    <span class="avatar">🎮</span>
                    <span class="name">${player.name}</span>
                </div>
                <span class="final-score">${player.score}</span>
            `;
            leaderboard.appendChild(item);
        });
    }

    playAgain() {
        this.socket.emit('playAgain');
        this.showLobby();
    }

    newGame() {
        this.showScreen('mobile-home');
    }

    exitGame() {
        this.showScreen('mobile-home');
    }

    leaveGame() {
        this.socket.emit('leaveGame');
        this.showScreen('mobile-home');
        this.showToast('تم مغادرة اللعبة', 'info');
    }

    copyGameCode() {
        navigator.clipboard.writeText(this.gameCode).then(() => {
            this.showToast('تم نسخ الرمز!', 'success');
        }).catch(() => {
            this.showToast('فشل في نسخ الرمز', 'error');
        });
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('mobileLoadingOverlay');
        if (show) {
            loadingOverlay.classList.add('active');
        } else {
            loadingOverlay.classList.remove('active');
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('mobileToastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Missing methods for socket events
    updatePlayersList(players) {
        const playersList = document.getElementById('mobilePlayersList');
        playersList.innerHTML = '';
        
        Object.entries(players).forEach(([playerId, player]) => {
            this.addPlayerToList(player.name, player.avatar, player.isHost, playerId, player.ready);
        });
        
        this.updatePlayerCount();
    }

    removePlayerFromList(playerId) {
        const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
        if (playerCard) {
            playerCard.remove();
        }
    }

    updatePlayerCount() {
        const playersList = document.getElementById('mobilePlayersList');
        const playerCount = playersList.children.length;
        document.getElementById('mobilePlayerCount').textContent = playerCount;
        this.updateStartButton();
    }

    updateStartButton() {
        const startBtn = document.getElementById('mobileStartBtn');
        if (!startBtn) return;
        
        // Check if all players are ready
        const allReady = this.isReady; // For solo games, just check if host is ready
        const hasEnoughPlayers = true; // We have at least 1 player (the host)
        
        const canStart = this.isHost && allReady && hasEnoughPlayers;
        startBtn.disabled = !canStart;
        
        // Update button text to show why it's disabled
        if (this.isHost) {
            if (!allReady) {
                startBtn.textContent = 'في الانتظار...';
            } else {
                startBtn.textContent = 'بدء اللعبة';
            }
        }
    }

    updatePlayerReadyStatus(playerId, ready) {
        const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
        if (playerCard) {
            const statusElement = playerCard.querySelector('.player-status');
            if (statusElement) {
                statusElement.textContent = ready ? 'جاهز' : 'في الانتظار';
                statusElement.className = `player-status ${ready ? 'ready' : ''}`;
            }
        }
    }

    addChatMessage(sender, message, context) {
        // This would be implemented if chat is needed
        console.log(`Chat [${context}]: ${sender}: ${message}`);
    }
}

// Initialize mobile game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileGame = new MobileGame();
    console.log('Mobile game initialized');
});

// Handle mobile-specific events
document.addEventListener('touchstart', (e) => {
    // Add touch feedback
    if (e.target.classList.contains('retro-btn') || e.target.classList.contains('answer-option')) {
        e.target.style.transform = 'scale(0.95)';
    }
});

document.addEventListener('touchend', (e) => {
    // Remove touch feedback
    if (e.target.classList.contains('retro-btn') || e.target.classList.contains('answer-option')) {
        setTimeout(() => {
            e.target.style.transform = '';
        }, 100);
    }
});

// Prevent zoom on input focus (mobile)
document.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'INPUT') {
        e.target.style.fontSize = '16px';
    }
});

// Handle orientation change
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        // Refresh layout after orientation change
        document.body.style.height = window.innerHeight + 'px';
    }, 100);
});

// Prevent pull-to-refresh on mobile
document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Handle back button on mobile
window.addEventListener('popstate', (e) => {
    // Handle browser back button
    if (window.mobileGame) {
        window.mobileGame.showScreen('mobile-home');
    }
});
