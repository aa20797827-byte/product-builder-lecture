/**
 * PawPick AI – 로컬 개발 서버 (CommonJS)
 * Node.js 내장 모듈만 사용 (npm install 불필요)
 * .env.local 파일에서 GEMINI_API_KEY를 읽어옵니다.
 */
const http = require('node:http');
const fs   = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3000;

/* ── .env.local 자동 로드 ── */
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
    if (match) {
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[match[1]] = val;
    }
  }
  console.log('✅ .env.local 로드 완료');
} catch {
  console.log('⚠️  .env.local 파일이 없습니다. GEMINI_API_KEY를 직접 설정하거나 .env.local 파일을 생성하세요.');
}

/* ── MIME 타입 ── */
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
};

/* ── Vercel 핸들러 호환 res 래퍼 ── */
function createRes(nodeRes) {
  let _status = 200;
  const res = {
    status(code)    { _status = code; return res; },
    setHeader(k, v) { nodeRes.setHeader(k, v); return res; },
    json(data) {
      nodeRes.writeHead(_status, { 'Content-Type': 'application/json' });
      nodeRes.end(JSON.stringify(data));
    },
    end() {
      nodeRes.writeHead(_status);
      nodeRes.end();
    },
  };
  return res;
}

/* ── HTTP 서버 ── */
const server = http.createServer(async (req, nodeRes) => {
  const urlObj = new URL(req.url, `http://localhost:${PORT}`);

  /* POST /api/analyze → Gemini AI 핸들러 */
  if (urlObj.pathname === '/api/analyze' && req.method === 'POST') {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    await new Promise(resolve => req.on('end', resolve));

    try { req.body = JSON.parse(raw || '{}'); }
    catch { req.body = {}; }

    try {
      delete require.cache[require.resolve('./api/analyze.js')];
      const handler = require('./api/analyze.js');
      await handler(req, createRes(nodeRes));
    } catch (err) {
      console.error('API 핸들러 오류:', err);
      nodeRes.writeHead(500, { 'Content-Type': 'application/json' });
      nodeRes.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  /* OPTIONS preflight */
  if (req.method === 'OPTIONS') {
    nodeRes.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    nodeRes.end();
    return;
  }

  /* 정적 파일 서빙 */
  const relative = urlObj.pathname === '/' ? 'index.html' : urlObj.pathname.slice(1);
  const filePath = path.join(__dirname, relative);
  const ext      = path.extname(filePath);

  try {
    const content = fs.readFileSync(filePath);
    nodeRes.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    nodeRes.end(content);
  } catch {
    const index = fs.readFileSync(path.join(__dirname, 'index.html'));
    nodeRes.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    nodeRes.end(index);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🐾 PawPick AI 개발 서버: http://localhost:${PORT}\n`);
});
