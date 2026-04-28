const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jobportal';

async function checkJobs() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        
        const Job = mongoose.model('Job', new mongoose.Schema({}, { strict: false }));
        const jobs = await Job.find({});
        
        console.log(`Found ${jobs.length} jobs`);
        if (jobs.length > 0) {
            console.log('First job snippet:', JSON.stringify(jobs[0], null, 2));
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkJobs();
