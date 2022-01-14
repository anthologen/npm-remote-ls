import _ from 'lodash';
import async from 'async';
import semver from 'semver';
import request from 'request';
import once from 'once';
import npa from 'npm-package-arg';
import registryUrl from 'registry-url';

// perform a recursive walk of a remote
// npm package and determine its dependency
// tree.
class RemoteLS {
  constructor(opts) {
    const _this = this;

    _.extend(this, {
      logger: console,
      development: true, // include dev dependencies.
      optional: true, // include optional dependencies.
      peer: false, // include peer dependencies.
      verbose: false,
      registry: registryUrl(), // URL of registry to ls.
      queue: async.queue((task, done) => {
        _this._loadPackageJson(task, done)
      }, 8),
      tree: {},
      flat: {}
    }, opts)

    this.queue.pause()
  }

  _loadPackageJson(task, done) {
    const _this = this;
    const name = task.name;

    // account for scoped packages like @foo/bar
    const couchPackageName = name && npa(name).escapedName;

    // wrap done so it's only called once
    // if done throws in _walkDependencies, it will be called again in catch below
    // we want to avoid "Callback was already called." from async
    done = once(done)

    request.get(`${this.registry.replace(/\/$/, '')}/${couchPackageName}`, {json: true}, (err, res, obj) => {
      if (err || (res.statusCode < 200 || res.statusCode >= 400)) {
        const message = res ? `status = ${res.statusCode}` : `error = ${err.message}`;
        _this.logger.log(
          `could not load ${name}@${task.version} ${message}`
        )
        return done()
      }

      try {
        if (_this.verbose) console.log('loading:', `${name}@${task.version}`)
        _this._walkDependencies(task, obj, done)
      } catch (e) {
        _this.logger.log(e.message)
        done()
      }
    })
  }

  _walkDependencies(task, packageJson, done) {
    const _this = this;
    const version = this._guessVersion(task.version, packageJson);
    const dependencies = _.extend(
      {},
      packageJson.versions[version].dependencies,
      this.optional ? packageJson.versions[version].optionalDependencies : {},
      this.peer ? packageJson.versions[version].peerDependencies : {},
      // show development dependencies if we're at the root, and deevelopment flag is true.
      (task.parent === this.tree && this.development) ? packageJson.versions[version].devDependencies : {}
    );
    const fullName = `${packageJson.name}@${version}`;
    const parent = task.parent[fullName] = {};

    if (_this.flat[fullName]) return done()
    else _this.flat[fullName] = true

    Object.keys(dependencies).forEach(name => {
      _this.queue.push({
        name,
        version: dependencies[name],
        parent
      })
    })

    done()
  }

  _guessVersion(versionString, packageJson) {
    if (versionString === 'latest') versionString = '*'

    const availableVersions = Object.keys(packageJson.versions);
    let version = semver.maxSatisfying(availableVersions, versionString, true);

    // check for prerelease-only versions
    if (!version && versionString === '*' && availableVersions.every(av => new semver.SemVer(av, true).prerelease.length)) {
      // just use latest then
      version = packageJson['dist-tags'] && packageJson['dist-tags'].latest
    }

    if (!version) throw Error(`could not find a satisfactory version for string ${versionString}`)
    else return version
  }

  ls(name, version, callback) {
    const _this = this;

    this.queue.push({
      name,
      version,
      parent: this.tree
    })

    this.queue.drain(() => {
      callback(_this.tree)
    })

    this.queue.resume()
  }
}

export default RemoteLS;