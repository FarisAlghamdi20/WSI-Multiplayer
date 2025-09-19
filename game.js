// Sound Manager
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        this.activeContexts = []; // Track active audio contexts
        this.stopped = false; // Flag to prevent new sounds after stopAll
        this.audioContext = null;
        this.initialized = false;
        this.initSounds();
    }

    initSounds() {
        // Create audio contexts for different sound effects
        this.sounds = {
            correct: this.createTone(800, 0.2, 'sine'),
            incorrect: this.createTone(200, 0.3, 'sawtooth'),
            timer: this.createTone(600, 0.1, 'square'),
            join: this.createTone(1000, 0.2, 'sine'),
            leave: this.createTone(400, 0.3, 'triangle'),
            ready: this.createTone(1200, 0.2, 'sine'),
            start: this.createTone(1500, 0.5, 'sine'),
            win: this.createMelody([800, 1000, 1200, 1500], 0.1),
            lose: this.createMelody([400, 350, 300], 0.2)
        };
    }

    initAudioContext() {
        if (!this.initialized && !this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.initialized = true;
            } catch (error) {
                console.warn('AudioContext not supported:', error);
                this.enabled = false;
            }
        }
        return this.audioContext;
    }

    createTone(frequency, duration, type = 'sine') {
        return () => {
            if (!this.enabled || this.stopped) return;
            
            const audioContext = this.initAudioContext();
            if (!audioContext) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
    }

    createMelody(frequencies, noteDuration) {
        return () => {
            if (!this.enabled || this.stopped) return;
            
            const audioContext = this.initAudioContext();
            if (!audioContext) return;
            
            // Track this melody for potential stopping
            const melodyId = Date.now() + Math.random();
            this.activeMelodies = this.activeMelodies || [];
            this.activeMelodies.push(melodyId);
            
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    // Only play if this melody hasn't been stopped
                    if (this.activeMelodies && this.activeMelodies.includes(melodyId)) {
                        this.createTone(freq, noteDuration, 'sine')();
                    }
                }, index * noteDuration * 1000);
            });
            
            // Remove melody from tracking when finished
            setTimeout(() => {
                if (this.activeMelodies) {
                    const index = this.activeMelodies.indexOf(melodyId);
                    if (index > -1) {
                        this.activeMelodies.splice(index, 1);
                    }
                }
            }, frequencies.length * noteDuration * 1000 + 100);
        };
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    stopAll() {
        // Set flag to prevent new sounds
        this.stopped = true;
        
        // Stop all active melodies
        if (this.activeMelodies) {
            this.activeMelodies = [];
        }
        
        // Close all active audio contexts
        this.activeContexts.forEach(context => {
            try {
                if (context.state !== 'closed') {
                    context.close();
                }
            } catch (e) {
                // Ignore errors if context is already closed
            }
        });
        this.activeContexts = [];
        
        // Close the main audio context
        if (this.audioContext) {
            try {
                if (this.audioContext.state !== 'closed') {
                    this.audioContext.close();
                }
                this.audioContext = null;
                this.initialized = false;
            } catch (e) {
                // Ignore errors if context is already closed
            }
        }
    }
    
    reset() {
        // Reset the stopped flag to allow sounds again
        this.stopped = false;
        this.activeContexts = [];
        this.activeMelodies = [];
        this.audioContext = null;
        this.initialized = false;
    }
}

// Game State Management
class GameState {
    constructor() {
        this.socket = null;
        this.playerId = null;
        this.playerName = '';
        this.playerAvatar = '🎮';
        this.gameCode = '';
        this.isHost = false;
        this.players = new Map();
        this.currentQuestion = null;
        this.gameStarted = false;
        this.answered = false;
        this.score = 0;
        this.currentRound = 0;
        this.totalRounds = 10;
        this.timer = null;
        this.timeLeft = 15;
        this.soundManager = new SoundManager();
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
        this.questionOptions = {
            categories: [],
            difficulties: []
        };
    }

    // Reset game state to initial values
    resetGameState() {
        this.playerId = null;
        this.playerName = '';
        this.playerAvatar = '🎮';
        this.gameCode = '';
        this.isHost = false;
        this.players.clear();
        this.currentQuestion = null;
        this.gameStarted = false;
        this.answered = false;
        this.ready = false; // Reset ready state
        this.score = 0;
        this.currentRound = 0;
        this.totalRounds = 10;
        this.stopTimer();
        this.timeLeft = 15;
        
        // Reset sound manager
        this.soundManager.reset();
        
        // Reset game settings to defaults
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

    // Initialize socket connection
    initSocket() {
        this.socket = io({
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true
        });
        
        // Initialize audio on first user interaction
        this.initAudioOnInteraction();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.hideLoading();
            this.showScreen('landing');
            this.showToast('تم الاتصال بالخادم!', 'success');
            // Don't play sound immediately - wait for user interaction
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.showToast('فشل في الاتصال بالخادم. جاري إعادة المحاولة...', 'error');
            this.hideLoading();
            
            // Retry connection after 3 seconds
            setTimeout(() => {
                if (!this.socket.connected) {
                    this.socket.connect();
                }
            }, 3000);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.resetGameState();
            this.showScreen('landing');
            this.showToast('فُقد الاتصال. يرجى تحديث الصفحة لإعادة الاتصال.', 'error');
        });

        this.socket.on('gameCreated', (data) => {
            console.log('Received gameCreated event:', data);
            this.gameCode = data.gameCode;
            this.isHost = true;
            console.log('Host status set to:', this.isHost);
            
            // Reset sound manager for new game
            this.soundManager.reset();
            
            // Add the current player to the players list
            this.players.set(this.socket.id, {
                name: this.playerName,
                id: this.socket.id,
                avatar: this.playerAvatar,
                ready: false,
                score: 0
            });
            
            this.hideLoading();
            this.showScreen('lobby');
            
            // Reset ready button UI
            const readyBtn = document.getElementById('readyBtn');
            if (readyBtn) {
                readyBtn.textContent = 'جاهز';
                readyBtn.className = 'btn btn-primary';
            }
            
            // Force lobby screen to be visible at top of page
            const lobbyScreen = document.getElementById('lobby');
            if (lobbyScreen) {
                lobbyScreen.style.position = 'fixed';
                lobbyScreen.style.top = '0';
                lobbyScreen.style.left = '0';
                lobbyScreen.style.width = '100%';
                lobbyScreen.style.height = '100vh';
                lobbyScreen.style.zIndex = '1000';
                lobbyScreen.style.overflow = 'auto';
                lobbyScreen.style.backgroundColor = 'rgba(102, 126, 234, 0.9)';
            }
            
            this.updateLobbyUI();
            this.showToast('تم إنشاء اللعبة بنجاح!', 'success');
        });

        this.socket.on('gameJoined', (data) => {
            console.log('Received gameJoined event:', data);
            console.log('Players data type:', typeof data.players);
            console.log('Players data:', data.players);
            
            this.gameCode = data.gameCode;
            this.isHost = data.isHost;
            
            // Reset sound manager for new game
            this.soundManager.reset();
            console.log('Host status set to:', this.isHost);
            
            // Convert players object to Map safely
            this.players = new Map();
            if (data.players && typeof data.players === 'object') {
                Object.entries(data.players).forEach(([playerId, player]) => {
                    this.players.set(playerId, player);
                });
                console.log('Converted players to Map, count:', this.players.size);
            } else {
                console.error('Invalid players data received:', data.players);
            }
            
            this.hideLoading();
            this.showScreen('lobby');
            
            // Reset ready button UI
            const readyBtn = document.getElementById('readyBtn');
            if (readyBtn) {
                readyBtn.textContent = 'جاهز';
                readyBtn.className = 'btn btn-primary';
            }
            
            // Force lobby screen to be visible at top of page
            const lobbyScreen = document.getElementById('lobby');
            if (lobbyScreen) {
                lobbyScreen.style.position = 'fixed';
                lobbyScreen.style.top = '0';
                lobbyScreen.style.left = '0';
                lobbyScreen.style.width = '100%';
                lobbyScreen.style.height = '100vh';
                lobbyScreen.style.zIndex = '1000';
                lobbyScreen.style.overflow = 'auto';
                lobbyScreen.style.backgroundColor = 'rgba(102, 126, 234, 0.9)';
            }
            
            this.updateLobbyUI();
            this.showToast('تم الانضمام للعبة بنجاح!', 'success');
        });

        this.socket.on('playerJoined', (data) => {
            this.players.set(data.playerId, data.player);
            this.updateLobbyUI();
            this.showToast(`${data.player.name} انضم للعبة`, 'info');
            this.soundManager.play('join');
        });

        this.socket.on('playerLeft', (data) => {
            this.players.delete(data.playerId);
            this.updateLobbyUI();
            this.updateScoreboard(); // Update scoreboard when player leaves
            this.showToast(`${data.playerName} غادر اللعبة`, 'info');
            this.soundManager.play('leave');
        });

        this.socket.on('playerReady', (data) => {
            console.log('Player ready status changed:', data);
            const player = this.players.get(data.playerId);
            if (player) {
                player.ready = data.ready;
                this.updateLobbyUI();
                
                // Update ready button if it's the current player
                if (data.playerId === this.socket.id) {
                    const readyBtn = document.getElementById('readyBtn');
                    readyBtn.textContent = data.ready ? 'غير جاهز' : 'جاهز';
                    readyBtn.className = data.ready ? 'btn btn-danger' : 'btn btn-primary';
                }
                
                this.soundManager.play('ready');
            }
        });

        this.socket.on('gameStarted', (data) => {
            console.log('Game started!');
            this.gameStarted = true;
            this.currentRound = 0;
            this.showScreen('game');
            
            // Force game screen to be visible at top of page
            const gameScreen = document.getElementById('game');
            if (gameScreen) {
                gameScreen.style.position = 'fixed';
                gameScreen.style.top = '0';
                gameScreen.style.left = '0';
                gameScreen.style.width = '100%';
                gameScreen.style.height = '100vh';
                gameScreen.style.zIndex = '1000';
                gameScreen.style.overflow = 'auto';
                gameScreen.style.backgroundColor = 'rgba(102, 126, 234, 0.9)';
            }
            
            this.showToast('بدأت اللعبة! استعد!', 'success');
            this.soundManager.play('start');
        });

        this.socket.on('questionData', (data) => {
            console.log('Received question data:', data);
            this.currentQuestion = data;
            this.answered = false;
            this.timeLeft = 15;
            this.currentRound++;
            this.updateQuestionUI();
            this.startTimer();
        });

        this.socket.on('playerAnswered', (data) => {
            const player = this.players.get(data.playerId);
            if (player) {
                player.answered = true;
            }
        });

        this.socket.on('questionResults', (data) => {
            this.stopTimer();
            this.showQuestionResults(data);
        });

        this.socket.on('roundComplete', (data) => {
            this.currentRound = data.round;
            if (data.round >= this.totalRounds) {
                this.showGameOver(data.finalScores);
            } else {
                this.showScreen('results');
                this.updateResultsUI(data);
            }
        });

        this.socket.on('gameOver', (data) => {
            console.log('Game over received:', data);
            this.showGameOver(data.finalScores);
        });

        this.socket.on('gameReset', (data) => {
            console.log('Game reset received');
            this.gameStarted = false;
            this.currentRound = 0;
            this.answered = false;
            
            // Update players with reset scores if provided
            if (data && data.players) {
                this.players = new Map();
                Object.entries(data.players).forEach(([playerId, player]) => {
                    this.players.set(playerId, player);
                });
            }
            
            this.showScreen('lobby');
            
            // Force lobby screen to be visible
            const lobbyScreen = document.getElementById('lobby');
            if (lobbyScreen) {
                lobbyScreen.style.position = 'fixed';
                lobbyScreen.style.top = '0';
                lobbyScreen.style.left = '0';
                lobbyScreen.style.width = '100%';
                lobbyScreen.style.height = '100vh';
                lobbyScreen.style.zIndex = '1000';
                lobbyScreen.style.overflow = 'auto';
                lobbyScreen.style.backgroundColor = 'rgba(102, 126, 234, 0.9)';
            }
            
            // Reset ready button state
            const readyBtn = document.getElementById('readyBtn');
            readyBtn.textContent = 'جاهز';
            readyBtn.className = 'btn btn-primary';
            
            this.updateLobbyUI();
            this.showToast('تم إعادة تعيين اللعبة! استعد لجولة أخرى!', 'info');
        });

        this.socket.on('chatMessage', (data) => {
            this.addChatMessage(data);
        });


        this.socket.on('gameSettingsUpdated', (data) => {
            this.gameSettings = { ...this.gameSettings, ...data };
            this.totalRounds = this.gameSettings.totalRounds;
            this.showToast('تم تحديث إعدادات اللعبة!', 'info');
        });

        this.socket.on('questionOptions', (data) => {
            this.questionOptions = data;
            this.populateQuestionOptions();
        });

        this.socket.on('error', (data) => {
            this.showToast(data.message, 'error');
        });
    }

    // Initialize audio on first user interaction
    initAudioOnInteraction() {
        const initAudio = () => {
            if (!this.soundManager.initialized) {
                this.soundManager.initAudioContext();
                // Play a subtle sound to confirm audio is working
                this.soundManager.play('join');
            }
        };

        // Add event listeners for common user interactions
        const events = ['click', 'keydown', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, initAudio, { once: true });
        });
    }

    // UI Management
    showScreen(screenId) {
        console.log('Switching to screen:', screenId);
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            console.log('Removed active from:', screen.id);
        });
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            console.log('Screen switched to:', screenId);
            console.log('Target screen classes:', targetScreen.className);
            console.log('Target screen display:', window.getComputedStyle(targetScreen).display);
        } else {
            console.error('Screen not found:', screenId);
        }
    }

    showLoading(message = 'جاري الاتصال...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = overlay.querySelector('p');
        text.textContent = message;
        overlay.classList.add('active');
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            console.log('Loading overlay hidden');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        const container = document.getElementById('toastContainer');
        container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }

    // Lobby UI Updates
    updateLobbyUI() {
        this.updateGameCode();
        this.updatePlayerCount();
        this.updatePlayersList();
        this.updateStartButton();
    }

    updateGameCode() {
        document.getElementById('lobbyGameCode').textContent = this.gameCode;
    }

    updatePlayerCount() {
        document.getElementById('playerCount').textContent = this.players.size;
    }

    updatePlayersList() {
        const playersList = document.getElementById('playersList');
        if (!playersList) {
            return;
        }
        
        playersList.innerHTML = '';
        
        this.players.forEach((player, playerId) => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            
            // Create name element with avatar inline
            const name = document.createElement('div');
            name.className = 'player-name';
            
            // Add avatar next to name
            const avatar = document.createElement('span');
            avatar.className = `player-avatar-inline ${player.avatar ? 'emoji' : ''}`;
            
            // Ensure current player sees their own avatar correctly
            if (playerId === this.socket.id && this.playerAvatar) {
                avatar.textContent = this.playerAvatar;
            } else if (player.avatar) {
                avatar.textContent = player.avatar;
            } else {
                avatar.style.backgroundColor = this.getPlayerColor(playerId);
                avatar.textContent = player.name.charAt(0).toUpperCase();
            }
            
            // Add host indicator - show for the host player
            if (player.isHost) {
                const hostIndicator = document.createElement('span');
                hostIndicator.className = 'host-indicator';
                hostIndicator.textContent = ' 👑';
                name.appendChild(avatar);
                name.appendChild(document.createTextNode(' ' + player.name));
                name.appendChild(hostIndicator);
            } else {
                name.appendChild(avatar);
                name.appendChild(document.createTextNode(' ' + player.name));
            }
            
            const status = document.createElement('div');
            status.className = `player-status ${player.ready ? 'ready' : 'not-ready'}`;
            status.textContent = player.ready ? 'جاهز' : 'في الانتظار';
            
            playerItem.appendChild(name);
            playerItem.appendChild(status);
            playersList.appendChild(playerItem);
        });
    }

    updateStartButton() {
        const startBtn = document.getElementById('startGameBtn');
        const allReady = Array.from(this.players.values()).every(player => player.ready);
        const hasEnoughPlayers = this.players.size >= 1; // Allow solo games
        
        
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


    populateQuestionOptions() {
        // Populate categories
        const categoriesSelect = document.getElementById('questionCategories');
        if (categoriesSelect) {
            categoriesSelect.innerHTML = '<option value="All" selected>جميع الفئات</option>';
            this.questionOptions.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoriesSelect.appendChild(option);
            });
        }

        // Populate difficulties
        const difficultySelect = document.getElementById('questionDifficulty');
        if (difficultySelect) {
            difficultySelect.innerHTML = '<option value="All" selected>جميع المستويات</option>';
            this.questionOptions.difficulties.forEach(difficulty => {
                const option = document.createElement('option');
                option.value = difficulty;
                option.textContent = difficulty;
                difficultySelect.appendChild(option);
            });
        }
    }

    // Game UI Updates
    updateQuestionUI() {
        if (!this.currentQuestion) return;
        
        document.getElementById('currentQuestion').textContent = this.currentRound;
        document.getElementById('totalQuestions').textContent = this.totalRounds;
        document.getElementById('quoteText').textContent = this.currentQuestion.quote;
        
        
        const answersList = document.getElementById('answersList');
        answersList.innerHTML = '';
        
        this.currentQuestion.answers.forEach((answer, index) => {
            const answerOption = document.createElement('div');
            answerOption.className = 'answer-option';
            answerOption.textContent = answer;
            answerOption.dataset.index = index;
            
            answerOption.addEventListener('click', () => {
                if (!this.answered) {
                    this.selectAnswer(index);
                }
            });
            
            answersList.appendChild(answerOption);
        });
        
        this.updateScoreboard();
    }


    updateScoreboard() {
        const scoreboardList = document.getElementById('scoreboardList');
        scoreboardList.innerHTML = '';
        
        const sortedPlayers = Array.from(this.players.values())
            .sort((a, b) => (b.score || 0) - (a.score || 0));
        
        sortedPlayers.forEach(player => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'scoreboard-item';
            
            // Create name element with avatar inline
            const name = document.createElement('div');
            name.className = 'player-name';
            
            // Add avatar next to name
            const avatar = document.createElement('span');
            avatar.className = `player-avatar-inline ${player.avatar ? 'emoji' : ''}`;
            
            // Ensure current player sees their own avatar correctly
            const playerId = Array.from(this.players.keys()).find(id => this.players.get(id) === player);
            if (playerId === this.socket.id && this.playerAvatar) {
                avatar.textContent = this.playerAvatar;
            } else if (player.avatar) {
                avatar.textContent = player.avatar;
            } else {
                avatar.style.backgroundColor = this.getPlayerColor(playerId);
                avatar.textContent = player.name.charAt(0).toUpperCase();
            }
            
            name.appendChild(avatar);
            name.appendChild(document.createTextNode(' ' + player.name));
            
            const score = document.createElement('div');
            score.className = 'player-score';
            score.textContent = player.score || 0;
            
            scoreItem.appendChild(name);
            scoreItem.appendChild(score);
            scoreboardList.appendChild(scoreItem);
        });
    }

    // Timer Management
    startTimer() {
        this.stopTimer();
        this.timeLeft = this.gameSettings.questionTimer || 15;
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            // Play timer sound when time is running low
            if (this.timeLeft <= 5 && this.timeLeft > 0) {
                this.soundManager.play('timer');
            }
            
            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.socket.emit('timeUp');
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timerDisplay');
        const timerContainer = timerDisplay.parentElement;
        
        // Show/hide timer based on settings
        if (this.gameSettings.showTimer) {
            timerContainer.style.display = 'block';
            timerDisplay.textContent = this.timeLeft;
            
            if (this.timeLeft <= 5) {
                timerContainer.classList.add('warning');
            } else {
                timerContainer.classList.remove('warning');
            }
        } else {
            timerContainer.style.display = 'none';
        }
    }

    // Game Actions
    selectAnswer(answerIndex) {
        if (this.answered && !this.gameSettings.allowAnswerChanges) return;
        
        console.log('Selecting answer:', answerIndex);
        this.answered = true;
        this.socket.emit('answerSelected', { answerIndex });
        
        // Visual feedback
        document.querySelectorAll('.answer-option').forEach((option, index) => {
            option.classList.remove('selected');
            if (index === answerIndex) {
                option.classList.add('selected');
            }
        });
        
        // Update answered status based on settings
        if (!this.gameSettings.allowAnswerChanges) {
            this.answered = true;
        }
        
        this.showToast('تم إرسال الإجابة!', 'info');
        this.soundManager.play('ready'); // Play a confirmation sound
    }

    showQuestionResults(data) {
        console.log('Showing question results:', data);
        const answers = document.querySelectorAll('.answer-option');
        const correctIndex = data.correctAnswer;
        const playerAnswer = data.playerAnswers[this.socket.id];
        
        answers.forEach((answer, index) => {
            answer.classList.remove('selected');
            if (index === correctIndex) {
                answer.classList.add('correct');
            } else if (playerAnswer === index) {
                answer.classList.add('incorrect');
            }
        });
        
        // Play appropriate sound based on answer correctness
        if (playerAnswer === correctIndex) {
            this.soundManager.play('correct');
        } else {
            this.soundManager.play('incorrect');
        }
        
        // Update scores
        this.players.forEach((player, playerId) => {
            if (data.scores[playerId]) {
                player.score = data.scores[playerId];
            }
        });
        
        this.updateScoreboard();
        
        // Show results after 3 seconds
        setTimeout(() => {
            this.socket.emit('readyForNextQuestion');
        }, 3000);
    }

    startNextQuestion() {
        this.socket.emit('getNextQuestion');
    }

    showResults(data) {
        this.showScreen('results');
        this.updateResultsUI(data);
    }

    updateResultsUI(data) {
        document.getElementById('correctAuthor').textContent = data.correctAuthor;
        document.getElementById('authorInfo').textContent = data.authorInfo || '';
        
        const finalScoreboard = document.getElementById('finalScoreboard');
        finalScoreboard.innerHTML = '';
        
        const sortedPlayers = Array.from(this.players.values())
            .sort((a, b) => (b.score || 0) - (a.score || 0));
        
        sortedPlayers.forEach((player, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'final-scoreboard-item';
            
            const name = document.createElement('div');
            name.textContent = player.name;
            
            const score = document.createElement('div');
            score.textContent = player.score || 0;
            
            scoreItem.appendChild(name);
            scoreItem.appendChild(score);
            finalScoreboard.appendChild(scoreItem);
        });
    }

    showGameOver(finalScores) {
        console.log('Game over! Final scores:', finalScores);
        this.showScreen('gameOver');
        
        // Force game over screen to be visible at top of page
        const gameOverScreen = document.getElementById('gameOver');
        if (gameOverScreen) {
            gameOverScreen.style.position = 'fixed';
            gameOverScreen.style.top = '0';
            gameOverScreen.style.left = '0';
            gameOverScreen.style.width = '100%';
            gameOverScreen.style.height = '100vh';
            gameOverScreen.style.zIndex = '1000';
            gameOverScreen.style.overflow = 'auto';
            gameOverScreen.style.backgroundColor = 'rgba(102, 126, 234, 0.9)';
        }
        
        const winner = finalScores[0];
        document.getElementById('winnerName').textContent = winner.name;
        document.getElementById('winnerScore').textContent = `${winner.score} points`;
        
        // Play win/lose sound based on player's position
        const playerScore = finalScores.find(p => p.playerId === this.socket.id);
        if (playerScore && playerScore === winner) {
            this.soundManager.play('win');
        } else {
            this.soundManager.play('lose');
        }
        
        const leaderboard = document.getElementById('finalLeaderboard');
        leaderboard.innerHTML = '';
        
        finalScores.forEach((player, index) => {
            const item = document.createElement('div');
            item.className = `final-scoreboard-item rank-${index + 1}`;
            
            const rank = document.createElement('div');
            rank.className = 'rank';
            rank.textContent = index + 1;
            
            const playerInfo = document.createElement('div');
            playerInfo.className = 'player-info';
            
            // Create name element with avatar inline
            const name = document.createElement('div');
            name.className = 'player-name-large';
            
            // Add avatar next to name
            const avatar = document.createElement('span');
            avatar.className = 'player-avatar-inline-large';
            
            // Ensure current player sees their own avatar correctly
            if (player.playerId === this.socket.id && this.playerAvatar) {
                avatar.textContent = this.playerAvatar;
            } else if (player.avatar) {
                avatar.textContent = player.avatar;
            } else {
                avatar.style.backgroundColor = this.getPlayerColor(player.playerId);
                avatar.textContent = player.name.charAt(0).toUpperCase();
            }
            
            name.appendChild(avatar);
            name.appendChild(document.createTextNode(' ' + player.name));
            
            const score = document.createElement('div');
            score.className = 'final-score';
            score.textContent = player.score;
            
            playerInfo.appendChild(name);
            item.appendChild(rank);
            item.appendChild(playerInfo);
            item.appendChild(score);
            leaderboard.appendChild(item);
        });
    }

    // Chat Management
    addChatMessage(data) {
        const context = data.context || 'lobby';
        const chatMessagesId = context === 'game' ? 'gameChatMessages' : 'chatMessages';
        const chatMessages = document.getElementById(chatMessagesId);
        
        if (!chatMessages) return; // Don't add message if chat area doesn't exist
        
        const message = document.createElement('div');
        message.className = 'chat-message';
        
        const sender = document.createElement('span');
        sender.className = 'sender';
        sender.textContent = data.sender + ': ';
        
        const content = document.createElement('span');
        content.textContent = data.message;
        
        message.appendChild(sender);
        message.appendChild(content);
        chatMessages.appendChild(message);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }


    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message) {
            this.socket.emit('chatMessage', { message });
            input.value = '';
        }
    }
    
    sendMessage(context = 'lobby') {
        const inputId = context === 'game' ? 'gameChatInput' : 'chatInput';
        const input = document.getElementById(inputId);
        const message = input.value.trim();
        
        if (message) {
            this.socket.emit('chatMessage', { message, context });
            input.value = '';
        }
    }


    // Utility Functions
    getPlayerColor(playerId) {
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#eab308',
            '#84cc16', '#22c55e', '#10b981', '#14b8a6',
            '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
            '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
        ];
        
        let hash = 0;
        for (let i = 0; i < playerId.length; i++) {
            hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }

    generateGameCode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }
}

    // Initialize Game
const game = new GameState();

// Mobile touch optimizations
function addTouchSupport() {
    // Add touch event listeners for answer options
    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('.answer-option')) {
            e.target.closest('.answer-option').classList.add('touch-active');
        }
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        if (e.target.closest('.answer-option')) {
            e.target.closest('.answer-option').classList.remove('touch-active');
        }
    }, { passive: true });
    
    // Prevent zoom on double tap for interactive elements
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
    
    // Add haptic feedback for mobile devices
    if ('vibrate' in navigator) {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.answer-option') || e.target.closest('.reaction-btn')) {
                navigator.vibrate(50); // Short vibration
            }
        });
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Show loading overlay while connecting
    game.showLoading('Connecting...');
    
    // Initialize socket connection
    game.initSocket();
    
    // Initialize mobile touch support
    addTouchSupport();
    
    // Landing page events
    document.getElementById('createGameBtn').addEventListener('click', () => {
        document.getElementById('createModal').classList.add('active');
    });
    
    document.getElementById('joinGameBtn').addEventListener('click', () => {
        document.getElementById('joinModal').classList.add('active');
    });
    
    // Create modal events
    document.getElementById('closeCreateModal').addEventListener('click', () => {
        document.getElementById('createModal').classList.remove('active');
    });
    
    // Game settings modal events
    document.getElementById('closeGameSettingsModal').addEventListener('click', () => {
        document.getElementById('gameSettingsModal').classList.remove('active');
    });
    
    // Join modal events
    document.getElementById('closeJoinModal').addEventListener('click', () => {
        document.getElementById('joinModal').classList.remove('active');
    });
    
    document.getElementById('createGameConfirm').addEventListener('click', () => {
        const playerName = document.getElementById('createPlayerName').value.trim();
        const selectedAvatar = document.querySelector('#createModal .avatar-option.selected');
        
        if (!playerName || playerName.length < 2) {
            game.showToast('يرجى إدخال اسم صحيح (حرفين على الأقل)', 'error');
            return;
        }
        
        if (!game.socket) {
            game.showToast('جاري تهيئة الاتصال...', 'info');
            game.initSocket();
            return;
        }
        
        if (!game.socket.connected) {
            game.showToast('جاري الاتصال بالخادم...', 'info');
            return;
        }
        
        game.playerName = playerName;
        game.playerAvatar = selectedAvatar ? selectedAvatar.dataset.avatar : '🎮';
        game.showLoading('جاري إنشاء اللعبة...');
        game.socket.emit('createGame', { playerName: game.playerName, playerAvatar: game.playerAvatar });
        document.getElementById('createModal').classList.remove('active');
    });
    
    document.getElementById('joinGameConfirm').addEventListener('click', () => {
        const gameCode = document.getElementById('gameCode').value.trim().toUpperCase();
        const playerName = document.getElementById('playerName').value.trim();
        const selectedAvatar = document.querySelector('#joinModal .avatar-option.selected');
        
        if (!gameCode || gameCode.length !== 6) {
            game.showToast('يرجى إدخال رمز لعبة صحيح مكون من 6 أرقام', 'error');
            return;
        }
        
        if (!playerName || playerName.length < 2) {
            game.showToast('يرجى إدخال اسم صحيح (حرفين على الأقل)', 'error');
            return;
        }
        
        if (!game.socket) {
            game.showToast('جاري تهيئة الاتصال...', 'info');
            game.initSocket();
            return;
        }
        
        if (!game.socket.connected) {
            game.showToast('جاري الاتصال بالخادم...', 'info');
            return;
        }
        
        game.gameCode = gameCode;
        game.playerName = playerName;
        game.playerAvatar = selectedAvatar ? selectedAvatar.dataset.avatar : '🎮';
        game.showLoading('جاري الانضمام للعبة...');
        game.socket.emit('joinGame', { gameCode, playerName, playerAvatar: game.playerAvatar });
        document.getElementById('joinModal').classList.remove('active');
    });
    
    // Lobby events
    document.getElementById('readyBtn').addEventListener('click', () => {
        const readyBtn = document.getElementById('readyBtn');
        const isCurrentlyReady = readyBtn.textContent === 'غير جاهز';
        const newReadyState = !isCurrentlyReady;
        
        console.log('Toggling ready state to:', newReadyState);
        game.socket.emit('toggleReady', { ready: newReadyState });
        
        // Update UI immediately for better UX
        readyBtn.textContent = newReadyState ? 'غير جاهز' : 'جاهز';
        readyBtn.className = newReadyState ? 'btn btn-danger' : 'btn btn-primary';
        
        // Also update the player's ready state in the local players map
        const currentPlayer = game.players.get(game.socket.id);
        if (currentPlayer) {
            currentPlayer.ready = newReadyState;
            game.updateLobbyUI();
        }
    });
    
    document.getElementById('startGameBtn').addEventListener('click', () => {
        game.socket.emit('startGame');
    });
    
    document.getElementById('soundToggleBtn').addEventListener('click', () => {
        const enabled = game.soundManager.toggle();
        const btn = document.getElementById('soundToggleBtn');
        btn.textContent = enabled ? '🔊 Sound' : '🔇 Sound';
        btn.className = enabled ? 'btn btn-small' : 'btn btn-small btn-secondary';
    });
    
    // Settings functionality removed - not needed for now
    
    
    // Chat events
    document.getElementById('sendMessageBtn').addEventListener('click', () => {
        game.sendChatMessage();
    });
    
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            game.sendChatMessage();
        }
    });
    
    
    // Copy game code functionality
    document.getElementById('copyCodeBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(game.gameCode).then(() => {
            game.showToast('تم نسخ رمز اللعبة إلى الحافظة!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = game.gameCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            game.showToast('تم نسخ رمز اللعبة إلى الحافظة!', 'success');
        });
    });
    
    // Game over events
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        game.socket.emit('playAgain');
    });
    
    document.getElementById('newGameBtn').addEventListener('click', () => {
        game.resetGameState();
        game.showScreen('landing');
    });
    
    document.getElementById('exitGameBtn').addEventListener('click', () => {
        game.resetGameState();
        game.showScreen('landing');
    });
    
    // Results events
    document.getElementById('nextQuestionBtn').addEventListener('click', () => {
        game.startNextQuestion();
    });
    
    document.getElementById('backToLobbyBtn').addEventListener('click', () => {
        game.showScreen('lobby');
    });
    
    // Avatar selection
    document.addEventListener('click', (e) => {
        if (e.target.closest('.avatar-option')) {
            const avatarOption = e.target.closest('.avatar-option');
            const modal = avatarOption.closest('.modal');
            
            // Remove previous selection in this modal
            modal.querySelectorAll('.avatar-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // Select current option
            avatarOption.classList.add('selected');
        }
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // Leave game buttons using event delegation
    document.addEventListener('click', (e) => {
        if (e.target.id === 'lobbyLeaveGameBtn' || e.target.id === 'gameLeaveGameBtn') {
            if (confirm('Are you sure you want to leave the game?')) {
                // Stop any playing sounds
                if (game.soundManager) {
                    game.soundManager.stopAll();
                }
                // Notify server that player is leaving
                if (game.socket && game.gameCode) {
                    game.socket.emit('leaveGame');
                }
                game.resetGameState();
                game.showScreen('landing');
            }
        }
    });
    
    // Game chat events
    document.getElementById('sendGameMessageBtn').addEventListener('click', () => {
        game.sendMessage('game');
    });
    
    document.getElementById('gameChatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            game.sendMessage('game');
        }
    });
    
    // Game reaction events are handled by the general reaction event listener above
});