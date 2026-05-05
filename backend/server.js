// ─── SAION AI — Backend Server ────────────────────────────────────────────────
// Handles: Netlify website deployment
// Node.js + Express
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT'] }));
app.use(express.json({ limit: '2mb' }));

// ── GET /health ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SAION AI Backend', port: PORT });
});

// ── POST /deploy-website ──────────────────────────────────────────────────────
// Body: { html: string, siteName: string }
// Returns: { url, siteId, deployId, expiresAt }
app.post('/deploy-website', async (req, res) => {
  const { html, siteName } = req.body;
  const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;

  if (!netlifyToken) {
    return res.status(500).json({ error: 'Netlify token not configured on server' });
  }
  if (!html) {
    return res.status(400).json({ error: 'Missing html' });
  }

  try {
    // Step 1 — Create a new Netlify site
    const slug = (siteName || 'saion-site')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40) + '-' + Date.now().toString(36);

    const createRes = await axios.post(
      'https://api.netlify.com/api/v1/sites',
      { name: slug },
      {
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const siteId = createRes.data.id;
    const siteUrl = createRes.data.ssl_url || createRes.data.url;

    // Step 2 — Compute SHA1 of html
    const sha1 = crypto.createHash('sha1').update(html).digest('hex');

    // Step 3 — Create deploy with file manifest
    const deployRes = await axios.post(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      { files: { '/index.html': sha1 }, draft: false },
      {
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const deployId = deployRes.data.id;

    // Step 4 — Upload the HTML file
    await axios.put(
      `https://api.netlify.com/api/v1/deploys/${deployId}/files/index.html`,
      html,
      {
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
          'Content-Type': 'application/octet-stream',
        },
        timeout: 15000,
      }
    );

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 2);

    return res.json({
      url: siteUrl,
      siteId,
      deployId,
      expiresAt: expiresAt.toISOString(),
      plan: 'free',
    });

  } catch (err) {
    console.error('[Deploy] Error:', err?.response?.data || err.message);
    return res.status(500).json({
      error: err?.response?.data?.message || err.message || 'Deployment failed',
    });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 SAION AI Backend running on http://localhost:${PORT}`);
  console.log(`   Deploy:  http://localhost:${PORT}/deploy-website`);
  console.log(`   Health:  http://localhost:${PORT}/health\n`);
});
