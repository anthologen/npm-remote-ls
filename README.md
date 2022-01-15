# @anthologen/npm-remote-ls

[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)

Examine a package's dependency graph before you install it.

## About
This is a fork of the now archived [npm-remote-ls](https://github.com/npm/npm-remote-ls) repo which has been edited for ESM compatibility.

## Installation

```bash
npm install @anthologen/npm-remote-ls -g
```

## Usage

### Listing Package Dependencies

```
npm-remote-ls sha@1.2.4

└─ sha@1.2.4
   ├─ readable-stream@1.0.27-1
   │  ├─ isarray@0.0.1
   │  ├─ string_decoder@0.10.25
   │  ├─ inherits@2.0.1
   │  └─ core-util-is@1.0.1
   └─ graceful-fs@3.0.2
```

### Help!

There are various command line flags you can toggle for `npm-remote-ls`, for
details run:

```bash
npm-remote-ls --help
```

## API

**Return dependency graph for `latest` version:**

```javascript
import { ls } from '@anthologen/npm-remote-ls'

ls('grunt', (obj) => console.log(obj))
ls('grunt', 'latest', (obj) => console.log(obj))
```

**Return dependency graph for specific version:**

```javascript
import { ls } from '@anthologen/npm-remote-ls'

ls('grunt', '0.1.0', (obj) => console.log(obj));
```

**Return a flattened list of dependencies:**

```javascript
import { ls } from '@anthologen/npm-remote-ls'

ls('grunt', '0.1.0', true, (obj) => console.log(obj));
```

**Configure to only return production dependencies:**

```javascript
import { ls } from '@anthologen/npm-remote-ls'

const config = {
  development: false,
  optional: false
}

ls('grunt', 'latest', false, config, (obj) => console.log(obj))
```

**Configure to return peer dependencies:**

```javascript
import { ls } from '@anthologen/npm-remote-ls'

const config = {
  development: true,
  peer: true
}

ls('grunt', 'latest', false, config, (obj) => console.log(obj))
```

## License

ISC
