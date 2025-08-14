const fs = require('fs');
const path = require('path');
const originalPath = path.join(__dirname, 'output-example', 'sushiroom-nordao', 'llm-format', 'sushiroom-nordao.xml');
const comparedPath = path.join(__dirname, 'test', 'sushiroom-nordao.xml');

describe('valid output', () => {
  test('test file must match original', () => {
    expect(fs.existsSync(originalPath)).toBe(true);
    expect(fs.existsSync(comparedPath)).toBe(true);
    const originalFile = fs.readFileSync(originalPath, 'utf8');
    const comparedFile = fs.readFileSync(comparedPath, 'utf8');


    expect(originalFile == comparedFile).toBe(true);
  });
});
