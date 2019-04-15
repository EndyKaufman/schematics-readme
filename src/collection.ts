import { existsSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname, join, resolve } from 'path';
import * as recursive from 'recursive-readdir';

export const START_GENERATORS = '<!-- generators -->';
export const STOP_GENERATORS = '<!-- generatorsstop -->';

export interface ICollection {
    $schema: './node_modules/@angular-devkit/schematics/collection-schema.json';
    schematics: {
        [key: string]: {
            title: string;
            description: string;
            factory: string;
            schema: string;
        }
    };
}
export interface IPackage {
    name: string;
    dependencies: {
        [key: string]: string
    };
    devDependencies: {
        [key: string]: string
    };
}
export interface IGeneratorProperty {
    [key: string]: {
        description: string
        type: string;
        $default?: {
            $source: 'argv',
            index: number
        },
        default?: string;
        ['x-prompt']: string;
        hidden: boolean;
    };
}
export interface IGeneratorProperties {
    [key: string]: IGeneratorProperty;
}
export interface IGenerator {
    $schema: 'http://json-schema.org/schema';
    path: string;
    localPath: string;
    id: string;
    name: string;
    type: 'object';
    title: string;
    description: string;
    examples: string[];
    mainDependencies: {
        [key: string]: string
    };
    devDependencies: {
        [key: string]: string
    };
    properties: IGeneratorProperties;
    required: string[];
    hidden: boolean;
}
export function collectGenerator(rootPath: string, path: string): IGenerator {
    const generator: IGenerator = loadGenerator(rootPath, path);
    const rootPackage: IPackage = loadRootPackage(rootPath);
    let prevVersion: string;
    if (generator.mainDependencies) {
        if (rootPackage) {
            prevVersion = '';
            Object.keys(generator.mainDependencies).forEach((depName: string) => {
                if (prevVersion && generator.mainDependencies[depName] === '^') {
                    generator.mainDependencies[depName] = prevVersion;
                }
                prevVersion = generator.mainDependencies[depName];
                const value = rootPackage.dependencies[depName];
                if (generator.mainDependencies[depName] === '*' && value) {
                    if (rootPackage.dependencies && rootPackage.dependencies[depName]) {
                        generator.mainDependencies[depName] = value;
                    }
                    if (rootPackage.devDependencies && rootPackage.devDependencies[depName]) {
                        generator.mainDependencies[depName] = value;
                    }
                }
            });
        }
        prevVersion = '';
        Object.keys(generator.mainDependencies).forEach((depName: string) => {
            if (prevVersion && generator.mainDependencies[depName] === '^') {
                generator.mainDependencies[depName] = prevVersion;
            }
            prevVersion = generator.devDependencies[depName];
            const value = generator.mainDependencies[depName];
            const dir = dirname(path);
            const depPath = join(dir, value);
            if (existsSync(depPath)) {
                const depPackage: IPackage = {
                    ...JSON.parse(
                        readFileSync(depPath).toString()
                    )
                };
                prevVersion = generator.mainDependencies[depName];
                if (depPackage.dependencies && depPackage.dependencies[depName]) {
                    generator.mainDependencies[depName] = depPackage.dependencies[depName];
                }
                if (depPackage.devDependencies && depPackage.devDependencies[depName]) {
                    generator.mainDependencies[depName] = depPackage.devDependencies[depName];
                }
            }
        });
    }
    if (generator.devDependencies) {
        if (rootPackage) {
            prevVersion = '';
            Object.keys(generator.devDependencies).forEach((depName: string) => {
                if (prevVersion && generator.devDependencies[depName] === '^') {
                    generator.devDependencies[depName] = prevVersion;
                }
                prevVersion = generator.devDependencies[depName];
                const value = rootPackage.devDependencies[depName];
                if (generator.devDependencies[depName] === '*' && value) {
                    if (rootPackage.dependencies && rootPackage.dependencies[depName]) {
                        generator.devDependencies[depName] = value;
                    }
                    if (rootPackage.devDependencies && rootPackage.devDependencies[depName]) {
                        generator.devDependencies[depName] = value;
                    }
                }
            });
        }
        prevVersion = '';
        Object.keys(generator.devDependencies).forEach((depName: string) => {
            if (prevVersion && generator.devDependencies[depName] === '^') {
                generator.devDependencies[depName] = prevVersion;
            }
            prevVersion = generator.devDependencies[depName];
            const value = generator.devDependencies[depName];
            const dir = dirname(path);
            const depPath = join(dir, value);
            if (existsSync(depPath)) {
                const depFile: IPackage = {
                    ...JSON.parse(
                        readFileSync(depPath).toString()
                    )
                };
                if (depFile.devDependencies && depFile.devDependencies[depName]) {
                    generator.devDependencies[depName] = depFile.devDependencies[depName];
                }
                if (depFile.dependencies && depFile.dependencies[depName]) {
                    generator.devDependencies[depName] = depFile.dependencies[depName];
                }
            }
        });
    }
    return generator;
}
export function loadRootPackage(rootPath: string): IPackage {
    try {
        const packageData: IPackage = JSON.parse(readFileSync(join(rootPath, 'package.json')).toString());
        if (!packageData.name) {
            packageData.name = basename(rootPath);
        }
        return packageData;
    } catch (error) {
        return {
            name: basename(rootPath),
            dependencies: {},
            devDependencies: {}
        };
    }
}
export function loadRootReadme(rootPackage: IPackage, rootPath: string): string {
    try {
        return readFileSync(join(rootPath, 'README.md')).toString();
    } catch (error) {
        return `${rootPackage.name}
===============

Descriptions for ${rootPackage.name}

<!-- generators -->
<!-- generatorsstop -->

# License

MIT
`;
    }
}
export function saveRootReadme(rootPath: string, content: string) {
    writeFileSync(join(rootPath, 'README.md'), content);
}
export function saveCollection(rootPath: string, collection: ICollection) {
    writeFileSync(
        join(rootPath, 'src', 'collection.json'),
        `${JSON.stringify(collection, null, 2)}\n`
    );
}
export function loadGenerator(rootPath: string, path: string): IGenerator {
    const schema: IGenerator = JSON.parse(readFileSync(path).toString());
    const title = (schema.title || schema.id || '').replace(new RegExp('-', 'g'), ' ');
    const name = title.replace(new RegExp(' ', 'g'), '-').toLowerCase();
    const localPath = resolve(path).replace(resolve(join(rootPath, 'src')), '');
    return {
        name,
        path,
        localPath,
        ...schema,
        title: title,
        description: (schema.description || '')
    };
}

export function collectGenerators(rootPath: string): Promise<IGenerator[]> {
    return new Promise((resolve, reject) =>
        recursive(join(rootPath, 'src'), ['!*schema.json'], (err, files) => {
            if (err || !Array.isArray(files)) {
                reject(err);
            } else {
                const generators: IGenerator[] =
                    files.map(file =>
                        collectGenerator(rootPath, file)
                    ).sort(
                        (a, b) =>
                            !a ? 0 : a.name.localeCompare(b.name)
                    );
                resolve(
                    generators
                );
            }
        })
    );
}
export function transformGeneratorToMarkdown(rootPackage: IPackage, generator: IGenerator): string {
    const exampleMarkdown = generateExamples();
    const parametrsMarkdown = generateParametrs();
    const dependenciesMarkdown = generateDependencies('mainDependencies');
    const devDependenciesMarkdown = generateDependencies('devDependencies');
    return `## ${generator.title}
${generator.description}
${exampleMarkdown}
${parametrsMarkdown}
${dependenciesMarkdown}
${devDependenciesMarkdown}`;

    function generateParametrs() {
        let parametrsMarkdown = '';
        if (
            generator.properties &&
            Object.keys(generator.properties).length > 0
        ) {
            const parametrs = Object.keys(generator.properties)
                .filter(propertyKey => !generator.properties[propertyKey].hidden)
                .map((key, index) => {
                    const property: any = generator.properties ? generator.properties[key] : {};
                    const required: string = (generator.required && generator.required.indexOf(key) !== -1) ? '*required* ' : '';
                    const defaultValue: string = (property && (property.$default || property.default)) ? JSON.stringify((property.$default || property.default)) : 'none';
                    return `| ${key} | ${required}{${property.type}} | ${property.description} | ${defaultValue} |`;
                }).join('\n');
            parametrsMarkdown = `
### Parameters
| Name | Type | Description | Default |
|------|:----:|------------:|--------:|
${parametrs}`;
        }
        return parametrsMarkdown;
    }
    function generateDependencies(dependenciesType: 'mainDependencies' | 'devDependencies') {
        let title = 'Dependencies';
        if (dependenciesType === 'devDependencies') {
            title = 'Dev dependencies';
        }
        let dependenciesMarkdown = '';
        if (generator[dependenciesType] && Object.keys(generator[dependenciesType]).length > 0) {
            const dependencies = Object.keys(generator[dependenciesType]).map((key, index) => {
                const version = generator[dependenciesType][key].replace(
                    new RegExp('=', 'g'), ''
                ).replace(
                    new RegExp('<', 'g'), ''
                ).replace(
                    new RegExp('>', 'g'), ''
                ).replace(
                    new RegExp('~', 'g'), ''
                ).replace(
                    new RegExp('^', 'g'), ''
                );
                const npmUrl = `https://www.npmjs.com/package/${key}`;
                const currentVersionImage = `https://badge.fury.io/js/${encodeURI(key)}.svg`;
                const usedVersionImage = `https://img.shields.io/badge/npm_package-${version}-9cf.svg`;
                return `| [${key}](${npmUrl}) | [![NPM version](${usedVersionImage})](${npmUrl}) | [![NPM version](${currentVersionImage})](${npmUrl}) |`;
            }).join('\n');
            dependenciesMarkdown = `
### ${title}
| Name | Used | Current |
| ------ | ------ | ------ |
${dependencies}`;
        }
        return dependenciesMarkdown;
    }

    function generateExamples() {
        let exampleMarkdown = '';
        if (generator.examples && generator.examples.length > 0) {
            let title = 'Example';
            if (generator.examples.length > 1) {
                title = 'Examples';
            }
            const examples = generator.examples.map((example, index) => `schematics ${rootPackage.name}:${example}`).join('\n');
            exampleMarkdown = `
${title}:
\`\`\`bash
${examples}
\`\`\``;
        } else {
            exampleMarkdown = `
Example:
\`\`\`bash
schematics ${rootPackage.name}:${generator.id}
\`\`\``;
        }
        return exampleMarkdown;
    }
}
export function createHeader(rootPackage: IPackage, generators: IGenerator[]) {
    const generatorsMarkdown = generators.map(
        generator =>
            `* [${generator.title}](#${generator.name}) - ${generator.description || generator.id}`
    ).join('\n');
    return `
* [Install](#install)
* [Usage](#usage)
* [Available generators](#available-generators)

# Installation
\`\`\`bash
npm install -g @angular-devkit/schematics-cli
npm install --save-dev ${rootPackage.name}
\`\`\`

# Usage
\`\`\`bash
schematics ${rootPackage.name}:<generator name> <arguments>
\`\`\`

# Available generators
${generatorsMarkdown}`;
}
export async function transformGeneratorsToMarkdown(rootPath: string): Promise<IGenerator[]> {
    const rootPackage: IPackage = loadRootPackage(rootPath);
    const rootReadme: string = loadRootReadme(rootPackage, rootPath);
    let generators: IGenerator[] = [];
    try {
        generators = (await collectGenerators(rootPath))
            .filter(generator => !generator.hidden);
    } catch (error) {
        console.error(error);
    }
    const headerMardown = createHeader(rootPackage, generators);
    const generatorsMarkdown = generators.map(
        generator =>
            `${transformGeneratorToMarkdown(rootPackage, generator)}\n`
    ).join('\n');
    const newReadme = [
        headerMardown,
        generatorsMarkdown
    ].join('\n');
    const before = rootReadme.split(START_GENERATORS)[0];
    const after = rootReadme.split(STOP_GENERATORS)[1];
    if (after) {
        const newContent = rootReadme.replace(
            rootReadme,
            [before + START_GENERATORS, newReadme, STOP_GENERATORS + after].join('\n')
        );
        saveRootReadme(rootPath, newContent);
    } else {
        const newContent = rootReadme.replace(
            rootReadme,
            [before + START_GENERATORS, newReadme, STOP_GENERATORS].join('\n')
        );
        saveRootReadme(rootPath, newContent);
    }
    return generators;
}
export async function transformGeneratorsToCollections(rootPath: string): Promise<any> {
    let generators: IGenerator[] = [];
    try {
        generators = await collectGenerators(rootPath);
    } catch (error) {
        console.error(error);
    }
    const collections: ICollection = {
        $schema: './node_modules/@angular-devkit/schematics/collection-schema.json',
        schematics: {}
    };
    generators
        .forEach(
            generator => {
                collections.schematics[generator.id] = {
                    title: generator.title || generator.id,
                    description: generator.description || generator.id,
                    factory: `.${dirname(generator.localPath)}`,
                    schema: `.${generator.localPath}`,
                    ...(generator.hidden ? { hidden: true } : {})
                };
            }
        );
    saveCollection(rootPath, collections);
    return collections;
}
