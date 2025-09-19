# Running Group Bot - Setup Documentation (Part 1)

## Project Overview
LINE chatbot for tracking running group activities with features including:
- Activity tracking with distance conversions
- Group leaderboards
- Photo sharing
- Data export to Google Sheets

**Repository:** https://github.com/piriya33/running-group-bot
**LINE Official Account:** Runlogger (@2008140875)

---

## 1. Development Environment Setup

### System Information
- **Computer:** MacBook Pro M1
- **Operating System:** macOS
- **Terminal:** Built-in Terminal app (theme customizable via Terminal > Preferences)

### Installed Tools & Versions
```bash
# Check versions
node --version    # v22.19.0
npm --version     # 10.9.3
git --version     # git version 2.39.5
brew --version    # Homebrew 4.6.11
gh --version      # gh version 2.79.0
ngrok --version   # 3.29.0
```

### Installation Steps
1. **Command Line Developer Tools:**
   - Auto-prompted when running `git --version`
   - Takes ~30 minutes to install

2. **Node.js:** 
   - Download from https://nodejs.org (LTS version)
   - Includes npm automatically

3. **Homebrew:**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Add to PATH (M1 Mac specific)
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
   eval "$(/opt/homebrew/bin/brew shellenv)"
   ```

4. **GitHub CLI:**
   ```bash
   brew install gh
   ```

5. **ngrok:**
   ```bash
   brew install ngrok
   # Configure with your authtoken from ngrok.com
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```

---

## 2. Project Structure

### Directory Layout
```
/Users/piriyasambandaraksa/Development/running-group-bot/
├── .env                    # Environment variables (NOT in git)
├── .env.example           # Environment template (in git)
├── .git/                  # Git repository
├── .gitignore            # Files to ignore in git
├── README.md             # Project description
├── package.json          # Node.js dependencies
├── package-lock.json     # Locked dependency versions
├── node_modules/         # Installed packages (NOT in git)
└── src/
    ├── bot.js           # Main bot logic
    ├── menu.js          # Menu system (to be built)
    └── sheets.js        # Google Sheets integration (to be built)
```

### Key Files Created

**package.json:**
```json
{
  "name": "running-group-bot",
  "version": "1.0.0",
  "description": "LINE chatbot for tracking running group activities",
  "main": "src/bot.js",
  "scripts": {
    "start": "node src/bot.js",
    "dev": "nodemon src/bot.js"
  }
}
```

**.gitignore:**
```
node_modules/
.env
.env.local
*.log
google-credentials.json
.DS_Store
```

---

## 3. GitHub Setup

### Git Configuration
```bash
git config --global user.name "piriya33"
git config --global user.email "piriya.s@protonmail.com"
```

### GitHub Authentication
```bash
gh auth login
# Choose: GitHub.com > HTTPS > Yes > Login with web browser
```

### Repository Creation
```bash
# Create and push to GitHub
gh repo create running-group-bot --public --source=. --remote=origin --push
```

**Repository URL:** https://github.com/piriya33/running-group-bot

---

## 4. LINE Developer Setup

### LINE Official Account Creation
1. Go to https://developers.line.biz/console/
2. Create Provider: "Running Bot"
3. Click "Create a LINE Official Account"
4. Account details:
   - Name: Runlogger
   - Email: piriya33+Runlogger@gmail.com
   - Bot Basic ID: @2008140875

### Enable Messaging API
1. Go to LINE Official Account Manager
2. Settings > Messaging API
3. Click "Enable Messaging API"

### Get Credentials
1. In LINE Developers Console > Runlogger > Messaging API tab
2. **Channel Secret:** Copy from "Basic settings"
3. **Channel Access Token:** Issue long-lived token

### Important Settings
- **Auto-reply messages:** OFF
- **Greeting messages:** OFF (optional)
- **Use webhook:** ON

---

## 5. Environment Configuration

### .env File (Local Only - Never Commit!)
```bash
LINE_CHANNEL_ACCESS_TOKEN=your_actual_long_token
LINE_CHANNEL_SECRET=5275b88a4f36c808c92777b1998bab85
PORT=3000
GOOGLE_SHEETS_ID=to_be_added_later
```

### .env.example File (Template for Git)
```bash
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_CHANNEL_SECRET=your_channel_secret_here
PORT=3000
GOOGLE_SHEETS_ID=your_google_sheets_id_here
```

---

## 6. Dependencies Installation

### Main Dependencies
```bash
npm install express @line/bot-sdk googleapis dotenv --save
```

- **express:** Web server framework
- **@line/bot-sdk:** Official LINE Messaging API
- **googleapis:** Google Sheets integration
- **dotenv:** Environment variable management

### Dev Dependencies
```bash
npm install nodemon --save-dev
```

- **nodemon:** Auto-restart server on code changes

---

## 7. Current Bot Implementation

### src/bot.js (Echo Bot)
- Receives webhook events from LINE
- Echoes back any text message received
- Basic error handling
- Runs on port 3000

### How It Works
1. User sends message to LINE bot
2. LINE sends webhook POST to `/webhook` endpoint
3. Bot processes event and replies
4. Response sent back to user via LINE API

---

## 8. Running the Bot

### Development Workflow

**Terminal 1 - Start Bot:**
```bash
cd ~/Development/running-group-bot
npm run dev
# Output: Bot is running on port 3000
```

**Terminal 2 - Start ngrok:**
```bash
ngrok http 3000
# Copy the https URL (e.g., https://abc123.ngrok-free.app)
```

**Configure Webhook:**
1. Go to LINE Developers Console
2. Messaging API tab
3. Webhook URL: `https://your-ngrok-url/webhook`
4. Click "Verify" (should succeed)
5. Enable "Use webhook"

### Testing
1. Add bot via QR code or Bot Basic ID (@2008140875)
2. Send any text message
3. Bot should echo it back

---

## 9. Troubleshooting

### Common Issues

**"command not found: brew"**
- Solution: Add Homebrew to PATH (see Installation Steps)

**"Cannot find module 'express'"**
- Solution: Run `npm install` in project directory

**ngrok authentication failed**
- Solution: Sign up at ngrok.com and run `ngrok config add-authtoken YOUR_TOKEN`

**Webhook verification fails**
- Check bot is running (`npm run dev`)
- Check ngrok is running
- Ensure URL includes `/webhook` at the end
- Check .env file has correct credentials

### Important Notes
- **ngrok URL changes each time** you restart ngrok
- Must update webhook URL in LINE Console after each ngrok restart
- Keep both terminals running during development
- .env file must never be committed to git

---

## 10. Next Steps (Part 2)

**To be implemented:**
1. Menu system with clickable buttons
2. Activity tracking with conversions
3. Google Sheets integration
4. Leaderboard functionality
5. Photo upload and album features

---

## Quick Reference Commands

```bash
# Start development
cd ~/Development/running-group-bot
npm run dev                    # Terminal 1
ngrok http 3000               # Terminal 2

# Git workflow
git status
git add .
git commit -m "message"
git push

# Check configurations
git config --global user.name
git config --global user.email

# View logs
cat .env.example
ls -la
```

---

**Documentation created:** September 19, 2025
**GitHub:** piriya33
**Project Status:** Echo bot working, ready for feature development