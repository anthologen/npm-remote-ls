import RemoteLS from './remote-ls.js';

export function ls(name, version, flatten, opts, cb) {
  if (typeof version === 'function') {
    cb = version
    version = 'latest'
  }

  if (typeof flatten === 'function') {
    cb = flatten
    flatten = false
  }

  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  
  const ls = new RemoteLS(opts);

  ls.ls(name, version, () => {
    if (flatten) cb(Object.keys(ls.flat))
    else cb(ls.tree)
  })
}
