import { expect, test } from '@oclif/test';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import cmd = require('../src');

describe('schematics-readme', () => {
  let cwd = '';
  before(done => {
    writeFileSync(
      'test/fixtures/fake-generators/src/collection.json',
      readFileSync('test/fixtures/fake-generators_sources/src/collection.json').toString()
    );
    writeFileSync(
      'test/fixtures/fake-generators/README.md',
      readFileSync('test/fixtures/fake-generators_sources/README.md').toString()
    );
    writeFileSync(
      'test/fixtures/fake-generators-with-repo/src/collection.json',
      readFileSync('test/fixtures/fake-generators-with-repo_sources/src/collection.json').toString()
    );
    writeFileSync(
      'test/fixtures/fake-generators-with-repo/README.md',
      readFileSync('test/fixtures/fake-generators-with-repo_sources/README.md').toString()
    );
    done();
  });
  test
    .stdout()
    .stderr()
    .do(() => {
      cwd = process.cwd();
      process.chdir(join(__dirname, 'fixtures/fake-generators'));
      return cmd.run(['--branch', 'master']);
    })
    .it('Without folder name and move cwd and not set repository', ctx => {
      process.chdir(cwd);
      expect(ctx.stdout).to.contain(
        `Collected 4 generators to "README.md"
Collected 6 generators to "src/collection.json"
`);
      expect(
        readFileSync('test/fixtures/fake-generators/README.md').toString()
      ).to.equal(
        readFileSync('test/fixtures/fake-generators_results/with_folder_name_and_move_cwd_not_set_repo-README.md').toString()
      );
    });
  test
    .stdout()
    .stderr()
    .do(() => cmd.run(['test/fixtures/fake-generators', '--branch', 'master']))
    .it('With folder name and not set repository', ctx => {
      expect(ctx.stdout).to.contain(
        `Collected 4 generators to "README.md"
Collected 6 generators to "src/collection.json"
`);
      expect(
        readFileSync('test/fixtures/fake-generators/README.md').toString()
      ).to.equal(
        readFileSync('test/fixtures/fake-generators_results/with_folder_name_and_not_set_repo-README.md').toString()
      );
    });
  test
    .stdout()
    .stderr()
    .do(() => {
      cwd = process.cwd();
      process.chdir(join(__dirname, 'fixtures/fake-generators-with-repo'));
      return cmd.run(['--branch', 'master']);
    })
    .it('Without folder name and move cwd and set repository', ctx => {
      process.chdir(cwd);
      expect(ctx.stdout).to.contain(
        `Collected 4 generators to "README.md"
Collected 6 generators to "src/collection.json"
`);
      expect(
        readFileSync('test/fixtures/fake-generators-with-repo/README.md').toString()
      ).to.equal(
        readFileSync('test/fixtures/fake-generators-with-repo_results/with_folder_name_and_move_cwd-README.md').toString()
      );
    });
  test
    .stdout()
    .stderr()
    .do(() => cmd.run(['test/fixtures/fake-generators-with-repo', '--branch', 'master']))
    .it('With folder name and set repository', ctx => {
      expect(ctx.stdout).to.contain(
        `Collected 4 generators to "README.md"
Collected 6 generators to "src/collection.json"
`);
      expect(
        readFileSync('test/fixtures/fake-generators-with-repo/README.md').toString()
      ).to.equal(
        readFileSync('test/fixtures/fake-generators-with-repo_results/with_folder_name-README.md').toString()
      );
    });
});
