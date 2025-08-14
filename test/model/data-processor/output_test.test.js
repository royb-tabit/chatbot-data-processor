const fs = require('fs');
const path = require('path');
const originalPath = path.join(__dirname, 'output-example', 'sushiroom-nordao', 'llm-format', 'sushiroom-nordao.xml');
const comparedPath = "C:\\Users\\RoyBarak\\repo\\chatbot-data-processor\\model\\data-processor\\output\\sushiroom-nordao\\llm-format\\sushiroom-nordao.xml" //path.join(__dirname, 'test', 'sushiroom-nordao.xml');

describe('valid output', () => {
  test('test file must match original', () => {
    expect(fs.existsSync(originalPath)).toBe(true);
    expect(fs.existsSync(comparedPath)).toBe(true);
    const originalFile = fs.readFileSync(originalPath, 'utf8');
    const comparedFile = fs.readFileSync(comparedPath, 'utf8');

    // can you make a set of every item and check if he is the same in both files
    let originalSet = new Set()
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

    originalSet.forEach(item => {
      expect(comparedSet.has(item)).toBe(true);
    });


  });
});
