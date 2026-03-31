const mongoose = require('mongoose');

// Bill Model Definition (for script purpose)
const billSchema = new mongoose.Schema({
    totalAmount: Number,
    paidAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    status: String
}, { timestamps: true });

const Bill = mongoose.model('Bill', billSchema);

async function repairBills() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/messDataBase');
        console.log('Connected!');

        const bills = await Bill.find({});
        console.log(`Checking ${bills.length} bills...`);

        let updatedCount = 0;
        for (const bill of bills) {
            let changed = false;

            if (bill.paidAmount === undefined) {
                bill.paidAmount = 0;
                changed = true;
            }

            if (bill.pendingAmount === undefined) {
                bill.pendingAmount = Math.max(0, (bill.totalAmount || 0) - (bill.paidAmount || 0));
                changed = true;
            }

            // Ensure status is consistent
            const calculatedStatus = bill.pendingAmount <= 0 ? 'Paid' : (bill.paidAmount > 0 ? 'Pending' : 'Pending');
            if (bill.status !== calculatedStatus) {
               // bill.status = calculatedStatus;
               // changed = true;
            }

            if (changed) {
                await Bill.updateOne({ _id: bill._id }, { 
                    $set: { 
                        paidAmount: bill.paidAmount, 
                        pendingAmount: bill.pendingAmount 
                    } 
                });
                updatedCount++;
            }
        }

        console.log(`Successfully repaired ${updatedCount} bills.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

repairBills();
