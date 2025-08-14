const DatabaseInterface = require('./genericMongo').DatabaseInterface;
const config = require('../../config/config');
const { ObjectId } = require('mongodb');

const mongoUri = config.db.tdCatalog.mongoUri;
const dbName = config.db.tdCatalog.dbName;

const db = new DatabaseInterface(mongoUri, dbName);

async function getCatalog(organizationId) {
    try {
        const collection = await db.getCollection('dynamicorgstorage');
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


module.exports = {
    getCatalog
};
