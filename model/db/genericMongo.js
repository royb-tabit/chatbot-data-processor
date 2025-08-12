const { MongoClient, ObjectId } = require('mongodb');
const config = require('../../config/config');

class DatabaseInterface {
  constructor(mongoUri, dbName) {
    this.client = null;
    this.db = null;
    this.connectionString = mongoUri;
    this.databaseName = dbName;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      if (!this.client) {
        this.client = new MongoClient(this.connectionString, {
          useUnifiedTopology: true,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });

        await this.client.connect();
        this.db = this.client.db(this.databaseName);
        console.log('Connected to MongoDB successfully');
      }
      return this.db;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        console.log('Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Get database instance
   */
  async getDatabase() {
    if (!this.db) {
      await this.connect();
    }
    return this.db;
  }

  /**
   * Get collection by name
   */
  async getCollection(collectionName) {
    const db = await this.getDatabase();
    return db.collection(collectionName);
  }
}

// Export both the class and instance
module.exports = {
  DatabaseInterface
};
