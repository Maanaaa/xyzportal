import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Middleware d'authentification via header nginx
app.use((req, res, next) => {
  const remoteUser = req.get('Remote-User') || req.get('X-Remote-User');
  if (!remoteUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = remoteUser;
  next();
});

// API pour récupérer les apps
app.get('/api/apps', async (req, res) => {
  try {
    const appsData = await fs.readFile(path.join(__dirname, 'apps.json'), 'utf-8');
    const apps = JSON.parse(appsData);
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load apps' });
  }
});

// Proxy pour récupérer les favicons (cache simple)
const faviconCache = {};

app.get('/api/favicon', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  if (faviconCache[url]) {
    return res.json({ favicon: faviconCache[url] });
  }

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Essayer Google Favicon API
    const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
    const faviconCache_url = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%2323272E' width='100' height='100'/%3E%3Ctext x='50' y='60' font-size='60' fill='%238B9DC3' text-anchor='middle'%3E?%3C/text%3E%3C/svg%3E`;

    faviconCache[url] = faviconUrl;
    res.json({ favicon: faviconUrl });
  } catch (error) {
    res.json({ 
      favicon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%2323272E' width='100' height='100'/%3E%3Ctext x='50' y='60' font-size='60' fill='%238B9DC3' text-anchor='middle'%3E?%3C/text%3E%3C/svg%3E` 
    });
  }
});

// Servir index.html pour les autres routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 XYZ Portal running on port ${PORT}`);
});    