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

// API pour ajouter une app
app.post('/api/apps', async (req, res) => {
  try {
    const { name, description, url } = req.body;
    if (!name || !name.trim() || !url || !url.trim()) {
      return res.status(400).json({ error: 'Le nom et l\'URL sont requis.' });
    }

    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const appsFilePath = path.join(__dirname, 'apps.json');
    let apps = [];
    try {
      const appsData = await fs.readFile(appsFilePath, 'utf-8');
      apps = JSON.parse(appsData);
    } catch (e) {
      apps = [];
    }

    const newApp = {
      name: name.trim(),
      description: (description || '').trim(),
      url: formattedUrl
    };

    apps.push(newApp);
    await fs.writeFile(appsFilePath, JSON.stringify(apps, null, 2), 'utf-8');
    res.status(201).json(newApp);
  } catch (error) {
    console.error('Error adding app:', error);
    res.status(500).json({ error: 'Échec de l\'ajout du site' });
  }
});

// API pour supprimer une app
app.delete('/api/apps', async (req, res) => {
  try {
    const { url, name } = req.body;
    if (!url && !name) {
      return res.status(400).json({ error: 'URL ou nom requis' });
    }

    const appsFilePath = path.join(__dirname, 'apps.json');
    const appsData = await fs.readFile(appsFilePath, 'utf-8');
    let apps = JSON.parse(appsData);

    apps = apps.filter(app => app.url !== url && app.name !== name);

    await fs.writeFile(appsFilePath, JSON.stringify(apps, null, 2), 'utf-8');
    res.json({ success: true, apps });
  } catch (error) {
    console.error('Error deleting app:', error);
    res.status(500).json({ error: 'Échec de la suppression du site' });
  }
});

// Cache for favicons
const faviconCache = {};

// Generate placeholder SVG with first letter
function generatePlaceholder(text) {
  const letter = (text || '?').charAt(0).toUpperCase();
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
  const color = colors[letter.charCodeAt(0) % colors.length];
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='${encodeURIComponent(color)}' width='100' height='100'/%3E%3Ctext x='50' y='60' font-size='50' font-weight='bold' fill='white' text-anchor='middle' font-family='Arial'%3E${letter}%3C/text%3E%3C/svg%3E`;
}

app.get('/api/favicon', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  // Return from cache if available
  if (faviconCache[url]) {
    return res.json({ favicon: faviconCache[url] });
  }

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const appName = domain.split('.')[0]; // e.g., "atlas" from "atlas.theo-manya.fr"

    // Try multiple favicon sources (in order of reliability)
    const faviconSources = [
      `https://icons.duckduckgo.com/ip3/${domain}.ico`, // DuckDuckGo
      `https://www.google.com/s2/favicons?sz=128&domain=${domain}`, // Google
      generatePlaceholder(appName) // Fallback: colored placeholder with first letter
    ];

    let favicon = null;

    // Try each source
    for (const source of faviconSources) {
      try {
        if (source.startsWith('data:')) {
          // Placeholder SVG - always works
          favicon = source;
          break;
        }
        
        // Verify the URL is accessible
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(source, { 
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        clearTimeout(timeout);
        
        if (response.ok) {
          favicon = source;
          console.log(`✓ Favicon found for ${domain} via ${new URL(source).hostname}`);
          break;
        }
      } catch (err) {
        // Try next source
        continue;
      }
    }

    // If no favicon found, use placeholder
    if (!favicon) {
      favicon = generatePlaceholder(appName);
      console.log(`⚠ Using placeholder for ${domain}`);
    }

    faviconCache[url] = favicon;
    res.json({ favicon });
  } catch (error) {
    console.error('Favicon error:', error.message);
    res.json({ 
      favicon: generatePlaceholder('?')
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