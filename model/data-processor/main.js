const tdCatalog = require('../model/db/tdCatalog');

async function getTdCatalogFromDB(organisationId) {
    return tdCatalog.getCatalog(organisationId);
}

async function createMenu(tdCatalog) {
    return undefined
}

function saveMenuDb(processedMenu) {

}

async function processTDCatalog(organisationId) {
    const tdCatalog = await getTdCatalogFromDB(organisationId)
    const processedMenu = await createMenu(tdCatalog);
    saveMenuDb(processedMenu);
}

module.exports = {
    processTDCatalog
};