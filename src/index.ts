import { Command, flags } from '@oclif/command';
import { transformGeneratorsToCollections, transformGeneratorsToMarkdown } from './collection';

class SchematicsReadmeCli extends Command {
  static description = 'Generator README.md file for Angular Schematics collection';
  static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
  };
  static args = [{ name: 'path' }];
  async run() {
    const { args, flags } = this.parse(SchematicsReadmeCli);
    if (!args.path) {
      args.path = '.';
    }
    try {
      const generators = await transformGeneratorsToMarkdown(
        args.path
      );
      const collections = await transformGeneratorsToCollections(
        args.path
      );
      this.log(`Collected ${generators.length} generators!`);
      return;
    } catch (error) {
      console.log(error);
    }
  }
}

export = SchematicsReadmeCli;
