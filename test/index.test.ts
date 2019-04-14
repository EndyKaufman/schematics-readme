import { expect, test } from '@oclif/test';
import { readFileSync, writeFileSync } from 'fs';

import cmd = require('../src');

describe('schematics-readme', () => {
  beforeEach(done => {
    writeFileSync(
      'test/fixtures/fake-generator_sources/src/collection.json',
      readFileSync('test/fixtures/fake-generator/src/collection.json').toString()
    );
    writeFileSync(
      'test/fixtures/fake-generator_sources/README.md',
      readFileSync('test/fixtures/fake-generator/README.md').toString()
    );
    done();
  });
  afterEach(done => {
    writeFileSync(
      'test/fixtures/fake-generator_sources/src/collection.json',
      readFileSync('test/fixtures/fake-generator/src/collection.json').toString()
    );
    writeFileSync(
      'test/fixtures/fake-generator_sources/README.md',
      readFileSync('test/fixtures/fake-generator/README.md').toString()
    );
    done();
  });
  test
    .stdout()
    .stderr()
    .do(() => cmd.run(['test/fixtures/fake-generator']))
    .it('test/fixtures/fake-generator', ctx => {
      expect(ctx.stdout).to.contain(`Collected 2 generators!`);
    });
});
