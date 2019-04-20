import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as gitBranch from 'git-branch';
import * as gitconfig from 'gitconfiglocal';
import { basename, dirname, join, resolve } from 'path';
import * as recursive from 'recursive-readdir';
import { promisify } from 'util';
import normalizePackageData = require('normalize-package-data');
const getPkgRepo = require('get-pkg-repo');
const url = require('url');
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
    } | string;
    dependencies: {
        [key: string]: string
    };
    devDependencies: {
        [key: string]: string
    };
    parsedRepositoryData?: {
        gitConfig?: { url: string, branch: string } | undefined;
        host: string;
        owner: string;
        repository: string;
        repoUrl: string;
        branch: string;
    };
}
export interface IGeneratorProperty {
    description: string;
    type: string;
    $default?: {
        $source: 'argv';
        index: number;
    };
    default?: string;
    ['x-prompt']: string;
    hidden: boolean;
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
export async function collectGenerator(rootPackage: IPackage, path: string): Promise<IGenerator> {
    const generator: IGenerator = await loadGenerator(rootPackage, path);
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
export async function loadRootPackage(rootPath: string, activeBranch?: string): Promise<IPackage | undefined> {
    const path = ((rootPath && existsSync(join(process.cwd(), rootPath))) ? join(process.cwd(), rootPath) : rootPath) || process.cwd();
    let packageData: IPackage | undefined;
    packageData = undefined;
    try {
        packageData = await normalizePackage(
            {
                ...JSON.parse(readFileSync(join(path, 'package.json')).toString()),
                path
            },
            activeBranch
        );
        const repositoryFromGitConfig = Boolean(packageData.parsedRepositoryData && packageData.parsedRepositoryData.gitConfig);
        let localPath = '/';
        if (repositoryFromGitConfig) {
            let gitFolder: string | undefined;
            try {
                gitFolder = await findGitFolder(path);
            } catch (error) {
                gitFolder = undefined;
            }
            if (gitFolder) {
                localPath = path.replace(gitFolder, '');
                if (localPath === '') {
                    localPath = '/';
                }
            }
        }
        return {
            ...packageData,
            path: packageData.path,
            localPath: localPath,
            gitPath: packageData.parsedRepositoryData && packageData.parsedRepositoryData.repository
        };
    } catch (error) {
        console.error(error);
        return packageData;
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
export async function loadGenerator(rootPackage: IPackage, path: string): Promise<IGenerator> {
    const schema: IGenerator = JSON.parse(readFileSync(path).toString());
    let title = (schema.title || schema.id || '').replace(new RegExp('-', 'g'), ' ');
    if (!schema.title && title.length > 0) {
        title = title.charAt(0).toUpperCase() + title.substr(1);
    }
    const name = title.replace(new RegExp(' ', 'g'), '-').toLowerCase();
    const gitFolder = await findGitFolder(path);
    const branch = rootPackage.parsedRepositoryData && rootPackage.parsedRepositoryData.branch;
    const gitConfig = rootPackage.parsedRepositoryData && rootPackage.parsedRepositoryData.gitConfig;
    const localPath = resolve(path).replace(
        resolve(
            join((gitConfig && gitFolder) || rootPackage.path, rootPackage.localPath, 'src')
        ),
        ''
    );
    return {
        name,
        path,
        localPath,
        gitPath: `${rootPackage.gitPath || ''}/${join('blob', branch || 'master', rootPackage.localPath, 'src', localPath || '')}`,
        ...schema,
        title: title,
        description: (schema.description || '')
    };
}

export function collectGenerators(rootPackage: IPackage): Promise<IGenerator[]> {
    return new Promise((resolve, reject) =>
        recursive(join(rootPackage.path, 'src'), ['!*schema.json'], async (err, files) => {
            if (err || !Array.isArray(files)) {
                reject(err);
            } else {
                const generators: IGenerator[] = (
                    await Promise.all(
                        files.map(file =>
                            collectGenerator(rootPackage, file)
                        )
                    )
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
    const seeCode = (existsSync(generator.path.replace('schema.json', 'index.ts')) && generator.localPath && generator.gitPath) ? `
_See code: [src${
        generator.localPath.split('\\').join('/').replace('schema.json', 'index.ts')
        }](${
        generator.gitPath.split('\\').join('/').replace('schema.json', 'index.ts')
        })_` : '';
    return `## ${generator.title}
${
        [generator.description,
            exampleMarkdown,
            parametrsMarkdown,
            dependenciesMarkdown,
            devDependenciesMarkdown,
            seeCode
        ]
            .filter(text => Boolean(text))
            .join('\n')
        }`;

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
                const version = generator[dependenciesType][key]
                    .split('=').join('')
                    .split('<').join('')
                    .split('>').join('')
                    .split('~').join('')
                    .split('^').join('')
                    .split('-').join('--');
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
            const argv_values: string[] = [];
            const named_values: string[] = [];
            Object.keys(generator.properties)
                .filter(key => {
                    const property: IGeneratorProperty = generator.properties[key];
                    if (
                        property &&
                        !property.hidden &&
                        property.$default !== undefined
                    ) {
                        return property.$default.$source === 'argv';
                    }
                })
                .forEach(key => {
                    const value = `argvvalue${argv_values.length + 1}`;
                    argv_values.push(
                        `${value}`
                    );
                });
            Object.keys(generator.properties)
                .filter(propertyKey => !generator.properties[propertyKey].hidden &&
                    generator.properties[propertyKey].$default === undefined &&
                    generator.properties[propertyKey].default === undefined)
                .forEach(key => {
                    const value = `namedvalue${named_values.length + 1}`;
                    named_values.push(
                        `--${key} ${value}`
                    );
                });
            const args = [
                generator.id,
                ...argv_values,
                ...named_values
            ];
            exampleMarkdown = `
Example:
\`\`\`bash
schematics ${rootPackage.name}:${args.join(' ')}
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

# Install
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
export async function transformGeneratorsToMarkdown(rootPath: string, activeBranch?: string): Promise<IGenerator[]> {
    let generators: IGenerator[] = [];
    const rootPackage: IPackage | undefined = await loadRootPackage(rootPath, activeBranch);
    if (rootPackage) {
        const rootReadme: string = loadRootReadme(rootPackage);
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
            saveRootReadme(rootPackage.path, newContent);
        } else {
            const newContent = rootReadme.replace(
                rootReadme,
                [before + START_GENERATORS, newReadme, STOP_GENERATORS].join('\n')
            );
            saveRootReadme(rootPackage.path, newContent);
        }
    } else {
        console.error(`Not founded package.json`);
    }
    return generators;
}
export async function transformGeneratorsToCollections(rootPath: string, activeBranch?: string): Promise<ICollection> {
    const collections: ICollection = {
        $schema: './node_modules/@angular-devkit/schematics/collection-schema.json',
        schematics: {}
    };
    const rootPackage: IPackage | undefined = await loadRootPackage(rootPath, activeBranch);
    let generators: IGenerator[] = [];
    if (rootPackage) {
        try {
            generators = await collectGenerators(rootPackage);
        } catch (error) {
            console.error(error);
        }
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
    } else {
        console.error(`Not founded package.json`);
    }
    return collections;
}
export async function normalizePackage(rootPackage: IPackage, activeBranch?: string) {
    let gitRemoteOriginUrlValue = '';
    let gitConfig: { url: string, branch: string } | undefined;
    gitConfig = undefined;
    if (
        !rootPackage.repository ||
        (typeof rootPackage.repository !== 'string' && !rootPackage.repository.url)
    ) {
        try {
            gitConfig = await getGitconfig(rootPackage.path, activeBranch);
            gitRemoteOriginUrlValue = gitConfig.url;
        } catch (err) {
            gitRemoteOriginUrlValue = '';
        }
    }
    if (gitRemoteOriginUrlValue !== '') {
        rootPackage.repository = {
            type: 'git',
            url: gitRemoteOriginUrlValue
        };
        normalizePackageData(rootPackage);
    }
    let repo;
    try {
        repo = getPkgRepo(rootPackage);
    } catch (err) {
        repo = {};
    }
    if (repo.browse) {
        const browse = repo.browse();
        const parsedBrowse = url.parse(browse);
        rootPackage.parsedRepositoryData = {
            gitConfig: gitConfig,
            host: (repo.domain ? (parsedBrowse.protocol + (parsedBrowse.slashes ? '//' : '') + repo.domain) : null) || '',
            owner: repo.user || '',
            repoUrl: repo.project,
            repository: browse,
            branch: (gitConfig && gitConfig.branch) || 'master'
        };
    }
    if (!rootPackage.name) {
        rootPackage.name = basename(rootPackage.path);
    }
    return rootPackage;
}
export async function getGitconfig(cwd = process.cwd(), activeBranch?: string) {
    const pGitconfig = promisify<any>(
        (dir: string, cb: any) =>
            gitconfig(dir, {}, cb)
    );
    const config: any = await pGitconfig(cwd);
    const url = config && config.remote.origin && config.remote.origin.url;
    const branch = activeBranch || (config && config.branch && Object.keys(config.branch)[0]);
    let detectedBranch = branch;
    if (!url) {
        throw new Error('Couldn\'t find origin url');
    }
    if (!activeBranch) {
        try {
            detectedBranch = await gitBranch(cwd);
        } catch (error) {
            detectedBranch = branch;
        }
    }
    return {
        url,
        branch: detectedBranch
    };
}
export async function findGitFolder(dir: string): Promise<string | undefined> {
    const folder = resolve(dir, process.env.GIT_DIR || '.git', 'config');
    const exists = existsSync(folder);
    if (exists) {
        return await dir;
    }
    if (dir === resolve(dir, '..')) {
        return await undefined;
    }
    try {
        return await findGitFolder(resolve(dir, '..'));
    } catch (error) {
        return await undefined;
    }
}
