# RUPUR Fragrances – Setup & Live karne ke steps (Node.js version)

Project me 2 folder hain:

| Folder | Kya hai |
|---|---|
| `frontend/` | Website (React + Vite) – design, pages, cart, checkout |
| `backend/`  | Node.js + Express + MySQL API – login/signup, orders, Razorpay, Delhivery, emails |

Live pe **ek hi Node app** chalta hai: wahi `/api/...` bhi sambhalta hai aur website bhi dikhata hai.

---

## 1. Apne computer pe chalana (Windows)

Sirf **Node.js 22 LTS** chahiye (nodejs.org se). PHP / XAMPP / MySQL ki zaroorat nahi.

Check: `node -v` → `v22.13` ya usse naya hona chahiye.

**Terminal 1 – backend**
```
cd backend
npm install
npm run dev
```
`RUPUR API chal raha hai: http://localhost:8000/api/health` dikhe toh sahi hai.
(Dev mode me database ek local SQLite file `backend/storage/rupur.sqlite` hai – MySQL nahi chahiye.)

**Terminal 2 – website**
```
cd frontend
npm install
npm run dev
```
Browser me kholo: **http://localhost:5173**

> ⚠️ `.env` me LIVE Razorpay keys hain. Local pe payment karoge toh **asli paise katenge**.
> Testing ke liye Razorpay se `rzp_test_...` keys lo aur local `.env` me wahi daalo.

---

## 2. Live karna – Hostinger (Business plan me Node.js Web App)

Hostinger Business Web Hosting pe Node.js web app chalta hai (Node 18/20/22/24).

### Step 1 – MySQL database banao
hPanel → **Websites → rupurfragrances.com → Databases → MySQL Databases**
- Database name, username, password banao → teeno note karo.
- Tables khud ban jaate hain jab app pehli baar start hota hai.

### Step 2 – Upload ke liye zip taiyar karo (apne computer pe)
```
cd backend
npm run build:site
```
Ye website build karke `backend/public/` me daal deta hai.
Ab **`backend` folder ke andar ki files** ka zip banao (`node_modules` aur `.env` mat daalna):
`server.js, package.json, package-lock.json (agar hai), src/, data/, scripts/, public/, storage/`

### Step 3 – Web App banao
hPanel → **Websites → Create site → Web App → Upload your website files** → zip upload.

Build settings:
| Setting | Value |
|---|---|
| Framework | **Express** (na dikhe toh Other) |
| Node version | **22.x** |
| Entry file | `server.js` |
| Build command / Output directory | khaali chhodo |

### Step 4 – Environment Variables
Web App ke dashboard me **Environment Variables** me `.env` ki saari lines ek-ek karke daalo:
- `APP_ENV=production`
- `APP_URL=https://www.rupurfragrances.com`
- `DB_DRIVER=mysql`, `DB_HOST`, `DB_PORT=3306`, `DB_NAME`, `DB_USER`, `DB_PASS` (Step 1 wale)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `DELHIVERY_API_KEY`, `DELHIVERY_BASE_URL`, `DELHIVERY_PICKUP_LOCATION`
- `SMTP_USER`, `SMTP_PASS` (Gmail App Password), `ORDER_NOTIFY_EMAIL`
- baaki jo `.env.example` me hain

`PORT` mat daalna – Hostinger khud deta hai, app usi pe chalta hai.

Phir **Deploy** / **Restart**.

### Step 5 – Domain
Web App ko domain `rupurfragrances.com` se jodo (purani AI-Builder site hatani padegi – client se confirm karke).
SSL (https) on rakho.

### Step 6 – Check karo
- `https://www.rupurfragrances.com/api/health` → `{"ok":true}`
- Website khule, signup/login ho, cart me product jaye
- Checkout pe pincode check ho

> Jab bhi code badlo: Step 2 ka naya zip → upload → redeploy.
> Server pe files seedha edit mat karna, redeploy pe overwrite ho jaati hain.

---

## Demo: Vercel (website) + Render (backend)
Client ko dikhane ke liye (free). Website Vercel pe, API Render pe; `frontend/vercel.json` `/api` ko Render pe bhejta hai.
- Render → New Web Service → repo → Root Directory `backend`, Build `npm install`, Start `npm start`.
  Env: `.env` ki lines (PORT wali nahi) + `APP_URL=https://<vercel-url>`, `DB_DRIVER=sqlite`, `DELHIVERY_ENABLED=false`, Razorpay **test** keys.
- `frontend/vercel.json` me `RENDER-APP-NAAM` ki jagah Render ka naam → push.
- Vercel → project → Root Directory `frontend` (Vite) → Deploy.
- Free Render 15 min baad so jaata hai (pehli baar ~1 min) aur SQLite ka data redeploy pe mit jaata hai – sirf demo ke liye.

## 3. Razorpay setup
Razorpay Dashboard → **Account & Settings → Webhooks → Add**
- URL: `https://www.rupurfragrances.com/api/razorpay/webhook`
- Events: `payment.captured`, `order.paid`
- Secret: koi bhi strong text → wahi `RAZORPAY_WEBHOOK_SECRET` me daalo

Pehle `rzp_test_` keys se ek order karke dekho, phir live keys lagao.

## 4. Delhivery setup
- Delhivery One me pickup location ka naam **bilkul wahi** hona chahiye jo `DELHIVERY_PICKUP_LOCATION` me hai.
- Key live hai ya test → live: `https://track.delhivery.com`, test: `https://staging-express.delhivery.com`
- Payment ke baad shipment apne-aap banta hai, AWB order page pe dikhta hai.
- Agar shipment fail ho toh order "paid" hi rehta hai, aur Rupurperfumes@gmail.com pe wajah ke saath email aata hai → Delhivery panel se manually bana lo.

## 5. Gmail (order emails)
Rupurperfumes@gmail.com → Google Account → Security → **2-Step Verification on** → **App passwords** → 16 letter ka password → `SMTP_PASS`.

## 6. Products badalna
`backend/data/products.json` edit karo (name, price, mrp, img, images, story, notes, gender, type, soldOut, weight) → redeploy.
Photos `frontend/public/products/` me daalo (webp/jpg, ~1000px) aur path `/products/naam.webp` likho. `type: "Attar"` wale sirf Attar tab me dikhte hain.
`frontend/src/data/products.js` me bhi wahi list hai (server band ho tab dikhti hai) – usko bhi same rakhna.
Shipping rule badle (999 / ₹80 / ₹100) toh `.env` ke saath `frontend/src/context/CartContext.jsx` ka `shippingFor` bhi same karo.

## 7. Security
- `.env` / keys kabhi GitHub, WhatsApp ya frontend code me nahi.
- Live hone ke baad Razorpay secret aur Delhivery key **rotate** (naya generate) kar lena, kyunki ye chat me share hui thi.
- Prices hamesha server pe calculate hote hain – koi browser se price badal ke order nahi kar sakta.

### Alternative: VPS
VPS pe: Node 22 + MySQL install → project copy → `cd backend && npm install && npm run build:site` → `.env` bharo → `pm2 start server.js --name rupur` → Nginx se domain ko `localhost:8000` pe proxy.

Docs: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger · https://docs.hostinger.com/node.js/overview-1/express
