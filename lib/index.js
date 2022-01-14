import RemoteLS from './remote-ls.js';
import cfg from './config.js';

export function config(opts) {
  return cfg(opts)
}

export function ls(name, version, flatten, cb) {
  const ls = new RemoteLS();

  if (typeof version === 'function') {
    cb = version
    version = 'latest'
  }

  if (typeof flatten === 'function') {
    cb = flatten
    flatten = false
  }

  ls.ls(name, version, () => {
    if (flatten) cb(Object.keys(ls.flat))
    else cb(ls.tree)
  })
}
