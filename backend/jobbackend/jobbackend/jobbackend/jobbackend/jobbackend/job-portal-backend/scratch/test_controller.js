const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Register models
require('../src/models/user.model');
const Job = require('../src/models/job.model');
const { getJobs } = require('../src/controllers/job.controller');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jobportal';

async function testController() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        
        const req = { query: {} };
        const res = {
            status: function(s) { this.statusCode = s; return this; },
            json: function(data) {
                console.log('Response status:', this.statusCode || 200);
                console.log('Number of jobs in response:', data.data.jobs.length);
                if (data.data.jobs.length > 0) {
                    console.log('First job:', JSON.stringify(data.data.jobs[0], null, 2));
                }
            }
        };
        
        await getJobs(req, res, (err) => {
            if (err) console.error('Error in controller:', err);
        });
        
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

testController();
