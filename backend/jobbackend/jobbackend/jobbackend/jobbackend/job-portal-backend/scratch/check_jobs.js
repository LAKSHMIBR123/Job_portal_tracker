const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Job = require('../src/models/job.model');

async function checkJobs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const jobs = await Job.find({});
    console.log(`Found ${jobs.length} jobs`);
    if (jobs.length > 0) {
      console.log('Sample job:', JSON.stringify(jobs[0], null, 2));
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error checking jobs:', error);
  }
}

checkJobs();
