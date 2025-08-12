const fs = require('fs');
const config = require('./config.json');
const restaurant = config.restaurant; // Change this to your restaurant name
const sourceFile = config.source_file
const priceFormatPoint = -2
const publishMenu = require(`./input/${restaurant}/${sourceFile}`);
const outputDir = `./output/${restaurant}/origin`;
let selectionGroupsToWrite = {}
let modificationGroupToWrite = {}

function mapBy_id(list) {
    let result = {}
    for (const element of list) {
        result[element._id] = element
    }
    return result
}

function formatPrice(price) {
    if(!price || price == 0) {
        return 0
    } else {
        let formatPrice = formatToDecimal(price)
        return formatPrice
    }
}

function formatToDecimal(number) {
    if (typeof number !== 'number' || isNaN(number)) {
        throw new Error('Input must be a valid number');
    }

    // Convert the number to a string, then insert a decimal point
    const str = number.toString();
    const len = str.length;

    // Ensure at least 3 digits (adding zeros to the left if necessary)
    const paddedStr = str.padStart(3, '0');

    // Insert the decimal point
    const formatted = `${paddedStr.slice(0, priceFormatPoint)}.${paddedStr.slice(priceFormatPoint)}`;

    return parseFloat(formatted);
}

function getOfferPrice(offerId, menu, prices) {
    let id = "offer" + offerId + "_menu" + menu
    let priceObj = prices[id]
    return priceObj ? formatPrice(priceObj.price) : 0
}

function getModifierPrice(mGroupId, modifierId, menu, prices) {
    let id = "modifierGroup" + mGroupId  + "_modifier" + modifierId + "_menu" + menu
    let priceObj = prices[id]
    return priceObj ? formatPrice(priceObj.price) : 0
}

function getItemFromItemGroupPrice(itemId, itemGroupId, prices) {
    let priceId = "item" + itemId._id + "_itemGroup" + itemGroupId
    let priceObj = prices[priceId]
    return priceObj ? formatPrice(priceObj.price) : null
}


function getSubModifiers(item) {

    return undefined;
}

function getModifiers(modifiers, mGroupId, menu, prices) {
    return modifiers.map(m => {
        let subModifiers = getSubModifiers(m.item)
        let price = getModifierPrice(mGroupId, m._id, menu, prices)
        return {
            _id: m._id,
            name: m.name,
            code: m.code,
            item: m.item,
            price: price
        }
    })

}


// function addToModificationGroupList(_id, formationUnit, modGroupId, min, max, singleSelection, name, modifiers, defaults) {
function addToModificationGroupList(formationUnit, modGroupId, min, max, singleSelection, name, modifiers, defaults) {
    if( !modificationGroupToWrite[modGroupId]) {
        modificationGroupToWrite[modGroupId] = {
            formationUnit: formationUnit,
            min: min,
            max: max,
            singleSelection: singleSelection,
            name: name,
            modifiers: modifiers,
            defaults: defaults
        };
    }
}

function getModifierGroups(modifierGroups, menu, modifiersGroupsList) {
    if (!modifierGroups || modifierGroups.length === 0) return null
    let results = []
    for (let modGroup of modifierGroups) {
        const modGroupId = modGroup.modifierGroup
        let modifierGroupContent = modifiersGroupsList[modGroupId]
        addToModificationGroupList(
            modGroup.formationUnit,
            modGroupId,
            modGroup.min,
            modGroup.max,
            modifierGroupContent.singleSelection,
            modifierGroupContent.name,
            getModifiers(modifierGroupContent.modifiers, modGroupId, menu, prices),
            modGroup.defaults
        )
        results.push({modGroupId: modGroupId, modGroup: modGroup._id})
    }
    return results
}


function getItemsFromItemGroup(itemsIds,itemsGroupId,modifiersGroupsList , menu) {
    let result = {}
    for (const itemId of itemsIds) {
        let item = items[itemId._id]
        result[item.name] = {
            _id: itemId,
            category: item.category,
            price: getItemFromItemGroupPrice(itemId, itemsGroupId, prices),
            modifierGroups: getModifierGroups(item.modifierGroups, menu, modifiersGroupsList)
        }
    }
    return result

}


function addToSelectionList(name, Id, items, selectionCount, minSelectionCount) {
    if (!selectionGroupsToWrite[Id]) {
        selectionGroupsToWrite[Id] = {
            name: name,
            items: items,
            selectionCount: selectionCount,
            minSelectionCount: minSelectionCount
        };
    }
}

function getSelectionGroups(offer, modifiersGroupsList, itemsGroup) {
    if (!offer.selectionGroups) return null
    const selectionGroups = offer.selectionGroups
    let results = []
    for (const sg of selectionGroups) {
        const itemsGroupId = sg.itemGroup
        const itemGroupContent = itemsGroup[itemsGroupId]
        const itemsIds = itemGroupContent.items
        const items = getItemsFromItemGroup(
            itemsIds,
            itemsGroupId,
            modifiersGroupsList,
            offer.menu)
        results.push(itemsGroupId)
        addToSelectionList(
            itemGroupContent.name,
            itemsGroupId,
            items,
            sg.selectionCount,
            sg.minSelectionCount
        )
    }
    return results
}

function writeToFile(item, viewName, prefix) {
    let fileName = ""
    try {
        const dirPath = `${outputDir}/${viewName}`
        fileName = `${prefix}${item.name}.json`
            .replace(/"/g, "")
            .replace(/\s/g, "_")
            .replace(/\\/g, "_")
            .replace(/\//g, "_")
        fs.mkdirSync(dirPath, {recursive: true});
        fs.writeFileSync(`${dirPath}/${fileName}`, JSON.stringify(item, null, 2));
    } catch (err) {
        console.error(`Error writing file for item ${item.name}\n\n error: ${err}`);
    }
}

function proccessSelectionsAndModidications() {
    // write selectionGroupsToWrite to file
    const selectionGroupsFile = `${outputDir}/selectionGroups.json`;
    // fs.mkdirSync(`./output/${restaurant}`, {recursive: true});
    fs.writeFileSync(selectionGroupsFile, JSON.stringify(selectionGroupsToWrite, null, 2));
    // write modificationGroupToWrite to file
    const modificationGroupsFile = `${outputDir}/modificationGroups.json`;
    fs.writeFileSync(modificationGroupsFile, JSON.stringify(modificationGroupToWrite, null, 2));
}

function processItem(rawItem, price, offer, tags, menuId, modifiersGroupsList, itemsGroup) {
    const item = {
        name: rawItem.name,
        description: rawItem.description,
        tags: tags,
        item: rawItem._id,
        offer: offer._id,
        menu: menuId,
        selectionGroup: getSelectionGroups(offer, modifiersGroupsList, itemsGroup),
        modificationGroups: getModifierGroups(rawItem.modifierGroups, menuId, modifiersGroupsList),
        price: price
    }
   return item;

}

function processFolder(itemsMetadata, view, modifiersGroups, itemGroups) {
    for (const i in itemsMetadata.items) {

        const offer = offers[itemsMetadata.items[i].offer]
        const menuId = itemsMetadata.items[i].menu;
        const rawItem = itemsMetadata.items[i];
        const tags = [view.name]
        const price = getOfferPrice(offer._id, menuId, prices)
        const item = processItem(rawItem,
            price,
            offer,
            tags,
            menuId,
            modifiersGroups,
            itemGroups);
        const prefix = ""
        writeToFile(item, view.name, prefix);
    }
}

function main(rawItems, offers, itemGroups, modifiersGroups, prices, views) {
    for (const view of views) {
        for (const itemsMetadata of view.items) {
            if (itemsMetadata.type == "folder") {
                processFolder(itemsMetadata, view, modifiersGroups, itemGroups)
                continue
            }
            const offer = offers[itemsMetadata.offer];
            const menuId = itemsMetadata.menu;
            const rawItem = rawItems[offer.items[0]];
            const tags = [view.name]
            const price = getOfferPrice(offer._id, menuId, prices)
            const item = processItem(rawItem,
                price,
                offer,
                tags,
                menuId,
                modifiersGroups,
                itemGroups);
            const prefix = ""
            writeToFile(item, view.name, prefix);
        }
    }

    proccessSelectionsAndModidications();
}



// delete origin folder
if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
}

const items = mapBy_id(publishMenu.items);
const offers = mapBy_id(publishMenu.offers);
const itemGroups = mapBy_id(publishMenu.itemGroups);
const modifiers = mapBy_id(publishMenu.modifierGroups);
const prices = mapBy_id(publishMenu.prices);
const modItems = publishMenu.modItems
const views = publishMenu.menuViews ? publishMenu.menuViews : publishMenu.view;

main(items, offers, itemGroups, modifiers, prices, views);
