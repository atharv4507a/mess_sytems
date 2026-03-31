const mongoose = require('mongoose');

async function fixFourBills() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/messDataBase');
        console.log('Connected!');

        const db = mongoose.connection.db;
        const bills = await db.collection('bills').find().toArray();
        console.log(`Checking ${bills.length} bills...`);

        for (const b of bills) {
            const total = Number(b.totalAmount || 3000); // Default to 3000 if missing
            const paid = Number(b.paidAmount || 0);
            const pending = Math.max(0, total - paid);
            
            await db.collection('bills').updateOne(
                { _id: b._id },
                { 
                    $set: { 
                        totalAmount: total, 
                        paidAmount: paid, 
                        pendingAmount: pending,
                        status: pending <= 0 ? 'Paid' : (paid > 0 ? 'Pending' : 'Pending')
                    } 
                }
            );
            console.log(`Repaired Bill ID: ${b._id} - Pending: ${pending}`);
        }

        console.log('Final database repair complete.');
        process.exit(0);
    } catch (error) {
        console.error('Repair failed:', error);
        process.exit(1);
    }
}

fixFourBills();
