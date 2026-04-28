const mongoose = require('mongoose');
require('dotenv').config();

async function checkIndex() {
  await mongoose.connect(process.env.MONGO_URI);
  const Application = require('../src/models/application.model');
  
  try {
    const indexes = await Application.collection.indexes();
    console.log('Current Indexes:', JSON.stringify(indexes, null, 2));
    
    const hasUniqueIndex = indexes.some(idx => idx.name === 'user_1_job_1');
    if (hasUniqueIndex) {
      console.log('Dropping unique index user_1_job_1...');
      await Application.collection.dropIndex('user_1_job_1');
      console.log('Index dropped successfully.');
    }
    const userId = new mongoose.Types.ObjectId();
    const jobId = new mongoose.Types.ObjectId();
    
    console.log('Creating first application...');
    await Application.create({ user: userId, job: jobId });
    
    console.log('Creating second application...');
    await Application.create({ user: userId, job: jobId });
    
    console.log('SUCCESS: Multiple applications allowed!');
  } catch (err) {
    console.error('FAILED:', err.message);
    if (err.code === 11000) {
      console.log('Unique index still exists in MongoDB. You may need to drop it manually.');
    }
  } finally {
    await mongoose.connection.close();
  }
}

checkIndex();
