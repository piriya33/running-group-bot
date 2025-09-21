\# Running Group Bot



A LINE chatbot for tracking running group activities with Google Sheets integration.



\## 🏃 Features



\### \*\*Dual UX System\*\*

\- \*\*Quick Commands\*\* - For tech-savvy users (`/run 5.2`)

\- \*\*Menu-Driven Flow\*\* - Step-by-step prompts for everyone else



\### \*\*Activity Tracking\*\*

\- 6 activity types with automatic conversions

\- Run ID system for easy deletion

\- Personal statistics and group leaderboards

\- LIFF-ready database structure



\### \*\*Google Sheets Integration\*\*

\- Real-time data storage in 5 organized sheets

\- Member management and activity logging

\- Weekly statistics and challenge tracking



\## 🚀 Quick Start



\### \*\*For Users\*\*

1\. Add the bot to your LINE chat

2\. Register: `/register Your Name, Tect 1`

3\. Log activities: `/run 5.2` or type `menu` for guided flow



\### \*\*For Admins\*\*

1\. Set up Google Sheets with required structure

2\. Deploy Google Apps Script with your tokens

3\. Configure LINE webhook URL



\## 📱 Available Commands



\### \*\*Quick Commands\*\*

```

/register Name, TectYear    - Register with the group

/run 5.2                   - Log running distance (km)

/bike 10                   - Log cycling distance (km)

/swim 1.5                  - Log swimming distance (km)

/row 8                     - Log rowing distance (km)

/strength 350              - Log strength training (calories)

/cardio 400                - Log cardio exercise (calories)

/delete RUN-20250921-001   - Delete activity by Run ID

```



\### \*\*View Commands\*\*

```

/stats                     - Your personal statistics

/leaderboard              - Group rankings (all-time)

/groupruns                - Upcoming group activities

/challenge                - Current group challenge

menu                      - Show interactive menu

help                      - Show all available commands

```



\### \*\*Menu System\*\*

```

User: menu

Bot: \[Shows buttons: Log Activity | My Stats | Leaderboard | Help]



User: \[clicks "Log Activity"]

Bot: \[Shows activity types: Running | Cycling | Swimming | etc.]



User: \[clicks "Running"]  

Bot: How many km? Example: 5.2



User: 5.2

Bot: ✅ Activity logged! Run ID: RUN-20250921-001

```



\## 🏗️ Technical Architecture



\### \*\*Platform Options\*\*

\- \*\*Google Apps Script\*\* (deployed) - Serverless, free hosting

\- \*\*Node.js\*\* (development) - Local development and testing



\### \*\*Database Structure\*\*

\- \*\*Members\*\* - User profiles and totals

\- \*\*Activities\*\* - Activity logs with Run IDs

\- \*\*Group\_Runs\*\* - Scheduled group events

\- \*\*Challenges\*\* - Current group challenges

\- \*\*Weekly\_Stats\*\* - Automated statistics



\### \*\*Activity Conversions\*\*

```javascript

running: 1      // 1 km = 1 km equivalent

cycling: 0.3    // 1 km bike = 0.3 km run

swimming: 4     // 1 km swim = 4 km run

rowing: 0.3     // 1 km row = 0.3 km run

strength: 0.0083 // 120 cal = 1 km run

cardio: 0.005   // 200 cal = 1 km run

```



\## 📊 Google Sheets Setup



\### \*\*Required Sheets:\*\*



1\. \*\*Members\*\*

&nbsp;  - User ID, Name, Tect Year, Registration Date, Totals



2\. \*\*Activities\*\* 

&nbsp;  - Run ID, Timestamps, User Info, Activity Details



3\. \*\*Group\_Runs\*\*

&nbsp;  - Event Name, Date, Time, Location, Organizer



4\. \*\*Challenges\*\*

&nbsp;  - Challenge Name, Description, Dates, Info/Link



5\. \*\*Weekly\_Stats\*\*

&nbsp;  - Auto-generated weekly summaries



\### \*\*Spreadsheet ID:\*\* `17kEukr6sfDJ9a\_hYKmvCZzh3KKUZftYIATT\_l8nIeYc`



\## ⚙️ Setup Instructions



\### \*\*1. Google Apps Script Deployment\*\*

```javascript

// In apps-script/Code.gs, update:

const CHANNEL\_ACCESS\_TOKEN = 'your-line-token';

const SPREADSHEET\_ID = '17kEukr6sfDJ9a\_hYKmvCZzh3KKUZftYIATT\_l8nIeYc';

```



\### \*\*2. LINE Developers Console\*\*

\- Create Messaging API Channel

\- Set webhook URL to deployed Apps Script

\- Generate Channel Access Token



\### \*\*3. Google Sheets\*\*

\- Create spreadsheet with 5 sheets structure

\- Set sharing permissions for Apps Script



\## 🎯 Roadmap



\### \*\*Phase 1 (Completed)\*\*

\- ✅ User registration system

\- ✅ Activity logging with conversions

\- ✅ Google Sheets integration

\- ✅ Dual UX system (quick + menu)

\- ✅ Run ID and delete functionality



\### \*\*Phase 2 (Next)\*\*

\- 🔄 Thai language support

\- 🔄 LIFF integration for enhanced UX

\- 🔄 Photo upload for activities

\- 🔄 Rich messaging and notifications



\### \*\*Phase 3 (Future)\*\*

\- 📋 Advanced analytics dashboard

\- 📋 Automated group run reminders

\- 📋 Achievement badges system

\- 📋 Integration with fitness apps



\## 🛠️ Development



\### \*\*File Structure\*\*

```

running-group-bot/

├── apps-script/

│   └── Code.gs              # Google Apps Script (deployed)

├── src/

│   └── bot.js               # Node.js version (development)

├── docs/

│   ├── part1-setup.md       # Initial setup guide

│   └── part2-google-sheets.md # Integration guide

└── README.md                # This file

```



\### \*\*Local Development\*\*

```bash

git clone https://github.com/piriya33/running-group-bot.git

cd running-group-bot

npm install

npm start

```



\### \*\*Testing\*\*

\- Register: `/register Test User, Tect 1`

\- Log activity: `/run 5.2`

\- Check sheets for data

\- Test menu flow: `menu`



\## 📈 Usage Statistics



The bot tracks:

\- Individual member progress

\- Group activity totals

\- Weekly participation rates

\- Challenge completion status

\- Popular activity types



\## 🤝 Contributing



1\. Fork the repository

2\. Create feature branch

3\. Test thoroughly with Google Sheets

4\. Submit pull request



\## 📄 License



MIT License - feel free to use for your own running groups!



\## 🆘 Support



For issues or questions:

1\. Check the docs/ folder for setup guides

2\. Review Google Apps Script execution logs

3\. Verify LINE webhook connection

4\. Test with simple commands first



---



\*\*Built with ❤️ for running communities\*\*

