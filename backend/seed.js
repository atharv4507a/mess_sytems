require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/user.model');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log('✅ MongoDB Connected for Seeding');

        // Check if admin already exists
        const existing = await User.findOne({ email: 'admin@mess.com' });
        if (existing) {
            console.log('⚠️  Admin user already exists. Skipping seed.');
            process.exit();
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);

        await User.create({
            name: 'Admin',
            email: 'admin@mess.com',
            password: hashedPassword,
        });

        console.log('✅ Admin user created successfully!');
        console.log('   Email   : admin@mess.com');
        console.log('   Password: admin123');
        process.exit();
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
        process.exit(1);
    }
};

seedAdmin();
