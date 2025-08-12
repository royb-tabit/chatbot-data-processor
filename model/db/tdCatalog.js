const genericDb = require('./genericMongo')
const config = require('../../config/config');
const mongoUri = config.db.tdCatalog.mongoUri
const { ObjectId } = require("mongodb");

const db = genericDb(mongoUri, 'tdCatalog');

async function getCatalog(organizationId) {
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
}

db.connect()
