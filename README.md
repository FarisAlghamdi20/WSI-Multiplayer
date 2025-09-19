# Who Said It - Multiplayer Trivia Game

A real-time multiplayer trivia game where players compete to identify the authors of famous quotes. Built with Node.js, Socket.io, and vanilla JavaScript.

## Features

- 🎮 **Real-time Multiplayer**: Play with 2-8 players simultaneously
- 🏆 **Competitive Scoring**: Points for correct answers + speed bonuses
- 💬 **Live Chat**: Communicate with other players during the game
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎯 **Quick Setup**: Join games with simple 6-digit codes
- ⚡ **Fast-paced**: 15-second timer per question

## How to Play

1. **Create or Join a Game**
   - Host creates a game and shares the 6-digit code
   - Players join using the game code

2. **Lobby Phase**
   - All players must click "Ready" to start
   - Host can start the game when everyone is ready

3. **Gameplay**
   - Read the famous quote
   - Choose the correct author from 4 options
   - Answer quickly for bonus points!

4. **Scoring**
   - +10 points for correct answers
   - +5 bonus points for being in the first 3 correct answers

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd who-said-it-multiplayer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Development

To run in development mode with auto-restart:

```bash
npm run dev
```

## Technology Stack

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.io
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Modern CSS with responsive design
- **Deployment**: Ready for Heroku, Vercel, or any Node.js hosting

## Game Architecture

### Client-Side (Frontend)
- **GameState Class**: Manages game state and UI updates
- **Socket.io Client**: Handles real-time communication
- **Responsive UI**: Modern, mobile-friendly interface

### Server-Side (Backend)
- **Express Server**: Serves static files and handles HTTP requests
- **Socket.io Server**: Manages real-time game events
- **Game Class**: Handles game logic, scoring, and state management

## API Endpoints

### Socket Events

#### Client to Server
- `createGame`: Create a new game session
- `joinGame`: Join an existing game with code
- `toggleReady`: Toggle player ready status
- `startGame`: Start the game (host only)
- `answerSelected`: Submit answer for current question
- `chatMessage`: Send chat message
- `playAgain`: Reset game for another round

#### Server to Client
- `gameCreated`: Game created successfully
- `gameJoined`: Successfully joined game
- `playerJoined`: Another player joined
- `playerLeft`: Player left the game
- `playerReady`: Player ready status changed
- `gameStarted`: Game has started
- `questionData`: New question data
- `playerAnswered`: Player submitted answer
- `questionResults`: Question results and scores
- `gameOver`: Game completed

## Customization

### Adding New Quotes
Edit the `quotes` array in `server.js`:

```javascript
{
    quote: "Your quote here",
    author: "Author Name",
    answers: ["Correct", "Wrong 1", "Wrong 2", "Wrong 3"],
    correctAnswer: 0,
    authorInfo: "Additional info about the author"
}
```

### Styling
- Main styles: `styles.css`
- Color scheme: CSS custom properties
- Responsive breakpoints: Mobile-first design

### Game Settings
Modify these values in `server.js`:
- `totalRounds`: Number of questions per game
- Question timer: Currently 15 seconds
- Scoring: 10 points + 5 bonus for speed

## Deployment

### Heroku
1. Create a `Procfile`:
   ```
   web: node server.js
   ```

2. Deploy:
   ```bash
   git push heroku main
   ```

### Vercel
1. Add `vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

### Other Platforms
The app is compatible with any Node.js hosting platform that supports WebSockets.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Have fun playing Who Said It!** 🎉