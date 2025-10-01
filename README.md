# Google Tasks Eisenhower Matrix

A modern web application that integrates with Google Tasks to help you organize and prioritize your tasks using the proven Eisenhower Matrix framework.

![Task Matrix](https://img.shields.io/badge/Status-Live-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-Express-blue)
![Google](https://img.shields.io/badge/Google-Tasks%20API-red)

## 🎯 Features

### Core Functionality
- **Google OAuth 2.0 Authentication** - Secure login with Google
- **Google Tasks API Integration** - Full CRUD operations on your Google Tasks
- **Eisenhower Matrix Interface** - Drag & drop tasks into priority quadrants
- **Task Persistence** - Matrix organization saved locally across sessions

### User Experience
- **Google Material Design** - Clean, modern interface
- **Drag & Drop** - Intuitive task organization
- **Keyboard Shortcuts** - Power user productivity
- **Loading Indicators** - Smooth, responsive feedback
- **Help System** - Built-in guidance and shortcuts

### Smart Features
- **Overdue Task Highlighting** - Red styling for urgent tasks
- **Auto-sorting** - Tasks sorted by due date
- **Filter System** - Filter by Google Task lists
- **Clear Completed** - One-click cleanup of finished tasks

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | New task |
| `R` | Refresh tasks |
| `F` | Toggle filters |
| `Shift + C` | Clear completed tasks |
| `?` | Show help |
| `ESC` | Close dialogs |

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Google Cloud Console project with Tasks API enabled
- Google OAuth 2.0 credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/google-tasks-eisenhower-matrix.git
   cd google-tasks-eisenhower-matrix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Google OAuth credentials:
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   SESSION_SECRET=your_random_session_secret
   BASE_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🔧 Google Cloud Setup

### 1. Create a Google Cloud Project
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create a new project or select existing one

### 2. Enable APIs
- Navigate to "APIs & Services" > "Library"
- Search for "Google Tasks API" and enable it

### 3. Create OAuth 2.0 Credentials
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth 2.0 Client IDs"
- Choose "Web application"
- Add authorized redirect URI: `http://localhost:3000/auth/google/callback`

### 4. Configure OAuth Consent Screen
- Add your email as a test user
- Set up the consent screen with your app details

## 📁 Project Structure

```
google-tasks-eisenhower-matrix/
├── src/
│   ├── config/
│   │   └── passport.js          # Google OAuth configuration
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── pages.js             # Page routes
│   │   └── tasks.js             # Google Tasks API routes
│   ├── views/
│   │   ├── layout.ejs           # Base layout template
│   │   ├── landing.ejs          # Landing page
│   │   └── dashboard.ejs        # Main application
│   ├── public/
│   │   ├── styles.css           # Application styles
│   │   └── dashboard.js         # Frontend JavaScript
│   └── server.js                # Express server setup
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🎨 The Eisenhower Matrix

The app organizes tasks into four quadrants:

- **🔴 Urgent & Important** - Do these first (deadlines, crises)
- **🟢 Not Urgent & Important** - Schedule these (planning, learning)
- **🟡 Urgent & Not Important** - Delegate if possible (interruptions)
- **⚪ Not Urgent & Not Important** - Minimize these (time wasters)

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js
- **Authentication**: Passport.js, Google OAuth 2.0
- **Frontend**: Vanilla JavaScript, CSS3
- **Templates**: EJS
- **API**: Google Tasks API
- **Storage**: Local Storage (for matrix persistence)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ☕ Support

If you find this project helpful, consider supporting its development:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-☕-yellow)](https://buymeacoffee.com/yannickk)

## 🙏 Acknowledgments

- Google Tasks API for seamless integration
- Eisenhower Matrix methodology for task prioritization
- Google Material Design for beautiful UI components

---

**Built with ❤️ by [Yannick V](https://buymeacoffee.com/yannickk)**
