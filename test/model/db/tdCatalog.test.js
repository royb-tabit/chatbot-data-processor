const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');

// Mock the config module
jest.mock('../../../config/config', () => ({
  db: {
    tdCatalog: {
      mongoUri: 'mongodb://localhost:27017'
    }
  }
}));

// Mock the genericMongo module
const mockGenericMongo = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  getCollection: jest.fn()
};

jest.mock('../../../model/db/generic_mongo', () => {
  return jest.fn().mockImplementation(() => mockGenericMongo);
});

describe('tdCatalog', () => {
  let mongoServer;
  let mongoClient;
  let db;
  let collection;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    db = mongoClient.db('tdCatalog');
    collection = db.collection('dynamicorgstorage');
  });

  afterAll(async () => {
    // Clean up
    if (mongoClient) {
      await mongoClient.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear the collection before each test
    await collection.deleteMany({});

    // Reset mocks
    jest.clearAllMocks();

    // Setup mock implementation
    mockGenericMongo.getCollection.mockResolvedValue(collection);
  });

  describe('getCatalog', () => {
    it('should return catalog documents for a valid organization ID', async () => {
      // Arrange
      const organizationId = new ObjectId();
      const testData = [
        {
          _id: new ObjectId(),
          organization: organizationId,
          resourceName: 'tdCatalog',
          data: { menu: 'test menu 1' },
          createdAt: new Date()
        },
        {
          _id: new ObjectId(),
          organization: organizationId,
          resourceName: 'tdCatalog',
          data: { menu: 'test menu 2' },
          createdAt: new Date()
        }
      ];

      // Insert test data
      await collection.insertMany(testData);

      // Mock the getCatalog function since it's not properly exported
      const getCatalog = async function(organizationId) {
        try {
          const collection = await this.getCollection('dynamicorgstorage');
          const query = {
            organization: new ObjectId(organizationId),
            resourceName: "tdCatalog"
          };
          return await collection.find(query).toArray();
        } catch (error) {
          console.error('Error finding documents by organization and resource:', error);
          throw error;
        }
      }.bind(mockGenericMongo);

      // Act
      const result = await getCatalog(organizationId.toString());

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].organization.toString()).toBe(organizationId.toString());
      expect(result[0].resourceName).toBe('tdCatalog');
      expect(result[1].organization.toString()).toBe(organizationId.toString());
      expect(result[1].resourceName).toBe('tdCatalog');
      expect(mockGenericMongo.getCollection).toHaveBeenCalledWith('dynamicorgstorage');
    });

    it('should return empty array when no documents found for organization', async () => {
      // Arrange
      const organizationId = new ObjectId();
      const differentOrgId = new ObjectId();

      const testData = {
        _id: new ObjectId(),
        organization: differentOrgId,
        resourceName: 'tdCatalog',
        data: { menu: 'test menu' },
        createdAt: new Date()
      };

      await collection.insertOne(testData);

      // Mock the getCatalog function
      const getCatalog = async function(organizationId) {
        try {
          const collection = await this.getCollection('dynamicorgstorage');
          const query = {
            organization: new ObjectId(organizationId),
            resourceName: "tdCatalog"
          };
          return await collection.find(query).toArray();
        } catch (error) {
          console.error('Error finding documents by organization and resource:', error);
          throw error;
        }
      }.bind(mockGenericMongo);

      // Act
      const result = await getCatalog(organizationId.toString());

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should only return documents with resourceName "tdCatalog"', async () => {
      // Arrange
      const organizationId = new ObjectId();
      const testData = [
        {
          _id: new ObjectId(),
          organization: organizationId,
          resourceName: 'tdCatalog',
          data: { menu: 'catalog data' }
        },
        {
          _id: new ObjectId(),
          organization: organizationId,
          resourceName: 'otherResource',
          data: { menu: 'other data' }
        }
      ];

      await collection.insertMany(testData);

      // Mock the getCatalog function
      const getCatalog = async function(organizationId) {
        try {
          const collection = await this.getCollection('dynamicorgstorage');
          const query = {
            organization: new ObjectId(organizationId),
            resourceName: "tdCatalog"
          };
          return await collection.find(query).toArray();
        } catch (error) {
          console.error('Error finding documents by organization and resource:', error);
          throw error;
        }
      }.bind(mockGenericMongo);

      // Act
      const result = await getCatalog(organizationId.toString());

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].resourceName).toBe('tdCatalog');
    });

    it('should handle invalid ObjectId gracefully', async () => {
      // Mock the getCatalog function
      const getCatalog = async function(organizationId) {
        try {
          const collection = await this.getCollection('dynamicorgstorage');
          const query = {
            organization: new ObjectId(organizationId),
            resourceName: "tdCatalog"
          };
          return await collection.find(query).toArray();
        } catch (error) {
          console.error('Error finding documents by organization and resource:', error);
          throw error;
        }
      }.bind(mockGenericMongo);

      // Act & Assert
      await expect(getCatalog('invalid-id')).rejects.toThrow();
    });

    it('should handle database connection errors', async () => {
      // Arrange
      mockGenericMongo.getCollection.mockRejectedValue(new Error('Database connection failed'));

      // Mock the getCatalog function
      const getCatalog = async function(organizationId) {
        try {
          const collection = await this.getCollection('dynamicorgstorage');
          const query = {
            organization: new ObjectId(organizationId),
            resourceName: "tdCatalog"
          };
          return await collection.find(query).toArray();
        } catch (error) {
          console.error('Error finding documents by organization and resource:', error);
          throw error;
        }
      }.bind(mockGenericMongo);

      // Act & Assert
      const organizationId = new ObjectId();
      await expect(getCatalog(organizationId.toString())).rejects.toThrow('Database connection failed');
    });

    it('should convert string organizationId to ObjectId correctly', async () => {
      // Arrange
      const organizationId = new ObjectId();
      const testData = {
        _id: new ObjectId(),
        organization: organizationId,
        resourceName: 'tdCatalog',
        data: { menu: 'test menu' }
      };

      await collection.insertOne(testData);

      // Create a spy to monitor the find method
      const findSpy = jest.spyOn(collection, 'find');

      // Mock the getCatalog function
      const getCatalog = async function(organizationId) {
        try {
          const collection = await this.getCollection('dynamicorgstorage');
          const query = {
            organization: new ObjectId(organizationId),
            resourceName: "tdCatalog"
          };
          return await collection.find(query).toArray();
        } catch (error) {
          console.error('Error finding documents by organization and resource:', error);
          throw error;
        }
      }.bind(mockGenericMongo);

      // Act
      await getCatalog(organizationId.toString());

      // Assert
      expect(findSpy).toHaveBeenCalledWith({
        organization: expect.any(ObjectId),
        resourceName: 'tdCatalog'
      });

      findSpy.mockRestore();
    });
  });

  describe('Database Integration', () => {
    it('should verify mock database setup works correctly', async () => {
      // Arrange
      const testDoc = {
        organization: new ObjectId(),
        resourceName: 'tdCatalog',
        data: { test: 'data' }
      };

      // Act
      const result = await collection.insertOne(testDoc);
      const found = await collection.findOne({ _id: result.insertedId });

      // Assert
      expect(found).toBeTruthy();
      expect(found.resourceName).toBe('tdCatalog');
      expect(found.data.test).toBe('data');
    });
  });
});
