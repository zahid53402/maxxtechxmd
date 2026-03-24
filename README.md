# MAXX-XMD WhatsApp Bot

  > A powerful WhatsApp bot with 150+ commands and a one-click session generator. Get your session ID in seconds and deploy anywhere.

  ---

  ## 🚀 Get Your Session ID

  Visit the session generator to link your WhatsApp and get a `SESSION_ID`:

  **👉 [Generate Session ID](https://maxxtechxmd.replit.app/pair)**

  ### Steps:
  1. Enter your WhatsApp number (with country code, no `+`) — e.g. `254700000000`
  2. Click **Generate Pairing Code**
  3. Open WhatsApp → ⋮ Menu → **Linked Devices** → **Link a Device** → **Link with phone number**
  4. Type the 8-digit code shown on screen
  5. Your **Session ID** appears on screen and is also sent to your WhatsApp
  6. Copy it — you'll paste it as `SESSION_ID` when deploying

  ---

  ## ⚡ One-Click Deploy

  Fork this repo and deploy with your `SESSION_ID`:

  | Platform | Button |
  |----------|--------|
  | **Render** | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Carlymaxx/maxxtechxmd) |
  | **Heroku** | [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Carlymaxx/maxxtechxmd) |
  | **Railway** | [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/Carlymaxx/maxxtechxmd) |
  | **Koyeb** | [![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?type=git&repository=github.com/Carlymaxx/maxxtechxmd&branch=main&name=maxx-xmd) |
  | **Replit** | [![Run on Replit](https://replit.com/badge/github/Carlymaxx/maxxtechxmd)](https://replit.com/github/Carlymaxx/maxxtechxmd) |

  ---

  ## 🔧 Environment Variables

  | Variable | Description | Required |
  |----------|-------------|----------|
  | `SESSION_ID` | Your session ID from the generator (starts with `MAXX-XMD~`) | ✅ Yes |
  | `BOT_NAME` | Custom name for your bot (default: MAXX-XMD) | No |
  | `PREFIX` | Command prefix (default: `.`) | No |
  | `OWNER_NUMBER` | Your WhatsApp number — enables owner commands | No |
  | `OWNER_NAME` | Your display name in the bot | No |
  | `MODE` | `public` / `private` / `inbox` | No |
  | `ANTI_CALL` | Reject incoming calls (`true`/`false`) | No |
  | `AUTO_READ` | Auto-mark messages as read | No |
  | `ALWAYS_ONLINE` | Stay always online | No |
  | `AUTO_VIEW_STATUS` | Auto-view status updates | No |

  ---

  ## 📋 Commands (150+)

  | Category | Commands |
  |----------|----------|
  | 🤖 **AI** | `.gpt` `.gemini` `.code` `.recipe` `.story` `.summarize` `.teach` |
  | 🎵 **Audio** | `.tomp3` `.bass` `.reverse` `.robot` `.earrape` `.toptt` |
  | ⬇️ **Download** | `.song` `.video` `.tiktok` `.instagram` `.twitter` `.facebook` |
  | 😂 **Fun** | `.jokes` `.fact` `.quotes` `.trivia` `.memes` `.xxqc` |
  | 🎮 **Games** | `.truth` `.dare` `.truthordare` |
  | 👥 **Group** | `.tagall` `.kick` `.add` `.promote` `.demote` `.mute` `.poll` `.antilink` |
  | 🕌 **Religion** | `.bible` `.quran` |
  | 🔍 **Search** | `.weather` `.define` `.lyrics` `.translate` `.imdb` `.yts` |
  | ⚙️ **Settings** | `.setprefix` `.mode` `.anticall` `.setwelcome` `.getsettings` |
  | ⚽ **Sports** | EPL, LaLiga, CL, Bundesliga, Serie A, Ligue1, EFL, WC, WWE |
  | 🔧 **Tools** | `.sticker` `.qrcode` `.tinyurl` `.calculate` `.genpass` `.fancy` |

  Type `.menu` to see all categories, or `.menu <category>` for specific commands.

  ---

  ## 🛠 Self-Host

  ```bash
  git clone https://github.com/Carlymaxx/maxxtechxmd.git
  cd maxxtechxmd
  pnpm install
  SESSION_ID="MAXX-XMD~your_session_here" pnpm --filter @workspace/api-server run dev
  ```

  ---

  ## 📞 Support

  - 🌐 Session Generator: [maxxtechxmd.replit.app](https://maxxtechxmd.replit.app/pair)
  - ⭐ Star this repo if it helped you!

  ---

  > _Built with ❤️ by MAXX XMD Team — Powered by Baileys_
  