const { process: parseTd } = require('./parse_td');
const { main: convertToLlm } = require('./convert_to_llm');

async function process() {
    try {
        console.log('Starting data processing...');

        // Step 1: Parse TD catalog file and get data in memory
        console.log('Step 1: Running parse_td...');
        const parsedData = parseTd();
        console.log('✓ parse_td completed successfully');
        console.log(`  - Processed ${parsedData.items.length} items`);
        console.log(`  - Generated ${Object.keys(parsedData.selections).length} selection groups`);
        console.log(`  - Generated ${Object.keys(parsedData.modifications).length} modification groups`);

        // Step 2: Convert to LLM format using data from memory
        console.log('Step 2: Running convert_to_llm...');
        await convertToLlm(parsedData);
        console.log('✓ convert_to_llm completed successfully');

        console.log('✓ Data processing completed successfully!');
        console.log('Final output file: ./output/sushiroom-nordao/llm-format/sushiroom-nordao.xml');
        console.log('✓ No intermediate disk files were created - all data passed in memory');

    } catch (error) {
        console.error('❌ Data processing failed:', error);
        process.exit(1);
    }
}

// Run the process if this file is executed directly
if (require.main === module) {
    process();
}

module.exports = { process };
