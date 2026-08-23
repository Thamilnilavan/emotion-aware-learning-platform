require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const RUNS = Math.max(1, Number(process.env.BENCHMARK_RUNS) || 10);
const BACKEND_URL = process.env.BENCHMARK_BACKEND_URL || 'http://localhost:3001';
const FLASK_URL = process.env.AI_GATEWAY_URL || 'http://localhost:5000';
const DATASET_DIR = path.join(__dirname, '..', '..', 'ai-service', 'dataset', 'test');

const summary = (times) => ({
  minimum: Number(Math.min(...times).toFixed(2)),
  average: Number((times.reduce((sum, time) => sum + time, 0) / times.length).toFixed(2)),
  maximum: Number(Math.max(...times).toFixed(2)),
});

async function timedRequest(request) {
  const start = performance.now();
  await request();
  return performance.now() - start;
}

async function measure(name, request) {
  await request(); // warm-up is deliberately excluded
  const times = [];
  for (let index = 0; index < RUNS; index += 1) {
    times.push(await timedRequest(request));
  }
  return { name, runs: RUNS, ...summary(times) };
}

function imageCandidates(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { recursive: true })
    .filter((entry) => /\.(jpe?g|png)$/i.test(entry))
    .map((entry) => path.join(directory, entry));
}

async function findUsableImage() {
  const candidates = imageCandidates(DATASET_DIR).slice(0, 250);
  for (const candidate of candidates) {
    const extension = path.extname(candidate).toLowerCase() === '.png' ? 'png' : 'jpeg';
    const image = `data:image/${extension};base64,${fs.readFileSync(candidate).toString('base64')}`;
    try {
      const response = await axios.post(`${FLASK_URL}/predict`, { image }, { timeout: 30000 });
      if (response.status === 200 && response.data?.success) return image;
    } catch {
      // RAF-DB aligned crops may occasionally be rejected by face detection.
    }
  }
  throw new Error('No RAF-DB image produced a successful Flask prediction');
}

async function main() {
  const image = await findUsableImage();
  let token = process.env.BENCHMARK_TOKEN;
  if (!token) {
    if (!process.env.JWT_SECRET) throw new Error('Set BENCHMARK_TOKEN or configure JWT_SECRET');
    // A valid-shaped, non-persistent student identity is sufficient for these
    // read-only/session-less benchmark routes and avoids changing user data.
    token = jwt.sign(
      { id: '000000000000000000000001', email: 'benchmark@local.invalid', role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
  }
  const auth = { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 };
  const frames = {
    session_data: [
      { emotion: 'happy', attention: 0.9, interaction: 0.8, fatigue: 0.1 },
      { emotion: 'neutral', attention: 0.8, interaction: 0.7, fatigue: 0.2 },
      { emotion: 'happy', attention: 0.95, interaction: 0.75, fatigue: 0.1 },
    ],
  };

  const results = [];
  results.push(await measure('Flask prediction time', () =>
    axios.post(`${FLASK_URL}/predict`, { image }, { timeout: 30000 })));
  if (process.env.BENCHMARK_FLASK_ONLY === 'true') {
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
    return;
  }
  results.push(await measure('End-to-end frame response', () =>
    axios.post(`${BACKEND_URL}/api/ai/analyze-frame`, { image, timestamp: Date.now() }, auth)));
  results.push(await measure('Engagement-window calculation', () =>
    axios.post(`${BACKEND_URL}/api/ai/calculate-engagement`, frames, auth)));
  results.push(await measure('Dashboard data-loading time', () =>
    axios.get(`${BACKEND_URL}/api/dashboard/student`, auth)));

  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

main()
  .catch((error) => {
    const detail = error.response?.data?.message || error.response?.data?.error || error.message;
    console.error(`Benchmark failed: ${detail}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    // No benchmark request writes user or session data.
  });
