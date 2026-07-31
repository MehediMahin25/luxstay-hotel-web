# LuxStay Hotel Booking System

This repository contains a simple hotel booking web application with a Node.js/Express backend and static HTML/CSS/JS frontend. It uses SQLite for data storage and includes SSL Commerz payment gateway integration.

## Getting Started (Development)

1. **Install dependencies**
   ```bash
   cd "D:\Web development\Backend"
   npm install
   ```

2. **Copy `.env.example`** to `.env` and modify as needed:
   ```bash
   cp .env.example .env
   ```
   - `PORT`  – port the server listens on (defaults to 3007)
   - `BASE_URL` – base URL used when building callback links (e.g. `http://localhost:3007` or your deployed domain)
   - SSL Commerz credentials (`SSL_STORE_ID`, `SSL_STORE_PASSWORD`, `SSL_IS_SANDBOX`) – defaults to the public sandbox demo store if left unset

3. **Run the server**
   ```bash
   npm run dev   # uses nodemon
   ```
   or
   ```bash
   npm start    # production mode
   ```
4. **Open the frontend**
   - Visit `http://localhost:3007` in your browser. The frontend assets are served from the project root.

## Preparing for Deployment

The backend already uses environment variables for configuration and listens on `process.env.PORT` so it can be hosted anywhere Node is supported.

### Quick checklist
- ✅ `package.json` contains a start script (`node server.js`) and necessary dependencies.
- ✅ Configuration is read from environment variables (`PORT`, `BASE_URL`, SSL Commerz settings).
- ✅ Frontend fetch calls use relative paths (`/api/...`) so the app works on any host.
- ✅ Static assets are served from the project root via Express.
- ✅ `.env.example` documents required variables; do not commit a real `.env` file.

## Deploying to a Provider

You can deploy this project to any service that runs Node.js. Below is an example using Heroku, but the steps are similar for Render, Vercel, DigitalOcean App Platform, etc.

### Heroku (example)

1. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) and log in:
   ```bash
   heroku login
   ```
2. Create a new app:
   ```bash
   cd "D:\Web development\Backend"
   git init               # if not already a git repo
   heroku create your-app-name
   ```
3. Add the Profile (already included) and commit everything:
   ```bash
   git add .
   git commit -m "prepare for deployment"
   git push heroku main   # or master
   ```
4. Set configuration variables on Heroku:
   ```bash
   heroku config:set BASE_URL=https://your-app.herokuapp.com
   # set SSL_STORE_ID / SSL_STORE_PASSWORD / SSL_IS_SANDBOX=false when moving to production
   ```
5. Open your app:
   ```bash
   heroku open
   ```

### Other Hosts

- **Render**: connect your GitHub repo, choose `Node`, set build command `npm install` and start command `npm start`.
- **Vercel/Netlify**: you can deploy the frontend separately and use the backend as a serverless function or set up a proxy to the Express server.
- **Docker / Cloud VM**: build a Dockerfile (not included here) or deploy the repository to an EC2/Droplet/VM and run `npm install && npm start`.

## Custom Domain & HTTPS

Most providers allow you to add a custom domain and automatically manage HTTPS certificates (Let's Encrypt). After your deployment is running, point your domain's DNS to the host and enable SSL on the provider's dashboard.

## Troubleshooting

1. **App fails to start**: check `PORT` env var is set, view logs (`heroku logs --tail`, `render.com` logs, etc.).
2. **API calls failing**: ensure frontend and backend are on same origin or configure `CORS_ORIGIN` if you modify CORS.
3. **Payment flow issues**: verify `BASE_URL` is correct for callback URLs and SSL Commerz credentials are valid.

Happy hosting! 
