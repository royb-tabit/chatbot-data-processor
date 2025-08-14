const fs = require('fs');
const path = require('path');

const originalPath = path.join(__dirname, 'test', 'model', 'data-processor', 'output-example', 'sushiroom-nordao', 'llm-format', 'sushiroom-nordao.xml');
const comparedPath = path.join(__dirname, 'test', 'model', 'data-processor', 'test', 'sushiroom-nordao.xml');

function findDifferences() {
    const originalFile = fs.readFileSync(originalPath, 'utf8');
    const comparedFile = fs.readFileSync(comparedPath, 'utf8');

    // Create sets of trimmed lines
    let originalSet = new Set();
    let comparedSet = new Set();

    originalFile.split('\n').forEach(line => {
        if (line.trim()) {
            originalSet.add(line.trim());
        }
    });

    comparedFile.split('\n').forEach(line => {
        if (line.trim()) {
            comparedSet.add(line.trim());
        }
    });

    console.log(`Original file has ${originalSet.size} lines`);
    console.log(`Compared file has ${comparedSet.size} lines`);
    console.log('');

    // Find lines in original but not in compared
    const onlyInOriginal = [];
    originalSet.forEach(item => {
        if (!comparedSet.has(item)) {
            onlyInOriginal.push(item);
        }
    });

    // Find lines in compared but not in original
    const onlyInCompared = [];
    comparedSet.forEach(item => {
        if (!originalSet.has(item)) {
            onlyInCompared.push(item);
        }
    });

    console.log('=== LINES ONLY IN ORIGINAL FILE ===');
    if (onlyInOriginal.length === 0) {
        console.log('None');
    } else {
        onlyInOriginal.forEach((line, index) => {
            console.log(`${index + 1}. ${line}`);
        });
    }

    console.log('\n=== LINES ONLY IN COMPARED/TEST FILE ===');
    if (onlyInCompared.length === 0) {
        console.log('None');
    } else {
        onlyInCompared.forEach((line, index) => {
            console.log(`${index + 1}. ${line}`);
        });
    }

    // Parse JSON lines to find specific differences
    console.log('\n=== DETAILED ITEM DIFFERENCES ===');

    const originalItems = [];
    const comparedItems = [];

    originalFile.split('\n').forEach(line => {
        if (line.trim() && line.trim() !== '<ITEMS>' && line.trim() !== '</ITEMS>') {
            try {
                originalItems.push(JSON.parse(line.trim()));
            } catch (e) {
                // Skip non-JSON lines
            }
        }
    });

    comparedFile.split('\n').forEach(line => {
        if (line.trim() && line.trim() !== '<ITEMS>' && line.trim() !== '</ITEMS>') {
            try {
                comparedItems.push(JSON.parse(line.trim()));
            } catch (e) {
                // Skip non-JSON lines
            }
        }
    });

    // Create maps by item name for easier comparison
    const originalMap = new Map();
    const comparedMap = new Map();

    originalItems.forEach(item => originalMap.set(item.name, item));
    comparedItems.forEach(item => comparedMap.set(item.name, item));

    console.log('Items only in original:');
    originalMap.forEach((item, name) => {
        if (!comparedMap.has(name)) {
            console.log(`- ${name}`);
        }
    });

    console.log('\nItems only in compared/test:');
    comparedMap.forEach((item, name) => {
        if (!originalMap.has(name)) {
            console.log(`- ${name}`);
        }
    });

    console.log('\nItems with different properties:');
    originalMap.forEach((originalItem, name) => {
        const comparedItem = comparedMap.get(name);
        if (comparedItem) {
            const differences = [];

            // Check each property
            Object.keys(originalItem).forEach(key => {
                if (JSON.stringify(originalItem[key]) !== JSON.stringify(comparedItem[key])) {
                    differences.push(`${key}: ${JSON.stringify(originalItem[key])} -> ${JSON.stringify(comparedItem[key])}`);
                }
            });

            Object.keys(comparedItem).forEach(key => {
                if (!(key in originalItem)) {
                    differences.push(`${key}: (missing) -> ${JSON.stringify(comparedItem[key])}`);
                }
            });

            if (differences.length > 0) {
                console.log(`\n${name}:`);
                differences.forEach(diff => console.log(`  ${diff}`));
            }
        }
    });
}

findDifferences();
