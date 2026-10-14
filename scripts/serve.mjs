import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT ?? 4180);
const HOST = process.env.HOST ?? '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf'
};

const HEADERS = {
  'Cache-Control': 'no-cache',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  if (decoded.split('/').some((segment) => segment.startsWith('.') && segment !== '.well-known')) return null;
  const target = resolve(ROOT, normalize(`.${decoded}`));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return null;
  const info = await stat(target).catch(() => null);
  if (info?.isDirectory()) return resolveFile(join(decoded, 'index.html'));
  return info?.isFile() ? target : null;
}

createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, HEADERS).end();
    return;
  }
  const file = await resolveFile(request.url ?? '/').catch(() => null);
  const status = file ? 200 : 404;
  const path = file ?? join(ROOT, '404.html');
  const body = await readFile(path);
  response.writeHead(status, { ...HEADERS, 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream' });
  response.end(request.method === 'HEAD' ? undefined : body);
}).listen(PORT, HOST, () => {
  console.log(`Cyberstart: http://${HOST === '127.0.0.1' ? 'localhost' : HOST}:${PORT}`);
});
