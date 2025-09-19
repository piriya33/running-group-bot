// Menu templates for the bot

const mainMenu = {
  type: 'template',
  altText: 'Running Group Menu',
  template: {
    type: 'buttons',
    text: 'What would you like to do?',
    actions: [
      {
        type: 'postback',
        label: '📊 Record Activity',
        data: 'action=record'
      },
      {
        type: 'postback',
        label: '🏆 View Leaderboard',
        data: 'action=leaderboard'
      },
      {
        type: 'postback',
        label: '📸 Share Photo',
        data: 'action=photo'
      }
    ]
  }
};

// Registration menu (for unregistered users)
const registrationMenu = {
  type: 'template',
  altText: 'Please Register',
  template: {
    type: 'buttons',
    text: '👋 Welcome! Please register first:',
    actions: [
      {
        type: 'postback',
        label: '📝 Register Now',
        data: 'action=start_registration'
      }
    ]
  }
};

// Activity type selection menu - Page 1
const activityMenu1 = {
  type: 'template',
  altText: 'Select Activity Type',
  template: {
    type: 'buttons',
    text: 'What type of activity?',
    actions: [
      {
        type: 'postback',
        label: '🏃 Running',
        data: 'activity=running'
      },
      {
        type: 'postback',
        label: '🚴 Cycling',
        data: 'activity=cycling'
      },
      {
        type: 'postback',
        label: '🏊 Swimming',
        data: 'activity=swimming'
      },
      {
        type: 'postback',
        label: '➡️ More Activities...',
        data: 'action=activities_page2'
      }
    ]
  }
};

// Activity type selection menu - Page 2
const activityMenu2 = {
  type: 'template',
  altText: 'Select Activity Type',
  template: {
    type: 'buttons',
    text: 'More activity types:',
    actions: [
      {
        type: 'postback',
        label: '🚣 Rowing',
        data: 'activity=rowing'
      },
      {
        type: 'postback',
        label: '💪 Strength Training',
        data: 'activity=strength'
      },
      {
        type: 'postback',
        label: '🏋️ Cardio',
        data: 'activity=cardio'
      },
      {
        type: 'postback',
        label: '⬅️ Back',
        data: 'action=record'
      }
    ]
  }
};

module.exports = {
  mainMenu,
  registrationMenu,
  activityMenu1,
  activityMenu2
};
