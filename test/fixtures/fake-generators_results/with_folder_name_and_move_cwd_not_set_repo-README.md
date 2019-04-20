fake-generators
===============

Fake generators for test

<!-- generators -->

* [Install](#install)
* [Usage](#usage)
* [Available generators](#available-generators)

# Install
```bash
npm install -g @angular-devkit/schematics-cli
npm install --save-dev fake-generators
```

# Usage
```bash
schematics fake-generators:<generator name> <arguments>
```

# Available generators
* [Generator 1](#generator-1) - Description for generator 1
* [Generator 2](#generator-2) - Description for generator 2
* [Generator 4](#generator-4) - generator-4
* [Generator 6](#generator-6) - generator-6
## Generator 1
Description for generator 1

Example:
```bash
schematics fake-generators:generator-1 argv0 --with-default . --with-named name
```

### Parameters
| Name | Type | Description | Default |
|------|:----:|------------:|--------:|
| with-default-argv | {string} | With default argv. | {"$source":"argv","index":0} |
| with-default | {string} | With default. | "." |
| with-named | *required* {string} | With named | none |

### Dependencies
| Name | Used | Current |
| ------ | ------ | ------ |
| [typescript](https://www.npmjs.com/package/typescript) | [![NPM version](https://img.shields.io/badge/npm_package-1.1.1-9cf.svg)](https://www.npmjs.com/package/typescript) | [![NPM version](https://badge.fury.io/js/typescript.svg)](https://www.npmjs.com/package/typescript) |
| [@angular/core](https://www.npmjs.com/package/@angular/core) | [![NPM version](https://img.shields.io/badge/npm_package-3.0.0-9cf.svg)](https://www.npmjs.com/package/@angular/core) | [![NPM version](https://badge.fury.io/js/%40angular%2Fcore.svg)](https://www.npmjs.com/package/@angular/core) |
| [react](https://www.npmjs.com/package/react) | [![NPM version](https://img.shields.io/badge/npm_package-0.0.1-9cf.svg)](https://www.npmjs.com/package/react) | [![NPM version](https://badge.fury.io/js/react.svg)](https://www.npmjs.com/package/react) |
| [vue](https://www.npmjs.com/package/vue) | [![NPM version](https://img.shields.io/badge/npm_package-0.0.2-9cf.svg)](https://www.npmjs.com/package/vue) | [![NPM version](https://badge.fury.io/js/vue.svg)](https://www.npmjs.com/package/vue) |

### Dev dependencies
| Name | Used | Current |
| ------ | ------ | ------ |
| [tslint](https://www.npmjs.com/package/tslint) | [![NPM version](https://img.shields.io/badge/npm_package-2.2.2-9cf.svg)](https://www.npmjs.com/package/tslint) | [![NPM version](https://badge.fury.io/js/tslint.svg)](https://www.npmjs.com/package/tslint) |
| [eslint](https://www.npmjs.com/package/eslint) | [![NPM version](https://img.shields.io/badge/npm_package-9.9.9-9cf.svg)](https://www.npmjs.com/package/eslint) | [![NPM version](https://badge.fury.io/js/eslint.svg)](https://www.npmjs.com/package/eslint) |
| [@angular/cli](https://www.npmjs.com/package/@angular/cli) | [![NPM version](https://img.shields.io/badge/npm_package-./files/package.json-9cf.svg)](https://www.npmjs.com/package/@angular/cli) | [![NPM version](https://badge.fury.io/js/%40angular%2Fcli.svg)](https://www.npmjs.com/package/@angular/cli) |

_See code: [src/generator-1/index.ts](https://github.com/EndyKaufman/schematics-readme/blob/master/test/fixtures/fake-generators/src/generator-1/index.ts)_

## Generator 2
Description for generator 2

Example:
```bash
schematics fake-generators:generator-2 --with-default . --with-named name
```

### Parameters
| Name | Type | Description | Default |
|------|:----:|------------:|--------:|
| with-default | {string} | With default. | "." |
| with-named | *required* {string} | With named | none |

### Dependencies
| Name | Used | Current |
| ------ | ------ | ------ |
| [typescript](https://www.npmjs.com/package/typescript) | [![NPM version](https://img.shields.io/badge/npm_package-3.3.3-9cf.svg)](https://www.npmjs.com/package/typescript) | [![NPM version](https://badge.fury.io/js/typescript.svg)](https://www.npmjs.com/package/typescript) |

### Dev dependencies
| Name | Used | Current |
| ------ | ------ | ------ |
| [tslint](https://www.npmjs.com/package/tslint) | [![NPM version](https://img.shields.io/badge/npm_package-5.5.5-9cf.svg)](https://www.npmjs.com/package/tslint) | [![NPM version](https://badge.fury.io/js/tslint.svg)](https://www.npmjs.com/package/tslint) |
| [jest](https://www.npmjs.com/package/jest) | [![NPM version](https://img.shields.io/badge/npm_package-5.5.5-9cf.svg)](https://www.npmjs.com/package/jest) | [![NPM version](https://badge.fury.io/js/jest.svg)](https://www.npmjs.com/package/jest) |

## Generator 4

Example:
```bash
schematics fake-generators:generator-4 --with-named namedvalue1
```

### Parameters
| Name | Type | Description | Default |
|------|:----:|------------:|--------:|
| with-default | {string} | With default. | "." |
| with-named | *required* {string} | With named | none |

## Generator 6

Example:
```bash
schematics fake-generators:generator-6 argvvalue1 --with-named namedvalue1
```

### Parameters
| Name | Type | Description | Default |
|------|:----:|------------:|--------:|
| with-default-argv | {string} | With default argv. | {"$source":"argv","index":0} |
| with-default | {string} | With default. | "." |
| with-named | *required* {string} | With named | none |

_See code: [src/generator-6/index.ts](https://github.com/EndyKaufman/schematics-readme/blob/master/test/fixtures/fake-generators/src/generator-6/index.ts)_

<!-- generatorsstop -->

# License

MIT