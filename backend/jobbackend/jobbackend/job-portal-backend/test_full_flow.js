require('dotenv').config();
const mongoose = require('mongoose');
const sendEmailNotification = require('./src/utils/sendEmailNotification');

async function testFullFlow() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Find any user to test with
  const User = require('./src/models/user.model');
  const user = await User.findOne({ name: /sanju/i });

  if (!user) {
    console.error('No user "sanju" found to test with.');
    process.exit(1);
  }

  console.log(`Testing professional email for user: ${user.email}`);

  const result = await sendEmailNotification(
    user._id,
    "Professional Test Email",
    "Testing the new premium template.",
    {
      details: [
        { label: "Job Title", value: "Senior Architect" },
        { label: "Company", value: "Professional Services Inc." },
        { label: "Location", value: "New York, NY" }
      ]
    }
  );

  console.log('Result:', result);
  process.exit(0);
}

testFullFlow();
