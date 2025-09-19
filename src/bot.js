const express = require('express');
const line = require('@line/bot-sdk');
const { mainMenu, registrationMenu, activityMenu1, activityMenu2 } = require('./menu');
require('dotenv').config();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);
const app = express();

const userStates = {};
const registeredUsers = {};

const conversionRates = {
  running: 1,
  cycling: 0.3,
  swimming: 4,
  rowing: 0.3,
  strength: 0.0083,
  cardio: 0.005
};

const calorieActivities = ['strength', 'cardio'];

const commandAliases = {
  '/run': 'running',
  '/running': 'running',
  '/bike': 'cycling',
  '/cycling': 'cycling',
  '/cycle': 'cycling',
  '/swim': 'swimming',
  '/swimming': 'swimming',
  '/row': 'rowing',
  '/rowing': 'rowing',
  '/strength': 'strength',
  '/gym': 'strength',
  '/weights': 'strength',
  '/cardio': 'cardio',
  '/menu': 'menu',
  '/start': 'menu',
  '/help': 'menu',
  '/leaderboard': 'leaderboard',
  '/board': 'leaderboard',
  '/register': 'register'
};

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  console.log('Event:', JSON.stringify(event, null, 2));

  if (event.type === 'message' && event.message.type === 'text') {
    return handleTextMessage(event);
  }

  if (event.type === 'postback') {
    return handlePostback(event);
  }

  return Promise.resolve(null);
}

async function handleTextMessage(event) {
  const userId = event.source.userId;
  const text = event.message.text.trim();

  // Check if it's a command
  if (text.startsWith('/')) {
    return handleCommand(event, userId, text);
  }

  // Also check for plain "menu", "start", "help"
  const lowerText = text.toLowerCase();
  if (lowerText === 'menu' || lowerText === 'start' || lowerText === 'help') {
    return handleCommand(event, userId, '/' + lowerText);
  }

  // Handle registration input states
  const userState = userStates[userId];
  
  if (userState && userState.action === 'awaiting_name') {
    return handleNameInput(event, userId, text);
  }

  if (userState && userState.action === 'awaiting_class') {
    return handleClassInput(event, userId, text);
  }

  if (userState && userState.action === 'awaiting_input') {
    if (!registeredUsers[userId]) {
      return sendRegistrationPrompt(event);
    }
    return handleActivityInput(event, userId, text);
  }

  // Helpful response
  if (lowerText.includes('help') || lowerText.includes('bot')) {
    const response = {
      type: 'text',
      text: '👋 Hi! Type "menu" to get started!\n\nQuick commands:\n/register Name, Class\n/run 5.2'
    };
    return client.replyMessage(event.replyToken, response);
  }

  return Promise.resolve(null);
}

async function handleCommand(event, userId, text) {
  const parts = text.split(/\s+/);
  const command = parts[0].toLowerCase();
  const restOfText = text.substring(command.length).trim();

  const activityType = commandAliases[command];

  if (!activityType) {
    const response = {
      type: 'text',
      text: '❌ Unknown command.\n\nTry: /run 5.2 or type "menu"'
    };
    return client.replyMessage(event.replyToken, response);
  }

  // Registration command
  if (activityType === 'register') {
    return startQuickRegistration(event, userId, restOfText);
  }

  // Check if user is registered
  if (!registeredUsers[userId]) {
    return client.replyMessage(event.replyToken, registrationMenu);
  }

  // Menu command
  if (activityType === 'menu') {
    return client.replyMessage(event.replyToken, mainMenu);
  }

  if (activityType === 'leaderboard') {
    const message = {
      type: 'text',
      text: '🏆 Leaderboard\n\n(Coming soon!)'
    };
    return client.replyMessage(event.replyToken, message);
  }

  // Activity commands
  const value = parseFloat(parts[1]);
  
  if (!value || value <= 0) {
    const isCalorieActivity = calorieActivities.includes(activityType);
    const unit = isCalorieActivity ? 'calories' : 'km';
    const example = isCalorieActivity ? '350' : '5.2';
    
    const response = {
      type: 'text',
      text: `Include ${unit}.\n\nExample: ${command} ${example}`
    };
    return client.replyMessage(event.replyToken, response);
  }

  return logActivity(event, userId, activityType, value);
}

async function sendRegistrationPrompt(event) {
  return client.replyMessage(event.replyToken, registrationMenu);
}

// Quick registration (command-based)
async function startQuickRegistration(event, userId, text) {
  if (!text) {
    // Start menu-based registration
    userStates[userId] = { action: 'awaiting_name' };
    const message = {
      type: 'text',
      text: '📝 Registration - Step 1 of 2\n\nWhat is your name?'
    };
    return client.replyMessage(event.replyToken, message);
  }

  // Quick format: /register Name, Class
  const parts = text.split(',').map(p => p.trim());
  
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    const message = {
      type: 'text',
      text: '❌ Invalid format.\n\nUse:\n/register YourName, ClassYear\n\nOr just type /register for step-by-step'
    };
    return client.replyMessage(event.replyToken, message);
  }

  return completeRegistration(event, userId, parts[0], parts[1]);
}

// Menu-based registration handlers
async function handleNameInput(event, userId, name) {
  name = name.trim();
  
  if (!name || name.length < 2) {
    const message = {
      type: 'text',
      text: '❌ Please enter a valid name (at least 2 characters)'
    };
    return client.replyMessage(event.replyToken, message);
  }

  // Store name and ask for class
  userStates[userId] = {
    action: 'awaiting_class',
    name: name
  };

  const message = {
    type: 'text',
    text: `📝 Registration - Step 2 of 2\n\nHi ${name}!\n\nWhat is your class/year?\n(e.g., Class of 2020)`
  };

  return client.replyMessage(event.replyToken, message);
}

async function handleClassInput(event, userId, classYear) {
  classYear = classYear.trim();
  
  if (!classYear || classYear.length < 4) {
    const message = {
      type: 'text',
      text: '❌ Please enter your class/year (e.g., Class of 2020)'
    };
    return client.replyMessage(event.replyToken, message);
  }

  const userState = userStates[userId];
  const name = userState.name;

  return completeRegistration(event, userId, name, classYear);
}

async function completeRegistration(event, userId, name, classYear) {
  // Get LINE display name
  let lineDisplayName = 'Unknown';
  try {
    const profile = await client.getProfile(userId);
    lineDisplayName = profile.displayName;
  } catch (err) {
    console.error('Error getting profile:', err);
  }

  // Save registration
  registeredUsers[userId] = {
    name: name,
    class: classYear,
    lineDisplayName: lineDisplayName,
    registeredAt: new Date().toISOString()
  };

  // Clear state
  delete userStates[userId];

  const message = {
    type: 'text',
    text: `✅ Welcome ${name}!\n\n` +
          `Class: ${classYear}\n\n` +
          `Registration complete! 🎉\n\n` +
          `Type "menu" to get started!`
  };

  return client.replyMessage(event.replyToken, message);
}

async function logActivity(event, userId, activityType, value) {
  const user = registeredUsers[userId];
  const isCalorieActivity = calorieActivities.includes(activityType);
  const equivalent = (value * conversionRates[activityType]).toFixed(2);
  const inputLabel = isCalorieActivity ? `${value} cal` : `${value} km`;

  const message = {
    type: 'text',
    text: `✅ Activity logged!\n\n` +
          `User: ${user.name}\n` +
          `Activity: ${activityType}\n` +
          `${isCalorieActivity ? 'Calories' : 'Distance'}: ${inputLabel}\n` +
          `Running equivalent: ${equivalent} km`
  };

  console.log('LOG ACTIVITY:', {
    userId,
    name: user.name,
    class: user.class,
    lineDisplayName: user.lineDisplayName,
    activityType,
    value,
    equivalent,
    timestamp: new Date().toISOString()
  });

  return client.replyMessage(event.replyToken, message);
}

async function handlePostback(event) {
  const userId = event.source.userId;
  const data = event.postback.data;
  const params = new URLSearchParams(data);
  const action = params.get('action');
  const activity = params.get('activity');

  // Handle registration start
  if (action === 'start_registration') {
    userStates[userId] = { action: 'awaiting_name' };
    const message = {
      type: 'text',
      text: '📝 Registration - Step 1 of 2\n\nWhat is your name?'
    };
    return client.replyMessage(event.replyToken, message);
  }

  // Check registration for other actions
  if (!registeredUsers[userId]) {
    return client.replyMessage(event.replyToken, registrationMenu);
  }

  if (action === 'record') {
    return client.replyMessage(event.replyToken, activityMenu1);
  }

  if (action === 'activities_page2') {
    return client.replyMessage(event.replyToken, activityMenu2);
  }

  if (activity) {
    userStates[userId] = {
      action: 'awaiting_input',
      activityType: activity
    };

    const isCalorieActivity = calorieActivities.includes(activity);
    const inputType = isCalorieActivity ? 'calories' : 'km';
    const example = isCalorieActivity ? '350' : '5.2';

    const message = {
      type: 'text',
      text: `${activity} selected!\n\nEnter ${inputType} (e.g., ${example})`
    };

    return client.replyMessage(event.replyToken, message);
  }

  if (action === 'leaderboard') {
    const message = {
      type: 'text',
      text: '🏆 Leaderboard\n\n(Coming soon!)'
    };
    return client.replyMessage(event.replyToken, message);
  }

  if (action === 'photo') {
    const message = {
      type: 'text',
      text: '📸 Photo Upload\n\n(Coming soon!)'
    };
    return client.replyMessage(event.replyToken, message);
  }

  return Promise.resolve(null);
}

async function handleActivityInput(event, userId, text) {
  const value = parseFloat(text);
  
  if (isNaN(value) || value <= 0) {
    const message = {
      type: 'text',
      text: '❌ Invalid number. Try again.'
    };
    return client.replyMessage(event.replyToken, message);
  }

  const userState = userStates[userId];
  const activityType = userState.activityType;
  delete userStates[userId];

  return logActivity(event, userId, activityType, value);
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Bot running on port ${port}`);
});
