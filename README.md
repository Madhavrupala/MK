# 🎮 MK Games - Multiplayer Online Gaming Platform

A modern, mobile-optimized multiplayer gaming platform where friends can connect and play classic games together online.

## 🚀 Features

### 🎯 Games Available
- **🎲 Ludo Classic** - Race your tokens home in this beloved board game
- **🏠 Isto** - Strategic house-building game with friends
- **⚫ Carrom Board** - Flick and pocket coins in this skill-based game
- **❌ Tic Tac Toe** - Quick strategy game - get three in a row!
- **🐍 Snakes & Ladders** - Climb ladders, avoid snakes in this luck-based race
- **🔗 Dot Connect** - Connect dots to form squares and claim territory

### 👥 Social Features
- **Friend System** - Add friends using usernames or device IDs
- **Friend Requests** - Send and receive friend invitations
- **Game Invitations** - Invite friends directly to your game rooms
- **Real-time Chat** - Chat with players during games
- **Online Status** - See which friends are online

### 🎲 Game Features
- **Create Private Rooms** - Host games with custom room codes
- **Join Friends** - Use 6-digit room codes to join friends
- **Quick Play** - Find random opponents instantly
- **Mobile-Optimized** - Perfect for smartphone gaming
- **Real-time Multiplayer** - Smooth, lag-free gameplay
- **Cross-Device Play** - Play from any device with a browser


### 📱 Mobile-First Design
- **Responsive Interface** - Optimized for mobile screens
- **Touch-Friendly Controls** - Easy to use on smartphones
- **Progressive Web App** - Install like a native app
- **Offline-Ready** - Core features work without internet

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/mkgames/mk-games-1.git
   cd mk-games-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🎮 How to Play

### Getting Started
1. **Enter Your Username** - Choose a unique name for gaming
2. **Your Device ID** - Automatically generated for friend connections
3. **Select a Game** - Choose from 6 available games
4. **Create or Join Room** - Host a game or join friends

### Creating a Room
1. Click **"Create Room"** in the game lobby
2. Share your **6-digit room code** with friends
3. Wait for friends to join
4. Click **"Start Game"** when ready

### Joining Friends
1. Get a room code from your friend
2. Click **"Join Room"** in the lobby
3. Enter the 6-digit code
4. Wait for the host to start the game

### Adding Friends
1. Click the **"Friends"** button in the header
2. Go to the **"Add Friend"** tab
3. Enter their username or device ID
4. Send a friend request

## 🏗️ Project Structure

```
mk-games-1/
├── src/                    # Client-side code
│   ├── index.html         # Main application page
│   ├── css/               # Stylesheets
│   │   ├── styles.css     # Main styles
│   │   ├── dotjoin.css    # Dot Connect game styles
│   │   ├── ludo.css       # Ludo game styles
│   │   ├── carrom.css     # Carrom game styles
│   │   ├── tictactoe.css  # Tic Tac Toe styles
│   │   └── snake.css      # Snakes & Ladders styles
│   ├── js/                # JavaScript files
│   │   ├── app.js         # Main application logic
│   │   ├── socket.js      # Socket.io client
│   │   ├── games/         # Individual game logic
│   │   └── utils/         # Utility functions
│   └── pages/             # Individual game pages
├── server/                # Server-side code
│   ├── server.js          # Main server file
│   ├── routes/            # API routes
│   └── socket/            # Socket event handlers
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🔧 Technologies Used

### Frontend
- **HTML5** - Modern semantic markup
- **CSS3** - Responsive design with Flexbox and Grid
- **JavaScript (ES6+)** - Modern JavaScript features
- **Socket.IO Client** - Real-time communication
- **Progressive Web App** - App-like experience

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **CORS** - Cross-origin resource sharing

## 📱 Mobile Features

### Touch Optimizations
- Large touch targets for easy tapping
- Gesture-friendly game controls
- Responsive typography that scales
- Optimized for portrait and landscape

### Performance
- Lazy loading of game assets
- Efficient socket connections
- Minimal data usage
- Battery-optimized animations

## 🚀 Deployment

### Production Build
```bash
npm start
```

### Environment Variables
```bash
PORT=3000                    # Server port
NODE_ENV=production         # Environment
```

---

**Made with ❤️ by the MK Games Team**

*Play together, stay connected!* 🎮👥