// Game State Management
class GameState {
    constructor() {
        this.socket = null;
        this.playerId = null;
        this.playerName = '';
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
    }

    // Initialize socket connection
    initSocket() {
        this.socket = io({
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true
        });
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.hideLoading();
            this.showToast('Connected to server!', 'success');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.showToast('Failed to connect to server. Please refresh the page.', 'error');
            this.hideLoading();
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.showToast('Connection lost. Attempting to reconnect...', 'error');
        });

        this.socket.on('gameCreated', (data) => {
            console.log('Received gameCreated event:', data);
            this.gameCode = data.gameCode;
            this.isHost = true;
            
            // Add the current player to the players list
            this.players.set(this.socket.id, {
                name: this.playerName,
                id: this.socket.id,
                ready: false,
                score: 0
            });
            
            this.hideLoading();
            this.showScreen('lobby');
            
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
            this.showToast('Game created successfully!', 'success');
        });

        this.socket.on('gameJoined', (data) => {
            console.log('Received gameJoined event:', data);
            console.log('Players data type:', typeof data.players);
            console.log('Players data:', data.players);
            
            this.gameCode = data.gameCode;
            this.isHost = data.isHost;
            
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
            this.showToast('Successfully joined game!', 'success');
        });

        this.socket.on('playerJoined', (data) => {
            this.players.set(data.playerId, data.player);
            this.updateLobbyUI();
            this.showToast(`${data.player.name} joined the game`, 'info');
        });

        this.socket.on('playerLeft', (data) => {
            this.players.delete(data.playerId);
            this.updateLobbyUI();
            this.showToast(`${data.playerName} left the game`, 'info');
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
                    readyBtn.textContent = data.ready ? 'Not Ready' : 'Ready';
                    readyBtn.className = data.ready ? 'btn btn-danger' : 'btn btn-primary';
                }
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
            
            this.showToast('Game started! Get ready!', 'success');
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
                this.updatePlayersMiniUI();
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

        this.socket.on('gameReset', () => {
            console.log('Game reset received');
            this.gameStarted = false;
            this.currentRound = 0;
            this.answered = false;
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
            
            this.updateLobbyUI();
            this.showToast('Game reset! Ready up for another round!', 'info');
        });

        this.socket.on('chatMessage', (data) => {
            this.addChatMessage(data);
        });

        this.socket.on('error', (data) => {
            this.showToast(data.message, 'error');
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

    showLoading(message = 'Connecting...') {
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
        console.log('Updating lobby UI...');
        this.updateGameCode();
        this.updatePlayerCount();
        this.updatePlayersList();
        this.updateStartButton();
        console.log('Lobby UI updated');
    }

    updateGameCode() {
        document.getElementById('lobbyGameCode').textContent = this.gameCode;
    }

    updatePlayerCount() {
        document.getElementById('playerCount').textContent = this.players.size;
    }

    updatePlayersList() {
        console.log('Updating players list, players count:', this.players.size);
        const playersList = document.getElementById('playersList');
        if (!playersList) {
            console.error('playersList element not found');
            return;
        }
        
        playersList.innerHTML = '';
        
        this.players.forEach((player, playerId) => {
            console.log('Adding player to list:', player.name);
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            
            const avatar = document.createElement('div');
            avatar.className = 'player-avatar';
            avatar.style.backgroundColor = this.getPlayerColor(playerId);
            avatar.textContent = player.name.charAt(0).toUpperCase();
            
            const name = document.createElement('div');
            name.className = 'player-name';
            name.textContent = player.name;
            
            const status = document.createElement('div');
            status.className = `player-status ${player.ready ? 'ready' : 'waiting'}`;
            status.textContent = player.ready ? 'Ready' : 'Waiting';
            
            playerItem.appendChild(avatar);
            playerItem.appendChild(name);
            playerItem.appendChild(status);
            playersList.appendChild(playerItem);
        });
        console.log('Players list updated');
    }

    updateStartButton() {
        const startBtn = document.getElementById('startGameBtn');
        const allReady = Array.from(this.players.values()).every(player => player.ready);
        const hasEnoughPlayers = this.players.size >= 2;
        
        console.log('Updating start button:');
        console.log('- isHost:', this.isHost);
        console.log('- allReady:', allReady);
        console.log('- hasEnoughPlayers:', hasEnoughPlayers);
        console.log('- players count:', this.players.size);
        console.log('- players ready status:', Array.from(this.players.values()).map(p => ({ name: p.name, ready: p.ready })));
        
        const canStart = this.isHost && allReady && hasEnoughPlayers;
        startBtn.disabled = !canStart;
        
        // Update button text to show why it's disabled
        if (this.isHost) {
            if (!hasEnoughPlayers) {
                startBtn.textContent = `Need ${2 - this.players.size} more player(s)`;
            } else if (!allReady) {
                startBtn.textContent = 'Waiting for players to be ready';
            } else {
                startBtn.textContent = 'Start Game';
            }
        }
        
        console.log('- canStart:', canStart);
        console.log('- startBtn disabled:', startBtn.disabled);
    }

    // Game UI Updates
    updateQuestionUI() {
        if (!this.currentQuestion) return;
        
        console.log('Updating question UI for round:', this.currentRound);
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
        
        this.updatePlayersMiniUI();
        this.updateScoreboard();
    }

    updatePlayersMiniUI() {
        const playersMiniList = document.getElementById('playersMiniList');
        playersMiniList.innerHTML = '';
        
        this.players.forEach((player, playerId) => {
            const playerMini = document.createElement('div');
            playerMini.className = `player-mini ${player.answered ? 'answered' : 'pending'}`;
            playerMini.style.backgroundColor = this.getPlayerColor(playerId);
            playerMini.textContent = player.name.charAt(0).toUpperCase();
            playerMini.title = player.name;
            
            playersMiniList.appendChild(playerMini);
        });
    }

    updateScoreboard() {
        const scoreboardList = document.getElementById('scoreboardList');
        scoreboardList.innerHTML = '';
        
        const sortedPlayers = Array.from(this.players.values())
            .sort((a, b) => (b.score || 0) - (a.score || 0));
        
        sortedPlayers.forEach(player => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            
            const name = document.createElement('div');
            name.className = 'player-name';
            name.textContent = player.name;
            
            const score = document.createElement('div');
            score.className = 'score';
            score.textContent = player.score || 0;
            
            scoreItem.appendChild(name);
            scoreItem.appendChild(score);
            scoreboardList.appendChild(scoreItem);
        });
    }

    // Timer Management
    startTimer() {
        this.stopTimer();
        this.timeLeft = 15;
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
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
        timerDisplay.textContent = this.timeLeft;
        
        if (this.timeLeft <= 5) {
            timerDisplay.parentElement.classList.add('warning');
        } else {
            timerDisplay.parentElement.classList.remove('warning');
        }
    }

    // Game Actions
    selectAnswer(answerIndex) {
        if (this.answered) return;
        
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
        
        this.showToast('Answer submitted!', 'info');
    }

    showQuestionResults(data) {
        console.log('Showing question results:', data);
        const answers = document.querySelectorAll('.answer-option');
        const correctIndex = data.correctAnswer;
        
        answers.forEach((answer, index) => {
            answer.classList.remove('selected');
            if (index === correctIndex) {
                answer.classList.add('correct');
            } else if (data.playerAnswers[this.socket.id] === index) {
                answer.classList.add('incorrect');
            }
        });
        
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
            scoreItem.className = 'final-score-item';
            
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
        
        const leaderboard = document.getElementById('finalLeaderboard');
        leaderboard.innerHTML = '';
        
        finalScores.forEach((player, index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item rank-${index + 1}`;
            
            const rank = document.createElement('div');
            rank.className = 'rank';
            rank.textContent = index + 1;
            
            const playerInfo = document.createElement('div');
            playerInfo.className = 'player-info';
            
            const avatar = document.createElement('div');
            avatar.className = 'player-avatar-large';
            avatar.style.backgroundColor = this.getPlayerColor(player.playerId);
            avatar.textContent = player.name.charAt(0).toUpperCase();
            
            const name = document.createElement('div');
            name.textContent = player.name;
            
            const score = document.createElement('div');
            score.className = 'final-score';
            score.textContent = player.score;
            
            playerInfo.appendChild(avatar);
            playerInfo.appendChild(name);
            item.appendChild(rank);
            item.appendChild(playerInfo);
            item.appendChild(score);
            leaderboard.appendChild(item);
        });
    }

    // Chat Management
    addChatMessage(data) {
        const chatMessages = document.getElementById('chatMessages');
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize socket connection
    game.initSocket();
    
    // Landing page events
    document.getElementById('createGameBtn').addEventListener('click', () => {
        const playerName = prompt('Enter your name:');
        if (playerName && playerName.trim()) {
            game.playerName = playerName.trim();
            game.showLoading('Creating game...');
            
            // Check if socket is connected
            if (!game.socket || !game.socket.connected) {
                game.showToast('Not connected to server. Please wait...', 'error');
                game.hideLoading();
                return;
            }
            
            console.log('Creating game for player:', game.playerName);
            console.log('Socket connected:', game.socket.connected);
            game.socket.emit('createGame', { playerName: game.playerName });
            console.log('createGame event emitted');
            
            // Add timeout in case server doesn't respond
            setTimeout(() => {
                if (game.gameCode === '') {
                    console.log('No response from server, showing error');
                    game.hideLoading();
                    game.showToast('Server did not respond. Please try again.', 'error');
                }
            }, 5000);
        }
    });
    
    document.getElementById('joinGameBtn').addEventListener('click', () => {
        document.getElementById('joinModal').classList.add('active');
    });
    
    // Join modal events
    document.getElementById('closeJoinModal').addEventListener('click', () => {
        document.getElementById('joinModal').classList.remove('active');
    });
    
    document.getElementById('joinGameConfirm').addEventListener('click', () => {
        const gameCode = document.getElementById('gameCode').value.trim().toUpperCase();
        const playerName = document.getElementById('playerName').value.trim();
        
        if (!gameCode || gameCode.length !== 6) {
            game.showToast('Please enter a valid 6-digit game code', 'error');
            return;
        }
        
        if (!playerName || playerName.length < 2) {
            game.showToast('Please enter a valid name (at least 2 characters)', 'error');
            return;
        }
        
        if (!game.socket || !game.socket.connected) {
            game.showToast('Not connected to server. Please wait...', 'error');
            return;
        }
        
        game.gameCode = gameCode;
        game.playerName = playerName;
        game.showLoading('Joining game...');
        game.socket.emit('joinGame', { gameCode, playerName });
        document.getElementById('joinModal').classList.remove('active');
    });
    
    // Lobby events
    document.getElementById('readyBtn').addEventListener('click', () => {
        const readyBtn = document.getElementById('readyBtn');
        const isCurrentlyReady = readyBtn.textContent === 'Not Ready';
        const newReadyState = !isCurrentlyReady;
        
        console.log('Toggling ready state to:', newReadyState);
        game.socket.emit('toggleReady', { ready: newReadyState });
        
        // Update UI immediately for better UX
        readyBtn.textContent = newReadyState ? 'Not Ready' : 'Ready';
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
    
    document.getElementById('leaveGameBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to leave the game?')) {
            game.socket.disconnect();
            game.showScreen('landing');
        }
    });
    
    
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
            game.showToast('Game code copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = game.gameCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            game.showToast('Game code copied to clipboard!', 'success');
        });
    });
    
    // Game over events
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        game.socket.emit('playAgain');
    });
    
    document.getElementById('newGameBtn').addEventListener('click', () => {
        game.socket.disconnect();
        game.showScreen('landing');
    });
    
    document.getElementById('exitGameBtn').addEventListener('click', () => {
        game.socket.disconnect();
        game.showScreen('landing');
    });
    
    // Results events
    document.getElementById('nextQuestionBtn').addEventListener('click', () => {
        game.startNextQuestion();
    });
    
    document.getElementById('backToLobbyBtn').addEventListener('click', () => {
        game.showScreen('lobby');
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
});