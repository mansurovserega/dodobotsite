const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { saveState, hasState } = require('./db');

const staticBase = path.join(__dirname, 'public');

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  const types = { '.html': 'text/html', '.css': 'text/css' };
  const type = types[ext] || 'text/plain';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 500;
      return res.end('Server error');
    }
    res.setHeader('Content-Type', type);
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (pathname === '/') {
    return sendFile(res, path.join(staticBase, 'index.html'));
  }

  if (pathname === '/home') {
    return sendFile(res, path.join(staticBase, 'home.html'));
  }

  if (pathname === '/login') {
    const country = parsed.query.country === 'ae' ? 'ae' : 'ru';
    const domain = country === 'ae' ? 'dodois.com' : 'dodois.io';
    const state = crypto.randomBytes(16).toString('hex');
    saveState(state);
    const authLink = `https://auth.${domain}/connect/authorize?client_id=cuD1x&scope=openid%20deliverystatistics%20staffmembers:read%20staffmembersearch%20staffmembers:write%20offline_access%20production%20incentives%20sales%20email%20employee%20phone%20profile%20roles%20ext_profile%20user.role:read%20organizationstructure%20productionefficiency%20orders%20products%20stockitems%20accounting%20stopsales%20staffshifts:read%20unitshifts:read%20unit:read%20shared&response_type=code&redirect_uri=https://dodobot.ru/callback&code_challenge=eXf5tgpyuKEjN1z9uies_APBJaMV-VdgmRbP2m5L_rs&code_challenge_method=S256&state=${state}`;
    res.statusCode = 302;
    res.setHeader('Location', authLink);
    return res.end();
  }

  if (pathname === '/callback') {
    const { code, state } = parsed.query;
    if (!code || !state || !hasState(state)) {
      res.statusCode = 400;
      return res.end('Invalid request');
    }
    try {
      const botServer = require('/opt/bot/server');
      if (botServer && typeof botServer.callback === 'function') {
        botServer.callback({ code, state });
      }
    } catch (err) {
      console.error('Bot callback failed:', err.message);
    }
    return res.end('Authorization code received');
  }

  // static files
  const filePath = path.join(staticBase, pathname.replace(/^\//, ''));
  if (filePath.startsWith(staticBase) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return sendFile(res, filePath);
  }

  res.statusCode = 404;
  res.end('Not found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
