require('dotenv').config();
const { generateJSON } = require('./services/llm_service');

async function test() {
  try {
    const res = await generateJSON('Respond with valid JSON with a single key "status" set to "success"', 'Hello');
    console.log('SUCCESS:', res);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}
test();
