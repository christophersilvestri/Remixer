import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import db from './db';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// LinkedIn OAuth endpoints
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI!;

// Step 1: Redirect user to LinkedIn for authentication
app.get('/auth/linkedin', (req, res) => {
  const scope = 'w_member_social';
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
  res.redirect(authUrl);
});

// Step 2: LinkedIn redirects back with code; exchange for access token
app.get('/auth/linkedin/callback', (req, res) => {
  (async () => {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).send('Missing code');
      return;
    }

    try {
      // Exchange code for access token
      const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: LINKEDIN_REDIRECT_URI,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const { access_token, expires_in } = tokenRes.data;

      // Get user's LinkedIn ID
      const profileRes = await axios.get('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const linkedin_id = profileRes.data.id;

      // Store or update user in DB
      const expires_at = Math.floor(Date.now() / 1000) + expires_in;
      const stmt = db.prepare(`INSERT INTO users (linkedin_id, access_token, expires_at) VALUES (?, ?, ?)
        ON CONFLICT(linkedin_id) DO UPDATE SET access_token=excluded.access_token, expires_at=excluded.expires_at`);
      stmt.run(linkedin_id, access_token, expires_at);

      // For demo: send a simple success message
      res.send('LinkedIn authentication successful! You can close this window.');
    } catch (err) {
      console.error('LinkedIn OAuth error:', err);
      res.status(500).send('LinkedIn authentication failed.');
    }
  })();
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
