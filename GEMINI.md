# Community Watch Recorder

A community-focused tool for reporting and tracking antisocial behaviour in Hither Green.

## 🚀 Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, DM Sans Typeface, Lucide Icons.
- **Backend:** Node.js, Express, SQLite (Sequelize ORM).
- **Maps:** Leaflet & OpenStreetMap (CartoDB Positron style).
- **Email:** Nodemailer (via Apple Mail SMTP).
- **Deployment:** Docker & Docker Compose.
- **Access:** Cloudflare Tunnel (Secure remote access without port forwarding).

## 🛠 Architecture
- **Nginx Gateway:** Acts as a reverse proxy routing traffic to either the React frontend or the Node.js API.
- **Database:** Persistent SQLite database stored on the Raspberry Pi.
- **Storage:** Media uploads are stored in a local directory on the Pi.

## 📍 Key URLs
- **Public Website:** [https://o--o.co](https://o--o.co)
- **Admin Dashboard:** [https://o--o.co/admin](https://o--o.co/admin)
- **Admin Settings:** [https://o--o.co/admin/settings](https://o--o.co/admin/settings) (Super Admin Only)

## 🔐 Administration
- **Default Login:** `admin` / `admin123` (Recommended to change immediately).
- **Roles:**
  - `admin`: View and search reports, export data.
  - `superadmin`: Full access plus user management.

## 📦 Deployment Instructions
1. Sync files to Raspberry Pi (SAFE SYNC - excludes data):
   ```bash
   rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'database.sqlite' --exclude 'uploads/' "./" liamlewis@192.168.1.244:/home/liamlewis/community-watch-recorder
   ```
2. Start services on Pi:
   ```bash
   docker compose up -d --build
   ```

## 📧 Email Configuration
Configured via `server/.env`:
- `EMAIL_HOST`: `smtp.mail.me.com`
- `EMAIL_USER`: `liam@liamlewis.co.uk`
- `EMAIL_FROM`: `liam@liamlewis.co.uk`
- `EMAIL_RECIPIENTS`: `liam@liamlewis.co.uk`
