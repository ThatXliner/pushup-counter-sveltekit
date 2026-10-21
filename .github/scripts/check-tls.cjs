const https = require('node:https');
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const targets = [
  ['https://dv-g3b-emudhra.we-have-a-problem.com/', false],
  ['https://dv-g3b-aaa-emudhra.we-have-a-problem.com/', false],
  ['https://example.com/', true]
];
const certificateErrors = new Set([
  'CERT_REVOKED', 'CERT_UNTRUSTED', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'SELF_SIGNED_CERT_IN_CHAIN'
]);

async function request(client, url) {
  if (client === 'fetch') {
    const response = await fetch(url, { signal: AbortSignal.timeout(12000), redirect: 'error' });
    await response.arrayBuffer();
    return response.status;
  }
  return new Promise((resolve, reject) => {
    const req = https.get(url, { family: 4, agent: false }, response => {
      response.resume();
      resolve(response.statusCode);
    });
    const timer = setTimeout(() => req.destroy(Object.assign(new Error('Request timed out'), { code: 'ETIMEDOUT' })), 12000);
    req.on('error', reject);
    req.on('close', () => clearTimeout(timer));
  });
}

async function check(client, url, trusted) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const status = await request(client, url);
      const passed = trusted && status === 200;
      console.log(JSON.stringify({ runtime: process.version, client, url, attempt, status, passed }));
      return passed;
    } catch (error) {
      const code = error.cause?.code || error.code || error.name;
      const certificateRejected = certificateErrors.has(code);
      const passed = !trusted && certificateRejected;
      console.log(JSON.stringify({ runtime: process.version, client, url, attempt, code, certificateRejected, inconclusive: !certificateRejected, passed }));
      if (certificateRejected || attempt === 3) return passed;
    }
  }
}

Promise.all(['https', 'fetch'].flatMap(client => targets.map(([url, trusted]) => check(client, url, trusted))))
  .then(results => { process.exitCode = results.every(Boolean) ? 0 : 1; })
  .catch(error => { console.error(error); process.exitCode = 1; });
