fake-generators
===============

Fake generator for test

<!-- generators -->

* [Install](#install)
* [Usage](#usage)
* [Available generators](#available-generators)

# Installation
```bash
npm install -g @angular-devkit/schematics-cli
npm install --save-dev fake-generator
```

# Usage
```bash
schematics fake-generator:<generator name> <arguments>
```

# Available generators
* [generator 3](#generator-3) - generator-3
* [Generator 2](#generator-2) - Description for generator 2
* [Generator 1](#generator-1) - Description for generator 1
## generator 3


Example:
```bash
schematics fake-generator:generator-3
```

### Parameters
| Name | Type | Description | Default |
|------|:----:|------------:|--------:|
| with-default | {string} | With default. | "." |
| with-named | *required* {string} | With named | none |



## Generator 2
Description for generator 2

Example:
```bash
schematics fake-generator:generator-2 --with-default . --with-named name
```

### Parameters
| Name | Type | Description | Default |
|------|:----:|------------:|--------:|
| with-default | {string} | With default. | "." |
| with-named | *required* {string} | With named | none |

### Dependencies
| Name | Used | Current |
| ------ | ------ | ------ |
| [typescript](https://www.npmjs.com/package/key) | [![NPM version](https://img.shields.io/badge/npm_package-3.3.3-9cf.svg)](https://www.npmjs.com/package/key) | [![NPM version](https://badge.fury.io/js/typescript.svg)](https://www.npmjs.com/package/key) |

### Dev dependencies
| Name | Used | Current |
| ------ | ------ | ------ |
| [tslint](https://www.npmjs.com/package/key) | [![NPM version](https://img.shields.io/badge/npm_package-5.5.5-9cf.svg)](https://www.npmjs.com/package/key) | [![NPM version](https://badge.fury.io/js/tslint.svg)](https://www.npmjs.com/package/key) |

## Generator 1
Description for generator 1

Example:
```bash
schematics fake-generator:generator-1 argv0 --with-default . --with-named name
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
| [typescript](https://www.npmjs.com/package/key) | [![NPM version](https://img.shields.io/badge/npm_package-1.1.1-9cf.svg)](https://www.npmjs.com/package/key) | [![NPM version](https://badge.fury.io/js/typescript.svg)](https://www.npmjs.com/package/key) |

### Dev dependencies
| Name | Used | Current |
| ------ | ------ | ------ |
| [tslint](https://www.npmjs.com/package/key) | [![NPM version](https://img.shields.io/badge/npm_package-2.2.2-9cf.svg)](https://www.npmjs.com/package/key) | [![NPM version](https://badge.fury.io/js/tslint.svg)](https://www.npmjs.com/package/key) |

<!-- generatorsstop -->

# License

MIT