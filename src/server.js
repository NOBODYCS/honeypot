import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb, ensureSeeded } from './db.js';
import { createApi, ApiError } from './api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'content-security-policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'",
};

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(data);
}

function sendStatic(req, res, urlPath) {
  let filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, SECURITY_HEADERS);
    res.end('Forbidden');
    return;
  }
  let size = 0;
  if (urlPath === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }
  const ext = path.extname(filePath);
  const headers = {
    ...SECURITY_HEADERS,
    'content-type': MIME[ext] ?? 'application/octet-stream',
    'cache-control': 'no-cache',
  };
  if (req.method === 'HEAD') {
    size = fs.statSync(filePath).size;
    res.writeHead(200, { ...headers, 'content-length': size });
    res.end();
    return;
  }
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new ApiError(413, 'request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new ApiError(400, 'invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

export function startServer({ dbPath, port }) {
  const db = openDb(dbPath);
  ensureSeeded(db);
  const api = createApi(db);

  const server = http.createServer(async (req, res) => {
    res.on('error', () => {});
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        const body = await readBody(req);
        const result = await api.handle(req.method, url.pathname, body);
        sendJson(res, result.status, result.body);
      } else if (req.method === 'GET' || req.method === 'HEAD') {
        sendStatic(req, res, url.pathname);
      } else {
        sendJson(res, 405, { error: 'method not allowed' });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        sendJson(res, err.status, { error: err.message });
      } else {
        console.error(err);
        sendJson(res, 500, { error: 'internal server error' });
      }
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

const dbPath = process.env.HONEYPOT_DB_PATH || '/data/honeypot.db';
const port = Number(process.env.PORT || 8080);
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer({ dbPath, port }).then(() => {
    console.log(`Honeypot listening on port ${port}`);
  });
}
