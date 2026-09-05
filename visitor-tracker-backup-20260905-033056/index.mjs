import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { generatePublicCopy } from './redact.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load server/.env without requiring dotenv at runtime.
try {
  const envText = await fs.readFile(path.join(__dirname, '.env'), 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const THEME_FILE = path.join(UPLOAD_DIR, 'portfolio-theme');
const THEME_META = path.join(DATA_DIR, 'theme.json');
const DB_FILE = path.join(DATA_DIR, 'documents.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const ABOUT_FILE = path.join(DATA_DIR, 'about.json');
const PORT = Number(process.env.PORT || 5000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-this-password';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Map([
  ['application/pdf', 'pdf'],
  ['application/msword', 'doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

await fs.mkdir(DATA_DIR, { recursive: true });
await fs.mkdir(UPLOAD_DIR, { recursive: true });
try { await fs.access(DB_FILE); } catch { await fs.writeFile(DB_FILE, '[]'); }
try { await fs.access(PROJECTS_FILE); } catch {
  await fs.writeFile(PROJECTS_FILE, JSON.stringify([
    { id: crypto.randomUUID(), title: 'MarketPulse NG', description: 'A decentralized market intelligence system tracking real-time market prices in Nigeria.', tech: ['React', 'Data Systems', 'UI/UX'], featured: true, icon: '▥', url: '' },
    { id: crypto.randomUUID(), title: 'Click Counter', description: 'A simple React mini project demonstrating state management.', tech: ['React', 'JavaScript'], featured: true, icon: '↯', url: '' },
    { id: crypto.randomUUID(), title: 'AI Transcription Pro', description: 'A transcription tool for converting audio to text using AI workflows.', tech: ['FastAPI', 'Python', 'AI'], featured: true, icon: '◉', url: '' }
  ], null, 2));
}

async function readDb() {
  try { return JSON.parse(await fs.readFile(DB_FILE, 'utf8')); } catch { return []; }
}
async function writeDb(items) {
  await fs.writeFile(DB_FILE, JSON.stringify(items, null, 2));
}
async function readProjects() {
  try { return JSON.parse(await fs.readFile(PROJECTS_FILE, 'utf8')); } catch { return []; }
}
async function writeProjects(items) {
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(items, null, 2));
}

async function readAbout() {
  try {
    return JSON.parse(await fs.readFile(ABOUT_FILE, 'utf8'));
  } catch {
    return {
      name: 'Alwali Umara Amshi',
      role: 'Educator • Technology Builder • Community Leader • Innovator',
      intro: 'I build practical digital solutions that connect education, technology, data, and community impact.',
      whoIAm: '',
      educationTeaching: '',
      technology: '',
      communityLeadership: '',
      innovation: '',
      approach: '',
      facts: [],
      updatedAt: null
    };
  }
}

async function writeAbout(about) {
  await fs.writeFile(ABOUT_FILE, JSON.stringify(about, null, 2));
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*' });
  res.end(body);
}
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
}
function tokenFor(username) {
  const payload = Buffer.from(JSON.stringify({ username, exp: Date.now() + 1000 * 60 * 60 * 12 })).toString('base64url');
  const sig = crypto.createHmac('sha256', ADMIN_PASSWORD).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}
function isAuthorized(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return false;
  const [payload, sig] = header.slice(7).split('.');
  if (!payload || !sig) return false;
  const expected = crypto.createHmac('sha256', ADMIN_PASSWORD).update(payload).digest('base64url');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}
async function readBody(req, limit = 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('Request too large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
function parseMultipart(body, contentType) {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) throw new Error('Missing multipart boundary');
  const boundary = Buffer.from(`--${match[1] || match[2]}`);
  const fields = {};
  const files = {};
  let file = null;
  let start = body.indexOf(boundary);
  while (start !== -1) {
    start += boundary.length;
    if (body.slice(start, start + 2).toString() === '--') break;
    if (body.slice(start, start + 2).toString() === '\r\n') start += 2;
    const next = body.indexOf(boundary, start);
    if (next === -1) break;
    const part = body.slice(start, next - 2);
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;
    const headers = part.slice(0, headerEnd).toString();
    const content = part.slice(headerEnd + 4);
    const disp = headers.match(/content-disposition:\s*form-data;\s*([^\r\n]+)/i)?.[1] || '';
    const name = disp.match(/name="([^"]+)"/)?.[1];
    const filename = disp.match(/filename="([^"]*)"/)?.[1];
    const contentTypeMatch = headers.match(/content-type:\s*([^\r\n]+)/i);
    if (filename !== undefined && (name === 'file' || name === 'publicFile')) {
      files[name] = { originalName: path.basename(filename), mimeType: contentTypeMatch?.[1]?.trim() || 'application/octet-stream', buffer: content };
      if (name === 'file') file = files[name];
    } else if (name) {
      fields[name] = content.toString('utf8');
    }
    start = next;
  }
  return { fields, file, files };
}
function safeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
}


async function readTheme() {
  try { return JSON.parse(await fs.readFile(THEME_META, 'utf8')); } catch { return { url: null, updatedAt: null, originalName: null }; }
}
async function writeTheme(theme) {
  await fs.writeFile(THEME_META, JSON.stringify(theme, null, 2));
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true });

    if (req.method === 'GET' && url.pathname === '/api/theme') {
      const theme = await readTheme();
      return json(res, 200, theme);
    }

    if (req.method === 'POST' && url.pathname === '/api/theme') {
      if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
      const body = await readBody(req, 12 * 1024 * 1024);
      const { file } = parseMultipart(body, req.headers['content-type'] || '');
      if (!file) return json(res, 400, { error: 'Please select a wallpaper image.' });
      if (file.buffer.length > 10 * 1024 * 1024) return json(res, 413, { error: 'Maximum wallpaper size is 10 MB.' });
      const allowed = new Map([['image/jpeg','jpg'], ['image/png','png'], ['image/webp','webp']]);
      const ext = allowed.get(file.mimeType);
      if (!ext) return json(res, 415, { error: 'Wallpaper must be JPG, PNG or WEBP.' });
      const themeFilename = `${THEME_FILE}.${ext}`;
      // Remove previous theme variants before saving the new one.
      for (const candidate of ['jpg','png','webp']) await fs.rm(`${THEME_FILE}.${candidate}`, { force: true });
      await fs.writeFile(themeFilename, file.buffer);
      const theme = { url: `/api/theme/image`, updatedAt: new Date().toISOString(), originalName: file.originalName, mimeType: file.mimeType };
      await writeTheme(theme);
      return json(res, 201, theme);
    }

    if (req.method === 'DELETE' && url.pathname === '/api/theme') {
      if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
      for (const candidate of ['jpg','png','webp']) await fs.rm(`${THEME_FILE}.${candidate}`, { force: true });
      await writeTheme({ url: null, updatedAt: new Date().toISOString(), originalName: null });
      return json(res, 200, { success: true });
    }

    if (req.method === 'GET' && url.pathname === '/api/theme/image') {
      const theme = await readTheme();
      if (!theme.url) return json(res, 404, { error: 'No wallpaper configured.' });
      const ext = path.extname(theme.originalName || '').toLowerCase();
      const candidates = ['jpg','png','webp'];
      let filePath = null;
      for (const candidate of candidates) {
        const candidatePath = `${THEME_FILE}.${candidate}`;
        try { await fs.access(candidatePath); filePath = candidatePath; break; } catch {}
      }
      if (!filePath) return json(res, 404, { error: 'Wallpaper file not found.' });
      const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      const stat = await fs.stat(filePath);
      res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stat.size, 'Cache-Control': 'no-store, must-revalidate' });
      return fsSync.createReadStream(filePath).pipe(res);
    }


    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      const body = JSON.parse((await readBody(req)).toString() || '{}');
      if (body.username !== ADMIN_USERNAME || body.password !== ADMIN_PASSWORD) return json(res, 401, { error: 'Invalid credentials' });
      return json(res, 200, { token: tokenFor(body.username), expiresInHours: 12 });
    }

    if (req.method === 'GET' && url.pathname === '/api/projects') {
      const projects = await readProjects();
      return json(res, 200, projects.sort((a, b) => Number(b.featured) - Number(a.featured)));
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/projects') {
      if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
      return json(res, 200, await readProjects());
    }

    if (req.method === 'POST' && url.pathname === '/api/projects') {
      if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
      const body = await readBody(req, 256 * 1024);
      const { fields, file } = parseMultipart(body, req.headers['content-type'] || '');
      
      const title = String(fields.title || '').trim();
      const description = String(fields.description || '').trim();
      if (!title || !description) return json(res, 400, { error: 'Project title and description are required.' });
      
      const id = crypto.randomUUID();
      let iconUrl = null;
      
      if (file) {
        const iconAllowed = new Map([['image/svg+xml', 'svg'], ['image/png', 'png'], ['image/jpeg', 'jpg'], ['image/webp', 'webp']]);
        const ext = iconAllowed.get(file.mimeType);
        if (!ext) return json(res, 415, { error: 'Icon must be SVG, PNG, JPEG or WEBP.' });
        const iconFilename = `${id}-icon.${ext}`;
        const iconPath = path.join(UPLOAD_DIR, iconFilename);
        await fs.writeFile(iconPath, file.buffer);
        iconUrl = `/uploads/${iconFilename}`;
      }
      
      let tech = [];
      try {
        const techStr = String(fields.tech || '').trim();
        if (techStr && techStr !== '[]') tech = JSON.parse(techStr);
      } catch (e) {
        tech = [];
      }
      const project = { id, title, description, tech: Array.isArray(tech) ? tech.map(String).map((x) => x.trim()).filter(Boolean).slice(0, 12) : [], featured: fields.featured !== 'false', iconUrl, url: String(fields.url || '').trim() };
      const projects = await readProjects(); projects.push(project); await writeProjects(projects);
      return json(res, 201, project);
    }

    const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (projectMatch && (req.method === 'PUT' || req.method === 'DELETE')) {
      if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
      const id = projectMatch[1];
      const projects = await readProjects();
      const index = projects.findIndex((p) => p.id === id);
      if (index === -1) return json(res, 404, { error: 'Project not found.' });
      if (req.method === 'DELETE') {
        const project = projects[index];
        if (project.iconUrl) {
          const iconFilename = project.iconUrl.split('/').pop();
          await fs.rm(path.join(UPLOAD_DIR, iconFilename), { force: true });
        }
        await writeProjects(projects.filter((p) => p.id !== id));
        return json(res, 200, { success: true });
      }
      
      const body = await readBody(req, 256 * 1024);
      const { fields, file } = parseMultipart(body, req.headers['content-type'] || '');
      const current = projects[index];
      const title = String(fields.title ?? current.title).trim();
      const description = String(fields.description ?? current.description).trim();
      if (!title || !description) return json(res, 400, { error: 'Project title and description are required.' });
      
      let iconUrl = current.iconUrl;
      if (file) {
        const iconAllowed = new Map([['image/svg+xml', 'svg'], ['image/png', 'png'], ['image/jpeg', 'jpg'], ['image/webp', 'webp']]);
        const ext = iconAllowed.get(file.mimeType);
        if (!ext) return json(res, 415, { error: 'Icon must be SVG, PNG, JPEG or WEBP.' });
        if (current.iconUrl) {
          const oldIconFilename = current.iconUrl.split('/').pop();
          await fs.rm(path.join(UPLOAD_DIR, oldIconFilename), { force: true });
        }
        const iconFilename = `${id}-icon.${ext}`;
        const iconPath = path.join(UPLOAD_DIR, iconFilename);
        await fs.writeFile(iconPath, file.buffer);
        iconUrl = `/uploads/${iconFilename}`;
      }
      
      let tech = current.tech;
      try {
        const techStr = String(fields.tech ?? '').trim();
        if (techStr && techStr !== '[]') tech = JSON.parse(techStr);
      } catch (e) {
        tech = current.tech;
      }
      projects[index] = { ...current, title, description, tech: Array.isArray(tech) ? tech.map(String).map((x) => x.trim()).filter(Boolean).slice(0, 12) : current.tech, featured: fields.featured !== undefined ? fields.featured !== 'false' : current.featured, iconUrl, url: String(fields.url ?? current.url ?? '').trim() };
      await writeProjects(projects);
      return json(res, 200, projects[index]);
    }

    if (req.method === 'GET' && url.pathname === '/api/documents') {
      const docs = await readDb();
      const publicDocs = docs.filter((d) => d.published !== false).map((d) => ({ ...d, url: d.publicUrl || d.url })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return json(res, 200, publicDocs);
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/documents') {
      if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
      return json(res, 200, await readDb());
    }

    if (req.method === 'POST' && url.pathname === '/api/documents') {
      if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
      const body = await readBody(req, MAX_FILE_SIZE + 2 * 1024 * 1024);
      const { fields, file, files } = parseMultipart(body, req.headers['content-type'] || '');
      if (!file) return json(res, 400, { error: 'Please select an original file.' });
      if (file.buffer.length > MAX_FILE_SIZE) return json(res, 413, { error: 'Maximum file size is 10 MB.' });
      const ext = ALLOWED.get(file.mimeType);
      if (!ext) return json(res, 415, { error: 'Unsupported file type.' });
      const category = ['certificate', 'resume', 'document'].includes(fields.category) ? fields.category : 'document';
      const id = crypto.randomUUID();
      const filename = `${id}-${safeFileName(file.originalName)}`;
      const originalPath = path.join(UPLOAD_DIR, filename);
      await fs.writeFile(originalPath, file.buffer);
      let publicUrl = null;
      let publicMimeType = null;
      if (category === 'certificate') {
        if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.mimeType)) {
          await fs.rm(originalPath, { force: true });
          return json(res, 415, { error: 'Automatic certificate redaction supports PDF, JPG, PNG and WEBP certificates.' });
        }
        const publicFilename = `${id}-public-${safeFileName(file.originalName).replace(/\.(pdf|jpe?g|png|webp)$/i, '')}${file.mimeType === 'application/pdf' ? '.pdf' : '.png'}`;
        try {
          const result = await generatePublicCopy(originalPath, file.mimeType, path.join(UPLOAD_DIR, publicFilename));
          publicUrl = `/uploads/${publicFilename}`;
          publicMimeType = result.mimeType;
        } catch (redactionError) {
          await fs.rm(originalPath, { force: true });
          return json(res, 422, { error: `Could not automatically create a safe public copy: ${redactionError.message}` });
        }
      }
      const doc = { id, title: fields.title?.trim() || file.originalName, issuer: fields.issuer?.trim() || '', date: fields.date?.trim() || '', category, originalName: file.originalName, mimeType: file.mimeType, size: file.buffer.length, url: `/api/admin/documents/${id}/original`, privateFilename: filename, publicUrl, publicMimeType, hasPublicVersion: Boolean(publicUrl), published: fields.published !== 'false', createdAt: new Date().toISOString() };
      const docs = await readDb(); docs.push(doc); await writeDb(docs);
      return json(res, 201, doc);
    }

    const originalMatch = url.pathname.match(/^\/api\/admin\/documents\/([^/]+)\/original$/);
    if (req.method === 'GET' && originalMatch) {
      if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
      const docs = await readDb();
      const doc = docs.find((d) => d.id === originalMatch[1]);
      if (!doc) return json(res, 404, { error: 'Document not found.' });
      const filename = doc.privateFilename || doc.url.split('/').pop();
      const filePath = path.join(UPLOAD_DIR, path.basename(filename));
      try {
        const stat = await fs.stat(filePath);
        res.writeHead(200, { 'Content-Type': doc.mimeType, 'Content-Disposition': `inline; filename=\"${safeFileName(doc.originalName)}\"`, 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
        return fsSync.createReadStream(filePath).pipe(res);
      } catch { return json(res, 404, { error: 'File not found.' }); }
    }

    const deleteMatch = url.pathname.match(/^\/api\/documents\/([^/]+)$/);
    if (req.method === 'DELETE' && deleteMatch) {
      if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
      const id = deleteMatch[1];
      const docs = await readDb();
      const doc = docs.find((d) => d.id === id);
      if (!doc) return json(res, 404, { error: 'Document not found.' });
      await fs.rm(path.join(UPLOAD_DIR, path.basename(doc.privateFilename || doc.url)), { force: true });
      if (doc.publicUrl && doc.publicUrl !== doc.url) await fs.rm(path.join(UPLOAD_DIR, path.basename(doc.publicUrl)), { force: true });
      await writeDb(docs.filter((d) => d.id !== id));
      return json(res, 200, { success: true });
    }

    if (req.method === 'GET' && url.pathname.startsWith('/uploads/')) {
      const name = path.basename(url.pathname);
      const filePath = path.join(UPLOAD_DIR, name);
      if (!filePath.startsWith(UPLOAD_DIR)) return json(res, 400, { error: 'Invalid path' });
      
      const isPublic = name.includes('-public-');
      const isIcon = name.includes('-icon.');
      
      if (!isPublic && !isIcon) return json(res, 403, { error: 'This file is private.' });
      
      try {
        const stat = await fs.stat(filePath);
        const ext = path.extname(name).toLowerCase();
        const mimeByExt = {
          '.pdf': 'application/pdf', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
          '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        const mime = mimeByExt[ext] || 'application/octet-stream';
        const disposition = ['.doc', '.docx'].includes(ext) ? 'attachment' : 'inline';
        res.writeHead(200, { 'Content-Type': mime, 'Content-Disposition': `${disposition}; filename="${name.replace(/"/g, '')}"`, 'Content-Length': stat.size, 'Cache-Control': 'public, max-age=86400' });
        return fsSync.createReadStream(filePath).pipe(res);
      } catch { return json(res, 404, { error: 'File not found.' }); }
    }

    if (req.method === 'GET' && url.pathname === '/api/about') {
  return json(res, 200, await readAbout());
}

if (req.method === 'GET' && url.pathname === '/api/admin/about') {
  if (!isAuthorized(req)) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  return json(res, 200, await readAbout());
}

if (req.method === 'PUT' && url.pathname === '/api/about') {
  if (!isAuthorized(req)) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  try {
    const body = JSON.parse(
      (await readBody(req, 256 * 1024)).toString() || '{}'
    );

    const about = {
      name: String(body.name ?? '').trim().slice(0, 120),
      role: String(body.role ?? '').trim().slice(0, 200),
      intro: String(body.intro ?? '').trim().slice(0, 1000),
      whoIAm: String(body.whoIAm ?? '').trim().slice(0, 5000),
      educationTeaching: String(body.educationTeaching ?? '').trim().slice(0, 5000),
      technology: String(body.technology ?? '').trim().slice(0, 5000),
      communityLeadership: String(body.communityLeadership ?? '').trim().slice(0, 5000),
      innovation: String(body.innovation ?? '').trim().slice(0, 5000),
      approach: String(body.approach ?? '').trim().slice(0, 5000),
      facts: Array.isArray(body.facts)
        ? body.facts
            .map((item) => String(item).trim())
            .filter(Boolean)
            .slice(0, 12)
        : [],
      updatedAt: new Date().toISOString()
    };

    if (!about.name || !about.intro) {
      return json(res, 400, {
        error: 'Name and introduction are required.'
      });
    }

    await writeAbout(about);

    return json(res, 200, about);
  } catch (error) {
    return json(res, 400, {
      error: 'Invalid About data.'
    });
  }
}

        // Serve the Vite production frontend
    if (req.method === 'GET') {
      const requestedPath = decodeURIComponent(url.pathname);

      // Never let frontend serving intercept API routes
      if (!requestedPath.startsWith('/api/')) {
        const cleanPath = requestedPath === '/' ? '/index.html' : requestedPath;

        let filePath = path.join(DIST_DIR, cleanPath);

        // Prevent path traversal
        if (!filePath.startsWith(DIST_DIR)) {
          return json(res, 400, { error: 'Invalid path' });
        }

        try {
          const stat = await fs.stat(filePath);

          if (stat.isFile()) {
            const ext = path.extname(filePath).toLowerCase();

            const mimeByExt = {
              '.html': 'text/html; charset=utf-8',
              '.js': 'application/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8',
              '.json': 'application/json; charset=utf-8',
              '.svg': 'image/svg+xml',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.webp': 'image/webp',
              '.gif': 'image/gif',
              '.ico': 'image/x-icon',
              '.woff': 'font/woff',
              '.woff2': 'font/woff2',
              '.ttf': 'font/ttf'
            };

            const mime = mimeByExt[ext] || 'application/octet-stream';

            res.writeHead(200, {
              'Content-Type': mime,
              'Content-Length': stat.size,
              'Cache-Control': ext === '.html'
                ? 'no-cache'
                : 'public, max-age=31536000, immutable'
            });

            return fsSync.createReadStream(filePath).pipe(res);
          }
        } catch {
          // File does not exist — continue to SPA fallback.
        }

        // React Router fallback:
        // /projects, /certificates, /resume, etc.
        // all receive index.html so the client-side router can handle them.
        try {
          const indexPath = path.join(DIST_DIR, 'index.html');
          const stat = await fs.stat(indexPath);

          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': stat.size,
            'Cache-Control': 'no-cache'
          });

          return fsSync.createReadStream(indexPath).pipe(res);
        } catch {
          return json(res, 503, {
            error: 'Frontend build is not available.'
          });
        }
      }
    }

    json(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error(error);
    json(res, 500, { error: error.message || 'Server error' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio server running on port ${PORT}`);
});