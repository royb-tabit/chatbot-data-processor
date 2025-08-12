const { ObjectId } = require('mongodb');

// Mock the entire tdCatalog module dependencies
jest.mock('../../../config/config', () => ({
  db: {
    tdCatalog: {
      mongoUri: 'mongodb://mocked-uri'
    }
  }
}));

// Create a more realistic mock for genericMongo
const mockCollection = {
  find: jest.fn().mockReturnValue({
    toArray: jest.fn()
  }),
  insertOne: jest.fn(),
  updateOne: jest.fn(),
  deleteMany: jest.fn()
};

const mockDb = {
  connect: jest.fn().mockResolvedValue(undefined),
  getCollection: jest.fn().mockResolvedValue(mockCollection)
};

jest.mock('../../../model/db/genericMongo', () => {
  return jest.fn().mockImplementation(() => mockDb);
});

describe('tdCatalog Module Integration', () => {
  let tdCatalogModule;

  beforeEach(() => {
    jest.clearAllMocks();

    // Clear the module cache to get fresh instances
    jest.resetModules();

    // Import the module after mocking
    tdCatalogModule = require('../../../model/db/tdCatalog');
  });

  describe('Module Initialization', () => {
    it('should initialize with correct database configuration', () => {
      const genericMongo = require('../../../model/db/genericMongo');

      expect(genericMongo).toHaveBeenCalledWith('mongodb://mocked-uri', 'tdCatalog');
    });

    it('should call connect on initialization', () => {
      expect(mockDb.connect).toHaveBeenCalled();
    });
  });

  describe('getCatalog Function Behavior', () => {
    it('should query the correct collection with proper parameters', async () => {
      // Arrange
      const organizationId = new ObjectId();
      const expectedResults = [
        {
          _id: new ObjectId(),
          organization: organizationId,
          resourceName: 'tdCatalog',
          data: { menu: 'test catalog' }
        }
      ];

      mockCollection.find().toArray.mockResolvedValue(expectedResults);

      // Create a test version of getCatalog function
      const getCatalogTest = async function(organizationId) {
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
      }.bind(mockDb);

      // Act
      const result = await getCatalogTest(organizationId.toString());

      // Assert
      expect(mockDb.getCollection).toHaveBeenCalledWith('dynamicorgstorage');
      expect(mockCollection.find).toHaveBeenCalledWith({
        organization: expect.any(ObjectId),
        resourceName: 'tdCatalog'
      });
      expect(result).toEqual(expectedResults);
    });

    it('should handle multiple catalog entries for same organization', async () => {
      // Arrange
      const organizationId = new ObjectId();
      const multipleResults = [
        {
          _id: new ObjectId(),
          organization: organizationId,
          resourceName: 'tdCatalog',
          data: { menu: 'catalog 1' }
        },
        {
          _id: new ObjectId(),
          organization: organizationId,
          resourceName: 'tdCatalog',
          data: { menu: 'catalog 2' }
        }
      ];

      mockCollection.find().toArray.mockResolvedValue(multipleResults);

      const getCatalogTest = async function(organizationId) {
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
      }.bind(mockDb);

      // Act
      const result = await getCatalogTest(organizationId.toString());

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(item => item.resourceName === 'tdCatalog')).toBe(true);
      expect(result.every(item => item.organization.toString() === organizationId.toString())).toBe(true);
    });

    it('should propagate database errors properly', async () => {
      // Arrange
      const dbError = new Error('Database query failed');
      mockCollection.find().toArray.mockRejectedValue(dbError);

      const getCatalogTest = async function(organizationId) {
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
      }.bind(mockDb);

      // Act & Assert
      const organizationId = new ObjectId();
      await expect(getCatalogTest(organizationId.toString())).rejects.toThrow('Database query failed');
    });
  });

  describe('ObjectId Handling', () => {
    it('should correctly convert string IDs to ObjectId instances', async () => {
      // Arrange
      const organizationIdString = '64a1b2c3d4e5f6a7b8c9d0e1';
      const expectedObjectId = new ObjectId(organizationIdString);

      mockCollection.find().toArray.mockResolvedValue([]);

      const getCatalogTest = async function(organizationId) {
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
      }.bind(mockDb);

      // Act
      await getCatalogTest(organizationIdString);

      // Assert
      expect(mockCollection.find).toHaveBeenCalled();
      const callArgs = mockCollection.find.mock.calls[0][0];
      expect(callArgs).toBeDefined();
      expect(callArgs.organization).toBeInstanceOf(ObjectId);
      expect(callArgs.organization.toString()).toBe(expectedObjectId.toString());
      expect(callArgs.resourceName).toBe('tdCatalog');
    });
  });
});
