require('dotenv').config();
const http = require('http');

const PORT = process.env.PORT || 17777;
const BASE_URL = 'http://localhost:' + PORT;

console.log(`🚀 Starting Comprehensive Smoke Test on ${BASE_URL}...`);

async function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, body: json });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (err) => reject(err));

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    let failure = false;

    // 1. Health Check
    try {
        const res = await request('GET', '/health');
        if (res.status === 200) console.log('✅ GET /api/health -> 200 OK');
        else {
            console.error(`❌ GET /api/health -> ${res.status}`);
            failure = true;
        }
    } catch (e) {
        console.error(`❌ GET /api/health FAILED: ${e.message}`);
        failure = true;
    }

    // 2. Protected Route (Auth Check)
    try {
        const res = await request('GET', '/transactions'); // Requires Auth
        if (res.status === 401 || res.status === 403) console.log(`✅ GET /api/transactions -> ${res.status} (Auth protected)`);
        else {
            console.error(`❌ GET /api/transactions -> ${res.status} (Expected 401/403)`);
            failure = true;
        }
    } catch (e) {
        console.error(`❌ Auth check failed: ${e.message}`);
        failure = true;
    }

    // 3. Booking Route (POST) - Dry Run
    // We expect 401 (Auth) or 400 (Bad Request), but NOT 500 (Server Error)
    try {
        const res = await request('POST', '/booking/create', { itinerary: {} });
        if (res.status === 500) {
            console.error('❌ POST /api/booking/create -> 500 SERVER ERROR (Crash likely)');
            failure = true;
        } else if (res.status === 401 || res.status === 403) {
            console.log(`✅ POST /api/booking/create -> ${res.status} (Route exists and is protected)`);
        } else if (res.status === 400) {
            console.log('✅ POST /api/booking/create -> 400 (Validation working)');
        } else {
            // 200 ok?
            console.log(`✅ POST /api/booking/create -> ${res.status}`);
        }
    } catch (e) {
        console.error(`❌ Booking route check failed: ${e.message}`);
    }

    // 4. Wallet Route (GET History) - Dry Run
    try {
        const res = await request('GET', '/transactions/history');
        if (res.status === 500) {
            console.error('❌ GET /api/transactions/history -> 500 SERVER ERROR');
            failure = true;
        } else {
            console.log(`✅ GET /api/transactions/history -> ${res.status} (No 500)`);
        }
    } catch (e) {
        console.error(`❌ Wallet route check failed: ${e.message}`);
    }

    // 5. Bagages Route
    try {
        const res = await request('GET', '/bagages/123/timeline');
        // Bagage doesn't exist? 404. Auth? 401. 500? BAD.
        if (res.status === 500) {
            console.error('❌ GET /api/bagages/:id/timeline -> 500 SERVER ERROR');
            failure = true;
        } else {
            console.log(`✅ GET /api/bagages/:id/timeline -> ${res.status} (No 500)`);
        }
    } catch (e) {
        console.error(`❌ Bagage route check failed: ${e.message}`);
    }

    if (failure) {
        console.error('\n💥 SOME TESTS FAILED. CHECK LOGS ABOVE.');
        process.exit(1);
    } else {
        console.log('\n✨ ALL SMOKE TESTS PASSED. SYSTEM STABLE.');
        process.exit(0);
    }
}

runTests();
