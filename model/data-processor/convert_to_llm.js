const config = require('./config.json');
const fs = require('fs');
const path = require('path');
const workingDir = process.cwd();
const restaurant = config.restaurant // Change this to your restaurant name
const inputDir = `${workingDir}/input/${restaurant}`
const middleDir = `${workingDir}/output/${restaurant}/origin`
const finalDir = `${workingDir}/output/${restaurant}/llm-format`;
const sold = require(`${inputDir}/sold.json`);
let outputSelection = {};
let outputModification = {};
let outputItems = [];

inputSelection = require(`${middleDir}/selectionGroups.json`);
inputModification = require(`${middleDir}/modificationGroups.json`);

function getSubModifier(modifier) {
    const item = modifier.item;

}

function getMod(modificationGroupsIds) {
    if (!modificationGroupsIds || modificationGroupsIds.length === 0) {
        return null
    }
    let mandatory = [];
    let optional = [];
    for (const modGroupId of modificationGroupsIds) {
        if (outputModification[modGroupId]) { continue }
        const modGroup = inputModification[modGroupId];
        let add = [];
        let remove = [];
        for (const modifier of modGroup.modifiers) {
            if (modGroup.defaults.some(defaultItem => defaultItem.modifier === modifier._id)) {
                const subModifier = getSubModifier(modifier);
                const isSubModifier = subModifier && subModifier.length > 0;
                remove.push({
                    name: modifier.name,
                ...(isSubModifier && {subModifier: subModifier}),
                })
            } else {
                const isPrice = modifier.price !== null && modifier.price !== 0;
                add.push({
                    name: modifier.name,
                    ...(isPrice && {price: modifier.price}),
                })
            }
        }
        const isMandatory = modGroup.min > 0 || modGroup.singleSelection == true;
        if (isMandatory) {
            const min = modGroup.singleSelection ? 1 : modGroup.min;
            const max = modGroup.singleSelection ? 1 : modGroup.max;
            outputModification[modGroupId] = {
                name: modGroup.name,
                add: add,
                remove: remove,
                min: min,
                max: max,
            }
            mandatory.push({
                name: modGroup.name,
                add: add,
                remove: remove,
                min: min,
                max: max,
            })
        } else {
            outputModification[modGroupId] = {
                name: modGroup.name,
                add: add,
                remove: remove,
                max: modGroup.max,
            }
            optional.push({
                name: modGroup.name,
                add: add,
                remove: remove,
                max: modGroup.max,
            })
        }
    }

    return {
        mandatory: mandatory,
        optional: optional
    }
}

function getSelectionItemModificationGroups(rawItem) {
    const modifierGroups = rawItem.modifierGroups;
    let results = [];
    if (modifierGroups && modifierGroups.length > 0) {
        for (let modGroup of modifierGroups) {
            results.push(modGroup.modGroupId)
        }
    }
    return results;
}

function getSelectionItem(rawItem, itemId) {
    const price = rawItem.price
    const isPrice = price !== null && price !== 0;
    const modificationGroups = getSelectionItemModificationGroups(rawItem);
    const isModifications = modificationGroups && modificationGroups.length > 0;
    getMod(modificationGroups);
    return {
        name: itemId,
        ...(isPrice && {price: price}),
        ...(isModifications && {modifications: modificationGroups}
        ),
    }
}

function getSelections(selectionGroupsIds) {
    // let mandatory = [];
    // let optional = [];
    let result = [];
    if (typeof selectionGroupsIds === 'undefined' || selectionGroupsIds === null || selectionGroupsIds.length === 0) {
        return result;
    } else {
        for (const sGroupId of selectionGroupsIds) {
            if (outputSelection[sGroupId]) { continue }
            const sGroup = inputSelection[sGroupId];
            let options = [];
            for (const itemId of Object.keys(sGroup.items)) {
                const rawItem = sGroup.items[itemId]
                const selectionItem = getSelectionItem(rawItem, itemId)
                options.push(selectionItem)
            }
            const min = sGroup.singleSelection ? 1 : sGroup.minSelectionCount;
            const max = sGroup.singleSelection ? 1 : sGroup.selectionCount;
            outputSelection[sGroupId] = {
                name: sGroup.name,
                options: options,
                min: min,
                max: max,
            }
            result.push(outputSelection[sGroupId])
        }
        return result;
    }

}

function getModGroupIds(modificationGroups) {
    let results = []
    if (!modificationGroups || modificationGroups.length === 0) {
        return results;
    }
    modificationGroups.forEach(item => {
        results.push(item.modGroupId);
    })
    return results;
}

function getRank(name) {
    let soldList = sold.food.concat(sold.beverages)
    for (const o of soldList) {
        if (o.offerName == name) {
            return o.sold;
        }
    }
}

function processItem(item) {
    getSelections(item.selectionGroup)
    const modGroupIds = getModGroupIds(item.modificationGroups)
    getMod(modGroupIds)
    return {
        name: item.name,
        tags: item.tags,
        ...(item.description != null && {description: item.description}), // Only include description if it exists and is not empty
        price: item.price,
        ...(item.selectionGroup != null && {selections: item.selectionGroup}),
        ...(item.modificationGroups != null && {modifications: modGroupIds}),
        sold_per_month: getRank(item.name),
        offer: item.offer
    }
}

async function getMenuViews(directoryPath) {
    const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
    const subdirs = entries
        .filter(entry => entry.isDirectory())
    return subdirs;
}

function  writeToFile(menuViewName, llm_item) {
    const finalMenuPath = path.join(finalDir, menuViewName);
    fs.mkdirSync(finalMenuPath, {recursive: true});
    fs.appendFileSync(finalDir + "/" + "items" + ".jsonl", `${JSON.stringify(llm_item)}\n`, 'utf8');
    const singleItemOutputPath = path.join(finalDir, menuViewName, "items")
    fs.mkdirSync(singleItemOutputPath, {recursive: true});
    const singleFileName = llm_item.name + ".json".replace(/"/g, "").replace(/\s/g, "_").replace(/\\/g, "_").replace(/\//g, "_")
    try {
        fs.writeFileSync(singleItemOutputPath + "/" + singleFileName, `${JSON.stringify(llm_item, null, 2)}\n`, 'utf8');
    } catch (err) {
       console.error(`Error writing file for item ${llm_item.name}\n\n error: ${err}`);
    }
}

// //זה דמו - תפריט ערב
// const inventory = require('./inventory.json');
// const inventoryMap = {};
// for (const item of inventory) {
//     inventoryMap[item.item] = item
// }
//
// function isInInventory(item) {
//     const invInfo = inventoryMap[item]
//     if (invInfo && invInfo.quantity == 0) {
//         return false
//     } else {
//         return true
//     }
// }

function writeModAndSelectionToFile() {
    // write in jsonl format using append
    const selectionOutputPath = path.join(finalDir + '/selection.jsonl' );
    for (const key of Object.keys(outputSelection)) {
        let data = JSON.stringify({id: key, selection: outputSelection[key]}) + "\n"
        fs.appendFileSync(selectionOutputPath, data, 'utf8');
    }
    const modificationOutputPath = path.join(finalDir + '/modification.jsonl' );
    for (const key of Object.keys(outputModification)) {
        let data = JSON.stringify({id: key, modification: outputModification[key]}) + "\n"
        fs.appendFileSync(modificationOutputPath, data, 'utf8');
    }
}

async function main() {
    const menuViews = await getMenuViews(middleDir);
    for (const menuView of menuViews) {
        const itemPathList = await getItemsFromMenuView(menuView.path)
        for (const itemPath of itemPathList) {
            const originItemObject = require(itemPath)
            // if (!isInInventory(originItemObject.item)) { continue }
            // if (originItemObject.price == 0) { continue }
            const processed_item = processItem(originItemObject)
            outputItems.push(processed_item);
            writeToFile(menuView.name, processed_item);
        }
    }
    writeModAndSelectionToFile();
    //create final file
    createFinalFile();
}

function createFinalFile() {
    const finalFilePath = path.join(finalDir, restaurant + '.xml');
    fs.mkdirSync(finalDir, {recursive: true});
    fs.writeFileSync(finalFilePath, '', 'utf8');
    fs.appendFileSync(finalFilePath, '<ITEMS>' + "\n", 'utf8'); // Create the file if it doesn't exist
    // for all items
    for (const item of outputItems) {
        fs.appendFileSync(finalFilePath, JSON.stringify(item) + "\n", 'utf8');
    }
    fs.appendFileSync(finalFilePath, '</ITEMS>' + "\n", 'utf8');

    fs.appendFileSync(finalFilePath, '<SELECTIONS>' + "\n", 'utf8');
    // for all selections
    for (const key of Object.keys(outputSelection)) {
        let selection = {id: key, selection: outputSelection[key]};
        fs.appendFileSync(finalFilePath, JSON.stringify(selection) + "\n", 'utf8');
    }
    fs.appendFileSync(finalFilePath, '</SELECTIONS>' + "\n", 'utf8');
    fs.appendFileSync(finalFilePath, '<MODIFICATIONS>' + "\n", 'utf8');
    // for all modifications
    for (const key of Object.keys(outputModification)) {
        let modification = {id: key, modification: outputModification[key]};
        fs.appendFileSync(finalFilePath, JSON.stringify(modification) + "\n", 'utf8');
    }
    fs.appendFileSync(finalFilePath, '</MODIFICATIONS>', 'utf8');
}

async function getItemsFromMenuView(menuView) {
    const entries = await fs.promises.readdir(menuView, { withFileTypes: true });
    const items = entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
        .map(entry => path.join(menuView, entry.name))
    return items;
}


main()
