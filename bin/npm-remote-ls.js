#!/usr/bin/env node
import Yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import registryUrl from 'registry-url'

import { ls } from '../lib/index.js'
import treeify from 'treeify'
import spinner from 'char-spinner'
import npa from 'npm-package-arg'

Yargs(hideBin(process.argv))
  .usage('$0 <pkg-name> [options]')
  .command('$0 <pkg-name>', 'list package dependencies', (yargs) => {
    yargs.positional('pkgName', {
      describe: 'package name'
    })
  }, (argv) => { listDependencies(argv) })
  .option('n', {
    alias: 'name',
    description: 'package name'
  })
  .version(false)
  .option('v', {
    alias: 'version',
    description: 'package version',
    default: 'latest'
  })
  .option('e', {
    alias: 'verbose',
    description: 'enable verbose logging',
    default: false,
    boolean: true
  })
  .option('d', {
    alias: 'development',
    description: 'show development dependencies',
    default: true,
    boolean: true
  })
  .option('o', {
    alias: 'optional',
    description: 'show optional dependencies',
    default: true,
    boolean: true
  })
  .option('p', {
    alias: 'peer',
    description: 'show peer dependencies',
    default: false,
    boolean: true
  })
  .option('r', {
    alias: 'registry',
    description: 'set an alternative registry url',
    default: registryUrl
  })
  .option('f', {
    alias: 'flatten',
    description: 'return flat representation of dependencies',
    default: false,
    boolean: true
  })
  .parse()

function listDependencies (argv) {
  spinner()
  const parsed = npa(argv.pkgName)
  const opts = {
    verbose: argv.verbose,
    development: argv.development,
    optional: argv.optional,
    peer: argv.peer,
    registry: argv.registry
  }
  ls(parsed.name, parsed.rawSpec || argv.version, argv.flatten, opts, obj => {
    if (Array.isArray(obj)) console.log(obj)
    else console.log(treeify.asTree(obj))
  })
}
