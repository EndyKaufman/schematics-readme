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
    path: string;
    localPath: string;
    gitPath?: string;
    name: string;
    repository?: {
        type: 'git';
        url: string;
    };
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
    gitPath?: string;
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
export function collectGenerator(rootPackage: IPackage, path: string): IGenerator {
    const generator: IGenerator = loadGenerator(rootPackage, path);
    let prevVersion: string;
    if (generator.mainDependencies) {
        if (rootPackage) {
            prevVersion = '';
            Object.keys(generator.mainDependencies).forEach((depName: string) => {
                if (prevVersion && generator.mainDependencies[depName] === '^') {
                    generator.mainDependencies[depName] = prevVersion;
                }
                prevVersion = generator.mainDependencies[depName];
                if (generator.mainDependencies[depName] === '*') {
                    if (rootPackage.devDependencies && rootPackage.devDependencies[depName]) {
                        generator.mainDependencies[depName] = rootPackage.devDependencies[depName];
                    }
                    if (rootPackage.dependencies && rootPackage.dependencies[depName]) {
                        generator.mainDependencies[depName] = rootPackage.dependencies[depName];
                    }
                }
            });
        }
        prevVersion = '';
        Object.keys(generator.mainDependencies).forEach((depName: string) => {
            if (prevVersion && generator.mainDependencies[depName] === '^') {
                generator.mainDependencies[depName] = prevVersion;
            }
            const value = generator.mainDependencies[depName];
            const dir = dirname(path);
            const depPath = join(dir, value);
            if (existsSync(depPath)) {
                const depPackage: IPackage = {
                    ...JSON.parse(
                        readFileSync(depPath).toString()
                    )
                };
                prevVersion = value;
                if (depPackage.devDependencies && depPackage.devDependencies[depName]) {
                    generator.mainDependencies[depName] = depPackage.devDependencies[depName];
                }
                if (depPackage.dependencies && depPackage.dependencies[depName]) {
                    generator.mainDependencies[depName] = depPackage.dependencies[depName];
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
                if (generator.devDependencies[depName] === '*') {
                    if (rootPackage.dependencies && rootPackage.dependencies[depName]) {
                        generator.devDependencies[depName] = rootPackage.dependencies[depName];
                    }
                    if (rootPackage.devDependencies && rootPackage.devDependencies[depName]) {
                        generator.devDependencies[depName] = rootPackage.devDependencies[depName];
                    }
                }
            });
        }
        prevVersion = '';
        Object.keys(generator.devDependencies).forEach((depName: string) => {
            if (prevVersion && generator.devDependencies[depName] === '^') {
                generator.devDependencies[depName] = prevVersion;
            }
            const value = generator.devDependencies[depName];
            const dir = dirname(path);
            const depPath = join(dir, value);
            if (existsSync(depPath)) {
                const depFile: IPackage = {
                    ...JSON.parse(
                        readFileSync(depPath).toString()
                    )
                };
                prevVersion = value;
                if (depFile.dependencies && depFile.dependencies[depName]) {
                    generator.devDependencies[depName] = depFile.dependencies[depName];
                }
                if (depFile.devDependencies && depFile.devDependencies[depName]) {
                    generator.devDependencies[depName] = depFile.devDependencies[depName];
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
        return {
            path: rootPath,
            localPath: '/',
            gitPath: getRepository(packageData),
            ...packageData
        };
    } catch (error) {
        return {
            name: basename(rootPath),
            path: rootPath,
            gitPath: undefined,
            localPath: '/',
            dependencies: {},
            devDependencies: {}
        };
    }
    function getRepository(packageData: IPackage) {
        if (
            packageData && packageData.repository && packageData.repository.type === 'git'
        ) {
            const url = packageData.repository.url;
            if (url.substr(0, 4) === 'git+' && url.substr(url.length - 4, 4) === '.git') {
                return url.substring(4, url.length - 4);
            }
        }
        return undefined;
    }
}
export function loadRootReadme(rootPackage: IPackage): string {
    try {
        return readFileSync(join(rootPackage.path, 'README.md')).toString();
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
export function loadGenerator(rootPackage: IPackage, path: string): IGenerator {
    const schema: IGenerator = JSON.parse(readFileSync(path).toString());
    let title = (schema.title || schema.id || '').replace(new RegExp('-', 'g'), ' ');
    if (!schema.title && title.length > 0) {
        title = title.charAt(0).toUpperCase() + title.substr(1);
    }
    const name = title.replace(new RegExp(' ', 'g'), '-').toLowerCase();
    const localPath = resolve(path).replace(resolve(join(rootPackage.path, 'src')), '');

    return {
        name,
        path,
        localPath,
        gitPath: join(rootPackage.gitPath || '', 'src', localPath || ''),
        ...schema,
        title: title,
        description: (schema.description || '')
    };
}

export function collectGenerators(rootPackage: IPackage): Promise<IGenerator[]> {
    return new Promise((resolve, reject) =>
        recursive(join(rootPackage.path, 'src'), ['!*schema.json'], (err, files) => {
            if (err || !Array.isArray(files)) {
                reject(err);
            } else {
                const generators: IGenerator[] =
                    files.map(file =>
                        collectGenerator(rootPackage, file)
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
    const seeCode = (generator.localPath && generator.gitPath) ? `
_See code: [src${
        dirname(generator.localPath).replace(new RegExp('\\\\', 'g'), '/')
        }/index.ts](${
        dirname(generator.gitPath).replace(new RegExp('\\\\', 'g'), '/')
        }/index.ts)_` : '';
    return `## ${generator.title}
${generator.description}
${exampleMarkdown}
${parametrsMarkdown}
${dependenciesMarkdown}
${devDependenciesMarkdown}
${seeCode}`;

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
                const currentVersionImage = `https://badge.fury.io/js/${encodeURIComponent(key)}.svg`;
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
    const rootReadme: string = loadRootReadme(rootPackage);
    let generators: IGenerator[] = [];
    try {
        generators = (await collectGenerators(rootPackage))
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
    const rootPackage: IPackage = loadRootPackage(rootPath);
    let generators: IGenerator[] = [];
    try {
        generators = await collectGenerators(rootPackage);
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
    saveCollection(rootPackage.path, collections);
    return collections;
}
