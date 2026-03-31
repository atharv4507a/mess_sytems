const mongoose = require('mongoose');
const Member = require('./src/models/member.model');

const seedMember = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/messDataBase');
        console.log('MongoDB Connected for Seeding');

        // Check if test member exists
        const total = await Member.countDocuments();
        if (total === 0) {
            await Member.create({
                name: "Test Member",
                mobile: "9876543210",
                address: "Sample Address, Pune",
                joiningDate: new Date().toISOString().split('T')[0],
                status: "active",
                messType: "monthly",
                foodType: "veg",
                monthlyCharge: 3000
            });
            console.log('✅ Test Member added to Database!');
        } else {
            console.log('DB already has members. No seeding needed.');
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedMember();
