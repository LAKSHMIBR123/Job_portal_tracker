import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';
import { getApiBaseUrl } from '../services/api.js';

const runLive = process.env.RUN_INTEGRATION === '1';

/**
 * Hits the real API (default http://localhost:5000/api or VITE_API_BASE_URL).
 * Run: npm run test:integration — backend must be listening.
 */
describe.runIf(runLive)('API integration (live backend)', () => {
  let client;

  beforeAll(async () => {
    const baseURL = getApiBaseUrl();
    client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    });

    try {
      await client.get('/jobs', { timeout: 5000 });
    } catch (err) {
      const refused =
        err.code === 'ECONNREFUSED' ||
        err.cause?.code === 'ECONNREFUSED' ||
        err.errors?.some?.((e) => e.code === 'ECONNREFUSED');
      if (refused) {
        throw new Error(
          `Cannot reach API at ${baseURL}. Start the backend on port 5000 (or set VITE_API_BASE_URL), then run test:integration again.`
        );
      }
      throw err;
    }
  });

  it('GET /jobs reaches the server', async () => {
    const res = await client.get('/jobs');
    expect(res.status).toBeLessThan(500);
    if (res.status === 200) {
      expect(res.data).toBeDefined();
    }
  });

  it('POST /auth/login with bad credentials returns 4xx', async () => {
    const res = await client.post('/auth/login', {
      email: 'integration-test-invalid@example.com',
      password: 'wrong-password',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
