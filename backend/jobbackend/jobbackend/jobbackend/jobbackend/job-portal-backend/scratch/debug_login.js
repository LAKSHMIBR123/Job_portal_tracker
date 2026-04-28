const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../src/models/user.model');

dotenv.config();

async function testLogin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'test@example.com'; // Change this to the email you are trying to use
        const password = 'password123';   // Change this to the password you are trying to use

        const normalizedEmail = email.trim().toLowerCase();
        console.log(`Searching for user: ${normalizedEmail}`);

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            console.log('User not found in database.');
            const allUsers = await User.find({}, 'email');
            console.log('All registered emails in local DB:');
            allUsers.forEach(u => console.log(` - ${u.email}`));
        } else {
            console.log('User found. Comparing passwords...');
            const isMatch = await bcrypt.compare(password, user.password);
            console.log(`Password match: ${isMatch}`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testLogin();
