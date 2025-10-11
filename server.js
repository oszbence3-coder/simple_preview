const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;

// Cache for beatmap sets (in-memory)
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// Serve static files from src directory
app.use(express.static('src'));

// Cache middleware for /d routes
app.use('/d', (req, res, next) => {
  const setId = req.url.split('/')[1];
  const now = Date.now();

  if (cache.has(setId)) {
    const cached = cache.get(setId);
    if (now - cached.timestamp < CACHE_DURATION) {
      console.log(`[CACHE HIT] Serving beatmap ${setId} from cache`);
      res.set('Content-Type', 'application/zip');
      res.set('Content-Length', cached.buffer.length);
      return res.send(cached.buffer);
    } else {
      console.log(`[CACHE EXPIRED] Removing beatmap ${setId} from cache`);
      cache.delete(setId);
    }
  }
  next();
});

// Cache middleware for /api/v2/b routes
app.use('/api/v2/b', (req, res, next) => {
  const beatmapId = req.url.split('/').pop();
  const cacheKey = `api_${beatmapId}`;
  const now = Date.now();

  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (now - cached.timestamp < CACHE_DURATION) {
      console.log(`[CACHE HIT] Serving API data for beatmap ${beatmapId} from cache`);
      res.set('Content-Type', 'application/json');
      return res.send(cached.data);
    } else {
      console.log(`[CACHE EXPIRED] Removing API data for beatmap ${beatmapId} from cache`);
      cache.delete(cacheKey);
    }
  }
  next();
});

// Proxy API requests to hide the original API
app.use('/api/v2/b', createProxyMiddleware({
  target: 'https://catboy.best',
  changeOrigin: true,
  selfHandleResponse: true,
  onProxyRes: (proxyRes, req, res) => {
    const beatmapId = req.url.split('/').pop();
    const cacheKey = `api_${beatmapId}`;
    if (proxyRes.statusCode === 200) {
      const chunks = [];
      proxyRes.on('data', (chunk) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const data = Buffer.concat(chunks).toString();
        cache.set(cacheKey, { data, timestamp: Date.now() });
        console.log(`[CACHED] API data for beatmap ${beatmapId}`);
        res.set('Content-Type', 'application/json');
        res.send(data);
      });
    } else {
      console.log(`[PROXY ERROR] API for beatmap ${beatmapId} status: ${proxyRes.statusCode}`);
      res.status(proxyRes.statusCode);
      proxyRes.pipe(res);
    }
  }
}));

// Proxy for beatmap downloads with caching
app.use('/d', createProxyMiddleware({
  target: 'https://catboy.best',
  changeOrigin: true,
  selfHandleResponse: true,
  onProxyRes: (proxyRes, req, res) => {
    const setId = req.url.split('/')[1];
    if (proxyRes.statusCode === 200) {
      const chunks = [];
      proxyRes.on('data', (chunk) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const buffer = Buffer.concat(chunks);
        cache.set(setId, { buffer, timestamp: Date.now() });
        console.log(`[CACHED] Beatmap ${setId} cached (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
        res.set('Content-Type', 'application/zip');
        res.send(buffer);
      });
    } else {
      console.log(`[PROXY ERROR] Beatmap ${setId} status: ${proxyRes.statusCode}`);
      res.status(proxyRes.statusCode);
      proxyRes.pipe(res);
    }
  }
}));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Cache duration: ${CACHE_DURATION / 1000 / 60} minutes`);
});