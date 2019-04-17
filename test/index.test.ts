import { expect, test } from '@oclif/test';
import { readFileSync, writeFileSync } from 'fs';

import cmd = require('../src');

describe('schematics-readme', () => {
  beforeEach(done => {
    writeFileSync(
      'test/fixtures/fake-generators/src/collection.json',
      readFileSync('test/fixtures/fake-generator_sources/src/collection.json').toString()
    );
    writeFileSync(
      'test/fixtures/fake-generators/README.md',
      readFileSync('test/fixtures/fake-generator_sources/README.md').toString()
    );
    done();
  });
  test
    .stdout()
    .stderr()
    .do(() => cmd.run(['test/fixtures/fake-generators']))
    .it('test/fixtures/fake-generators', ctx => {
      expect(ctx.stdout).to.contain(`Collected 4 generators!`);
    });
});
