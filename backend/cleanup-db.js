import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const cleanupDatabase = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Drop the users collection to remove old indexes
    console.log('🗑️  Dropping users collection...');
    try {
      await db.collection('users').drop();
      console.log('✅ Users collection dropped');
    } catch (error) {
      if (error.code === 26) {
        console.log('ℹ️  Users collection does not exist (this is fine)');
      } else {
        throw error;
      }
    }

    console.log('✅ Database cleanup complete!');
    console.log('');
    console.log('You can now start the server with: npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
};

cleanupDatabase();
