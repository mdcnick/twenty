const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const TypeScript = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = readFileSync(filename, 'utf8');
  const output = TypeScript.transpileModule(source, {
    compilerOptions: {
      module: TypeScript.ModuleKind.CommonJS,
      target: TypeScript.ScriptTarget.ES2020,
    },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};

const fixturePath = join(__dirname, '..', 'fixtures', 'preview-input.json');
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
const { transformBatch } = require('../src/migration/index.ts');
const preview = transformBatch(fixture.input, fixture.relationIndex, fixture.options);

process.stdout.write(`${JSON.stringify(preview, null, 2)}\n`);
