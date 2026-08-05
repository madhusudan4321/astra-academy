import mongoose from 'mongoose';

/**
 * Drop the legacy unconditional unique index on purchases (userId + courseId)
 * so Mongoose can recreate it as a partial unique index (status === 'completed').
 */
async function migrateIndexes(): Promise<void> {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    const collection = db.collection('purchases');
    const indexes = await collection.indexes();

    // Look for the old index: unique on { userId: 1, courseId: 1 } WITHOUT a partialFilterExpression
    const oldIndex = indexes.find(
      (idx) =>
        idx.unique === true &&
        idx.key?.userId === 1 &&
        idx.key?.courseId === 1 &&
        !idx.partialFilterExpression
    );

    if (oldIndex && oldIndex.name) {
      console.log(`🔄 Dropping legacy unique index "${oldIndex.name}" on purchases...`);
      await collection.dropIndex(oldIndex.name);
      console.log('✅ Legacy index dropped. Mongoose will recreate the partial unique index.');
    }
  } catch (err) {
    // Non-fatal — log and move on
    console.warn('⚠️  Index migration warning:', err);
  }
}

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Run index migrations after successful connection
    await migrateIndexes();

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting reconnect...');
    });
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
};
