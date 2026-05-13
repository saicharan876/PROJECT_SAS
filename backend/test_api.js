const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let taskId = '';
const testEmail = `testuser_${Date.now()}@example.com`;

async function runTests() {
  console.log('--- STARTING API TESTS ---');

  // 1. Health Check
  try {
    const res = await axios.get(`${API_URL}/health`);
    console.log('✅ Health Check:', res.data);
  } catch (err) {
    console.error('❌ Health Check Failed:', err.message);
  }

  // 2. Signup
  try {
    const res = await axios.post(`${API_URL}/auth/signup`, {
      name: 'Test User',
      email: testEmail,
      password: 'password123'
    });
    console.log('✅ Signup:', res.data.message);
    authToken = res.data.token;
  } catch (err) {
    console.error('❌ Signup Failed:', err.response?.data || err.message);
  }

  // 3. Login
  try {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: testEmail,
      password: 'password123'
    });
    console.log('✅ Login:', res.data.message);
    authToken = res.data.token; // Update token just in case
  } catch (err) {
    console.error('❌ Login Failed:', err.response?.data || err.message);
  }

  const authHeaders = { headers: { Authorization: `Bearer ${authToken}` } };

  // 4. Get Profile
  try {
    const res = await axios.get(`${API_URL}/auth/profile`, authHeaders);
    console.log('✅ Get Profile:', res.data.user.email);
  } catch (err) {
    console.error('❌ Get Profile Failed:', err.response?.data || err.message);
  }

  // 5. Create Task
  try {
    const res = await axios.post(`${API_URL}/tasks`, {
      title: 'Complete Step 2',
      description: 'Design MongoDB schemas',
      priority: 3,
      category: 'personal'
    }, authHeaders);
    console.log('✅ Create Task:', res.data.data.title);
    taskId = res.data.data._id;
  } catch (err) {
    console.error('❌ Create Task Failed:', err.response?.data || err.message);
  }

  // 6. Get Tasks
  try {
    const res = await axios.get(`${API_URL}/tasks`, authHeaders);
    console.log('✅ Get Tasks: Found', res.data.count, 'tasks');
  } catch (err) {
    console.error('❌ Get Tasks Failed:', err.response?.data || err.message);
  }

  // 7. Update Task
  if (taskId) {
    try {
      const res = await axios.put(`${API_URL}/tasks/${taskId}`, {
        completed: true
      }, authHeaders);
      console.log('✅ Update Task: Completed status is', res.data.data.completed);
    } catch (err) {
      console.error('❌ Update Task Failed:', err.response?.data || err.message);
    }
  }

  // 8. Delete Task
  if (taskId) {
    try {
      const res = await axios.delete(`${API_URL}/tasks/${taskId}`, authHeaders);
      console.log('✅ Delete Task:', res.data.message);
    } catch (err) {
      console.error('❌ Delete Task Failed:', err.response?.data || err.message);
    }
  }

  // 9. Test Stubbed Endpoint (CV Generate)
  try {
    const res = await axios.post(`${API_URL}/cv/generate`, {}, authHeaders);
  } catch (err) {
    if (err.response?.status === 501) {
      console.log('✅ CV Generate Stub: Responded with 501 Not Implemented (Expected)');
    } else {
      console.error('❌ CV Generate Stub Failed with unexpected error:', err.response?.data || err.message);
    }
  }

  console.log('--- API TESTS COMPLETE ---');
}

runTests();
