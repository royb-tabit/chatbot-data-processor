async function getTdCatalogFromDB(organisationId) {
    return undefined;
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