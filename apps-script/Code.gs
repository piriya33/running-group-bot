// ========================================
// RUNNING GROUP BOT - GOOGLE APPS SCRIPT
// With Menu Flow System and Quick Commands
// ========================================

// ========================================
// CONFIGURATION - UPDATE THESE VALUES
// ========================================

const CHANNEL_ACCESS_TOKEN = 'YOUR_CHANNEL_ACCESS_TOKEN_HERE';
const SPREADSHEET_ID = '17kEukr6sfDJ9a_hYKmvCZzh3KKUZftYIATT_l8nIeYc';

// Activity conversion rates (from Part 1)
const CONVERSION_RATES = {
  running: 1,
  cycling: 0.3,
  swimming: 4,
  rowing: 0.3,
  strength: 0.0083,  // 120 cal = 1 km
  cardio: 0.005      // 200 cal = 1 km
};

const CALORIE_ACTIVITIES = ['strength', 'cardio'];

// User conversation states (in-memory storage)
const userStates = {};

// ========================================
// MAIN WEBHOOK HANDLER
// ========================================

function doPost(e) {
  try {
    const events = JSON.parse(e.postData.contents).events;
    
    events.forEach(event => {
      if (event.type === 'message' && event.message.type === 'text') {
        handleMessage(event);
      } else if (event.type === 'follow') {
        handleFollow(event);
      }
    });
    
    // Fixed response with proper headers
    return ContentService
      .createTextOutput(JSON.stringify({status: 'success'}))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({'Access-Control-Allow-Origin': '*'});
      
  } catch (error) {
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({'Access-Control-Allow-Origin': '*'});
  }
}

// ========================================
// MESSAGE HANDLER WITH STATE MANAGEMENT
// ========================================

function handleMessage(event) {
  const text = event.message.text.toLowerCase().trim();
  const userId = event.source.userId;
  const replyToken = event.replyToken;
  
  // Check if user is registered
  const user = getUserData(userId);
  
  // Registration commands (always available)
  if (text.startsWith('/register')) {
    clearUserState(userId); // Clear any ongoing state
    handleRegistration(userId, text, replyToken);
    return;
  }
  
  // Require registration for other commands
  if (!user) {
    clearUserState(userId);
    sendRegistrationPrompt(replyToken);
    return;
  }
  
  // Check if user is in a conversation flow
  const userState = userStates[userId];
  
  if (userState) {
    handleConversationFlow(event, userId, text, replyToken);
    return;
  }
  
  // Quick commands (direct execution)
  if (text.startsWith('/delete ')) {
    handleDelete(userId, text.replace('/delete ', ''), replyToken);
  } else if (text.startsWith('/run ')) {
    logActivity(userId, 'running', text.replace('/run ', ''), replyToken);
  } else if (text.startsWith('/bike ')) {
    logActivity(userId, 'cycling', text.replace('/bike ', ''), replyToken);
  } else if (text.startsWith('/swim ')) {
    logActivity(userId, 'swimming', text.replace('/swim ', ''), replyToken);
  } else if (text.startsWith('/row ')) {
    logActivity(userId, 'rowing', text.replace('/row ', ''), replyToken);
  } else if (text.startsWith('/strength ')) {
    logActivity(userId, 'strength', text.replace('/strength ', ''), replyToken);
  } else if (text.startsWith('/cardio ')) {
    logActivity(userId, 'cardio', text.replace('/cardio ', ''), replyToken);
  }
  // View commands
  else if (text === '/stats' || text === 'stats') {
    showPersonalStats(userId, replyToken);
  } else if (text === '/leaderboard' || text === 'leaderboard') {
    showLeaderboard(replyToken);
  } else if (text === '/groupruns' || text === 'groupruns') {
    showGroupRuns(replyToken);
  } else if (text === '/challenge' || text === 'challenge') {
    showCurrentChallenge(replyToken);
  }
  // Menu commands
  else if (text === 'menu' || text === '/menu') {
    showMainMenu(replyToken);
  } else if (text === 'log activity' || text === 'record activity') {
    startActivityFlow(userId, replyToken);
  }
  // Unknown command
  else {
    showHelpMessage(replyToken);
  }
}

// ========================================
// CONVERSATION FLOW HANDLER
// ========================================

function handleConversationFlow(event, userId, text, replyToken) {
  const state = userStates[userId];
  
  if (state.step === 'selecting_activity') {
    handleActivitySelection(userId, text, replyToken);
  } else if (state.step === 'entering_value') {
    handleValueInput(userId, text, replyToken);
  } else {
    // Unknown state, reset
    clearUserState(userId);
    showMainMenu(replyToken);
  }
}

function startActivityFlow(userId, replyToken) {
  userStates[userId] = {
    step: 'selecting_activity',
    data: {}
  };
  
  const message = {
    type: 'template',
    altText: 'Select Activity Type',
    template: {
      type: 'buttons',
      text: 'Which activity did you do?',
      actions: [
        {
          type: 'message',
          label: '🏃 Running',
          text: 'running'
        },
        {
          type: 'message',
          label: '🚴 Cycling',
          text: 'cycling'
        },
        {
          type: 'message',
          label: '🏊 Swimming',
          text: 'swimming'
        },
        {
          type: 'message',
          label: '🚣 Rowing',
          text: 'rowing'
        }
      ]
    }
  };
  
  // Send first set of activities
  replyMessageObject(replyToken, message);
  
  // Send second set (strength & cardio)
  setTimeout(() => {
    const message2 = {
      type: 'template',
      altText: 'More Activities',
      template: {
        type: 'buttons',
        text: 'Or these activities:',
        actions: [
          {
            type: 'message',
            label: '💪 Strength',
            text: 'strength'
          },
          {
            type: 'message',
            label: '❤️ Cardio',
            text: 'cardio'
          },
          {
            type: 'message',
            label: '❌ Cancel',
            text: 'cancel'
          }
        ]
      }
    };
    
    pushMessage(getUserData(userId), message2);
  }, 1000);
}

function handleActivitySelection(userId, text, replyToken) {
  const activityType = text.toLowerCase().trim();
  
  if (activityType === 'cancel') {
    clearUserState(userId);
    replyMessage(replyToken, '❌ Cancelled. Type "menu" to start over.');
    return;
  }
  
  const validActivities = ['running', 'cycling', 'swimming', 'rowing', 'strength', 'cardio'];
  
  if (!validActivities.includes(activityType)) {
    replyMessage(replyToken, 'Please select a valid activity from the buttons above, or type "cancel" to stop.');
    return;
  }
  
  // Update user state
  userStates[userId].step = 'entering_value';
  userStates[userId].data.activityType = activityType;
  
  const isCalorie = CALORIE_ACTIVITIES.includes(activityType);
  const unit = isCalorie ? 'calories' : 'km';
  const example = isCalorie ? '350' : '5.2';
  
  const message = `Great! You selected ${activityType} ${getActivityEmoji(activityType)}\n\nHow many ${unit}?\n\nExample: ${example}\n\nOr type "cancel" to stop.`;
  
  replyMessage(replyToken, message);
}

function handleValueInput(userId, text, replyToken) {
  const state = userStates[userId];
  const activityType = state.data.activityType;
  
  if (text.toLowerCase() === 'cancel') {
    clearUserState(userId);
    replyMessage(replyToken, '❌ Cancelled. Type "menu" to start over.');
    return;
  }
  
  const value = parseFloat(text);
  
  if (!value || value <= 0) {
    const isCalorie = CALORIE_ACTIVITIES.includes(activityType);
    const unit = isCalorie ? 'calories' : 'km';
    const example = isCalorie ? '350' : '5.2';
    replyMessage(replyToken, `Please enter a valid number of ${unit}.\n\nExample: ${example}\n\nOr type "cancel" to stop.`);
    return;
  }
  
  // Clear state and log activity
  clearUserState(userId);
  logActivity(userId, activityType, text, replyToken);
}

function clearUserState(userId) {
  delete userStates[userId];
}

function getActivityEmoji(activityType) {
  const emojis = {
    running: '🏃',
    cycling: '🚴',
    swimming: '🏊',
    rowing: '🚣',
    strength: '💪',
    cardio: '❤️'
  };
  return emojis[activityType] || '🏃';
}

// ========================================
// REGISTRATION
// ========================================

function handleRegistration(userId, text, replyToken) {
  const parts = text.replace('/register', '').trim();
  
  if (!parts) {
    const message = '📝 Registration\n\nFormat:\n/register YourName, TectYear\n\nExample:\n/register John Smith, Tect 1';
    replyMessage(replyToken, message);
    return;
  }
  
  const [name, classYear] = parts.split(',').map(p => p.trim());
  
  if (!name || !classYear) {
    const message = '❌ Invalid format.\n\nUse:\n/register YourName, TectYear\n\nExample:\n/register John Smith, Tect 1';
    replyMessage(replyToken, message);
    return;
  }
  
  // Get LINE display name
  const profile = getLineProfile(userId);
  
  // Save to Google Sheets
  saveUser(userId, name, classYear, profile.displayName);
  
  const message = `✅ Registration complete!\n\n` +
                 `Name: ${name}\n` +
                 `Tect: ${classYear}\n\n` +
                 `You can now log activities!\n\n` +
                 `Quick start:\n/run 5.2\nmenu`;
  
  replyMessage(replyToken, message);
}

// ========================================
// ACTIVITY LOGGING WITH RUN ID
// ========================================

function logActivity(userId, activityType, valueStr, replyToken) {
  const value = parseFloat(valueStr);
  
  if (!value || value <= 0) {
    const isCalorie = CALORIE_ACTIVITIES.includes(activityType);
    const unit = isCalorie ? 'calories' : 'km';
    const example = isCalorie ? '350' : '5.2';
    replyMessage(replyToken, `Include ${unit}.\n\nExample: /${activityType} ${example}`);
    return;
  }
  
  const user = getUserData(userId);
  const equivalent = value * CONVERSION_RATES[activityType];
  const isCalorie = CALORIE_ACTIVITIES.includes(activityType);
  
  // Generate Run ID and save activity
  const runId = generateRunId(activityType);
  saveActivity(runId, userId, user.name, activityType, value, equivalent);
  
  const message = `✅ Activity logged!\n\n` +
                 `Run ID: ${runId}\n` +
                 `User: ${user.name}\n` +
                 `Activity: ${activityType}\n` +
                 `${isCalorie ? 'Calories' : 'Distance'}: ${value} ${isCalorie ? 'cal' : 'km'}\n` +
                 `Running equivalent: ${equivalent.toFixed(2)} km\n` +
                 `Date: ${formatDate(new Date())}\n\n` +
                 `To delete: /delete ${runId}`;
  
  replyMessage(replyToken, message);
}

// ========================================
// DELETE FUNCTIONALITY
// ========================================

function handleDelete(userId, runId, replyToken) {
  if (!runId) {
    replyMessage(replyToken, 'Please provide a Run ID.\nExample: /delete RUN-20250120-001');
    return;
  }
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Activities');
  
  if (!sheet) {
    replyMessage(replyToken, 'No activities found.');
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  const activityRow = data.findIndex(row => row[0] === runId && row[3] === userId);
  
  if (activityRow === -1) {
    replyMessage(replyToken, `❌ Run ID ${runId} not found or not yours.`);
    return;
  }
  
  // Delete the row
  sheet.deleteRow(activityRow + 1);
  
  // Update user totals
  updateUserTotals(userId);
  
  replyMessage(replyToken, `✅ Run ${runId} deleted successfully!`);
}

// ========================================
// GOOGLE SHEETS OPERATIONS
// ========================================

function generateRunId(activityType) {
  const today = new Date();
  const dateStr = today.getFullYear().toString() + 
                 String(today.getMonth() + 1).padStart(2, '0') + 
                 String(today.getDate()).padStart(2, '0');
  
  const prefix = activityType.toUpperCase().substring(0, 3);
  
  // Find existing activities today to get next number
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Activities');
  
  if (!sheet) {
    return `${prefix}-${dateStr}-001`;
  }
  
  const data = sheet.getDataRange().getValues();
  const todayActivities = data.filter(row => row[0] && row[0].includes(dateStr));
  const nextNumber = String(todayActivities.length + 1).padStart(3, '0');
  
  return `${prefix}-${dateStr}-${nextNumber}`;
}

function saveUser(userId, name, classYear, lineDisplayName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Members');
  
  if (!sheet) {
    sheet = ss.insertSheet('Members');
    sheet.appendRow(['User ID', 'Name', 'Class Year', 'LINE Display Name', 'Registration Date', 'Total Distance (km)', 'Total Runs', 'Last Activity']);
  }
  
  // Check if user exists
  const data = sheet.getDataRange().getValues();
  const existingRow = data.findIndex(row => row[0] === userId);
  
  if (existingRow > 0) {
    // Update existing user
    sheet.getRange(existingRow + 1, 2, 1, 3).setValues([[name, classYear, lineDisplayName]]);
  } else {
    // Add new user
    sheet.appendRow([
      userId,
      name,
      classYear,
      lineDisplayName,
      new Date(),
      0,
      0,
      new Date()
    ]);
  }
}

function saveActivity(runId, userId, userName, activityType, value, equivalent) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Activities');
  
  if (!sheet) {
    sheet = ss.insertSheet('Activities');
    sheet.appendRow(['Run ID', 'Logged At', 'Activity Date', 'User ID', 'Name', 'Activity Type', 'Value', 'Unit', 'KM Equivalent', 'Notes']);
  }
  
  const isCalorie = CALORIE_ACTIVITIES.includes(activityType);
  const unit = isCalorie ? 'cal' : 'km';
  const now = new Date();
  
  // Add activity (Activity Date = today for now, will be user-selectable in LIFF)
  sheet.appendRow([
    runId,                    // Run ID
    now,                      // Logged At (system timestamp)
    new Date(now.getFullYear(), now.getMonth(), now.getDate()), // Activity Date (just date, no time)
    userId,                   // User ID
    userName,                 // Name
    activityType,             // Activity Type
    value,                    // Value
    unit,                     // Unit
    equivalent,               // KM Equivalent
    ''                        // Notes (empty for now, LIFF will populate)
  ]);
  
  // Update user totals
  updateUserTotals(userId);
}

function updateUserTotals(userId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const membersSheet = ss.getSheetByName('Members');
  const activitiesSheet = ss.getSheetByName('Activities');
  
  if (!membersSheet || !activitiesSheet) return;
  
  // Get user's activities
  const activities = activitiesSheet.getDataRange().getValues();
  const userActivities = activities.filter(row => row[3] === userId); // User ID is in column D (index 3)
  
  // Calculate totals
  const totalDistance = userActivities.reduce((sum, row) => {
    return sum + (parseFloat(row[8]) || 0); // KM Equivalent is in column I (index 8)
  }, 0);
  const totalRuns = userActivities.length - (userActivities.length > 0 && userActivities[0][0] === 'Run ID' ? 1 : 0); // Exclude header if present
  
  // Update member sheet
  const members = membersSheet.getDataRange().getValues();
  const memberRow = members.findIndex(row => row[0] === userId);
  
  if (memberRow > 0) {
    membersSheet.getRange(memberRow + 1, 6, 1, 3).setValues([[totalDistance, totalRuns, new Date()]]);
  }
}

function getUserData(userId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Members');
  
  if (!sheet) return null;
  
  const data = sheet.getDataRange().getValues();
  const userRow = data.find(row => row[0] === userId);
  
  if (!userRow) return null;
  
  return {
    userId: userRow[0],
    name: userRow[1],
    classYear: userRow[2],
    lineDisplayName: userRow[3],
    registrationDate: userRow[4],
    totalDistance: userRow[5] || 0,
    totalRuns: userRow[6] || 0,
    lastActivity: userRow[7]
  };
}

// ========================================
// VIEW FUNCTIONS
// ========================================

function showPersonalStats(userId, replyToken) {
  const user = getUserData(userId);
  
  if (!user) {
    sendRegistrationPrompt(replyToken);
    return;
  }
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Activities');
  
  if (!sheet) {
    replyMessage(replyToken, 'No activities logged yet!');
    return;
  }
  
  // Get this week's activities
  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
  weekStart.setHours(0, 0, 0, 0);
  
  const activities = sheet.getDataRange().getValues();
  const weekActivities = activities.filter(row => 
    row[3] === userId && new Date(row[2]) >= weekStart // Activity Date is column C (index 2)
  );
  
  const weekDistance = weekActivities.reduce((sum, row) => sum + (parseFloat(row[8]) || 0), 0);
  
  const message = `📊 Your Statistics\n\n` +
                 `Name: ${user.name}\n` +
                 `Tect: ${user.classYear}\n\n` +
                 `All Time:\n` +
                 `Total Distance: ${user.totalDistance.toFixed(2)} km\n` +
                 `Total Activities: ${user.totalRuns}\n\n` +
                 `This Week:\n` +
                 `Distance: ${weekDistance.toFixed(2)} km\n` +
                 `Activities: ${weekActivities.length}`;
  
  replyMessage(replyToken, message);
}

function showLeaderboard(replyToken) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Members');
  
  if (!sheet) {
    replyMessage(replyToken, 'No data available yet!');
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  const members = data.slice(1) // Skip header
    .filter(row => row[0]) // Only rows with User ID
    .sort((a, b) => (b[5] || 0) - (a[5] || 0)) // Sort by total distance
    .slice(0, 10); // Top 10
  
  if (members.length === 0) {
    replyMessage(replyToken, 'No activities logged yet!');
    return;
  }
  
  let message = '🏆 Leaderboard - All Time\n\n';
  
  members.forEach((member, index) => {
    const rank = index + 1;
    const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
    message += `${emoji} ${member[1]}: ${(member[5] || 0).toFixed(2)} km\n`;
  });
  
  replyMessage(replyToken, message);
}

function showGroupRuns(replyToken) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Group_Runs');
  
  if (!sheet) {
    replyMessage(replyToken, 'No group runs scheduled yet!');
    return;
  }
  
  const today = new Date();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) { // Only header or empty
    replyMessage(replyToken, 'No group runs scheduled yet!');
    return;
  }
  
  const upcomingRuns = data.slice(1) // Skip header
    .filter(row => row[1] && new Date(row[1]) >= today) // Future events
    .sort((a, b) => new Date(a[1]) - new Date(b[1])); // Sort by date
  
  if (upcomingRuns.length === 0) {
    replyMessage(replyToken, 'No upcoming group runs!');
    return;
  }
  
  let message = '🏃 Upcoming Group Runs\n\n';
  
  upcomingRuns.forEach(run => {
    const date = new Date(run[1]);
    message += `📅 ${run[0]}\n`;
    message += `🗓️ ${formatDate(date)}\n`;
    if (run[2]) message += `⏰ ${run[2]}\n`;
    if (run[3]) message += `📍 ${run[3]}\n`;
    if (run[4]) message += `📏 ${run[4]} km\n`;
    if (run[5]) message += `👤 ${run[5]}\n`;
    message += `\n`;
  });
  
  replyMessage(replyToken, message);
}

function showCurrentChallenge(replyToken) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const challengeSheet = ss.getSheetByName('Challenges');
  
  if (!challengeSheet) {
    replyMessage(replyToken, 'No challenges configured!\n\nCheck pinned messages for updates.');
    return;
  }
  
  const challenges = challengeSheet.getDataRange().getValues();
  
  if (challenges.length <= 1) { // Only header or empty
    replyMessage(replyToken, 'No challenges configured!\n\nCheck pinned messages for updates.');
    return;
  }
  
  // Get active challenge
  const activeChallenge = challenges.slice(1).find(row => row[4] === true); // Active = TRUE
  
  if (!activeChallenge) {
    replyMessage(replyToken, 'No active challenges!\n\nCheck pinned messages for updates.');
    return;
  }
  
  const challengeName = activeChallenge[0];
  const description = activeChallenge[1];
  const linkOrInfo = activeChallenge[5] || 'Check pinned messages for details';
  
  const message = `🎯 Current Challenge\n\n` +
                 `${challengeName}\n\n` +
                 `${description}\n\n` +
                 `📌 ${linkOrInfo}`;
  
  replyMessage(replyToken, message);
}

// ========================================
// MENU SYSTEM WITH ACTIVITY FLOW
// ========================================

function showMainMenu(replyToken) {
  const message = {
    type: 'template',
    altText: 'Main Menu',
    template: {
      type: 'buttons',
      text: 'What would you like to do?',
      actions: [
        {
          type: 'message',
          label: '📝 Log Activity',
          text: 'log activity'
        },
        {
          type: 'message',
          label: '📊 My Stats',
          text: '/stats'
        },
        {
          type: 'message',
          label: '🏆 Leaderboard',
          text: '/leaderboard'
        },
        {
          type: 'message',
          label: '❓ Help',
          text: 'help'
        }
      ]
    }
  };
  
  replyMessageObject(replyToken, message);
}

function showHelpMessage(replyToken) {
  const message = `🤖 Running Group Bot Help\n\n` +
                 `📱 MENU SYSTEM:\n` +
                 `• Type "menu" for button options\n` +
                 `• Follow the step-by-step prompts\n\n` +
                 `⚡ QUICK COMMANDS:\n` +
                 `• /run 5.2 - Log running\n` +
                 `• /bike 10 - Log cycling\n` +
                 `• /swim 1.5 - Log swimming\n` +
                 `• /row 8 - Log rowing\n` +
                 `• /strength 350 - Log calories\n` +
                 `• /cardio 400 - Log calories\n\n` +
                 `📊 VIEW COMMANDS:\n` +
                 `• /stats - Your statistics\n` +
                 `• /leaderboard - Group rankings\n` +
                 `• /groupruns - Upcoming runs\n` +
                 `• /challenge - Current challenge\n\n` +
                 `🗑️ MANAGEMENT:\n` +
                 `• /delete RUN-ID - Delete activity\n\n` +
                 `Type "menu" to start!`;
  
  replyMessage(replyToken, message);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function getLineProfile(userId) {
  try {
    const url = `https://api.line.me/v2/bot/profile/${userId}`;
    const response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN
      }
    });
    return JSON.parse(response.getContentText());
  } catch (error) {
    return { displayName: 'Unknown' };
  }
}

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function sendRegistrationPrompt(replyToken) {
  const message = '⚠️ Please register first!\n\nFormat:\n/register YourName, TectYear\n\nExample:\n/register John Smith, Tect 1';
  replyMessage(replyToken, message);
}

function handleFollow(event) {
  const message = '👋 Welcome to the Running Group!\n\nPlease register:\n/register YourName, TectYear\n\nExample:\n/register John Smith, Tect 1';
  replyMessage(event.replyToken, message);
}

// ========================================
// LINE MESSAGING API
// ========================================

function replyMessage(replyToken, text) {
  replyMessageObject(replyToken, {
    type: 'text',
    text: text
  });
}

function replyMessageObject(replyToken, message) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  
  const payload = {
    replyToken: replyToken,
    messages: [message]
  };
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

function pushMessage(user, message) {
  const url = 'https://api.line.me/v2/bot/message/push';
  
  const payload = {
    to: user.userId,
    messages: [message]
  };
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch (error) {
    console.error('Error sending push message:', error);
  }
}