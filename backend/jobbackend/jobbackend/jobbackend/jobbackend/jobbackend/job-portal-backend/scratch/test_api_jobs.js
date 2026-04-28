const axios = require('axios');

async function testFetchJobs() {
  try {
    const res = await axios.get('http://localhost:5000/api/jobs');
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error('Error fetching jobs:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testFetchJobs();
