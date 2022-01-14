import { test } from 'tap'
import nock from 'nock'
import fs from 'fs'
import RemoteLS from '../lib/remote-ls.js'
import chai from 'chai'
chai.should()

test('RemoteLS', t => {
  t.test('guessVersion', t => {
    t.test('should handle an exact version being provided', t => {
      const versionString = '1.0.0'
      const packageJson = JSON.parse(
        fs.readFileSync('./test/fixtures/nopt.json').toString()
      )
      const ls = new RemoteLS()

      t.equal(
        ls._guessVersion(versionString, packageJson),
        '1.0.0'
      )
      t.end()
    })

    t.test('should handle a complex version being provided', t => {
      const versionString = '*'
      const packageJson = JSON.parse(
        fs.readFileSync('./test/fixtures/nopt.json').toString()
      )
      const ls = new RemoteLS()

      t.equal(
        ls._guessVersion(versionString, packageJson),
        '3.0.1'
      )
      t.end()
    })

    t.test('should raise an exception if version cannot be found', t => {
      const versionString = '9.0.0'
      const packageJson = JSON.parse(
        fs.readFileSync('./test/fixtures/nopt.json').toString()
      )
      const ls = new RemoteLS()

      t.throws(
        () => {
          ls._guessVersion(versionString, packageJson)
        },
        /could not find a satisfactory version/
      )
      t.end()
    })

    t.test('should raise an exception if version cannot be found', t => {
      const versionString = '9.0.0'
      const packageJson = JSON.parse(
        fs.readFileSync('./test/fixtures/nopt.json').toString()
      )
      const ls = new RemoteLS()

      t.throws(
        () => {
          ls._guessVersion(versionString, packageJson)
        },
        /could not find a satisfactory version/
      )
      t.end()
    })

    t.test('should handle "latest" being provided as version', t => {
      const versionString = 'latest'
      const packageJson = JSON.parse(
        fs.readFileSync('./test/fixtures/nopt.json').toString()
      )
      const ls = new RemoteLS()

      t.equal(
        ls._guessVersion(versionString, packageJson),
        '3.0.1'
      )
      t.end()
    })

    t.test('should return dist-tags.latest when * wanted and package has only prerelease versions', t => {
      const versionString = '*'
      const packageJson = JSON.parse(
        fs.readFileSync('./test/fixtures/angular-core.json').toString()
      )
      const ls = new RemoteLS()

      t.equal(
        ls._guessVersion(versionString, packageJson),
        '2.0.0-rc.3'
      )
      t.end()
    })

    t.end()
  })

  t.test('_walkDependencies', t => {
    t.test('should push appropriate dependencies to queue', t => {
      const packageJson = JSON.parse(
        fs.readFileSync('./test/fixtures/nopt.json').toString()
      )
      const ls = new RemoteLS({
        queue: {
          pause () {},
          push ({ name, version }) {
            t.equal(name, 'abbrev')
            t.equal(version, '1')
            t.end()
          }
        }
      })

      ls._walkDependencies({
        name: 'nopt',
        version: '1.0.6',
        parent: {}
      }, packageJson, () => {})
    })

    t.test('should push devDependencies to queue', t => {
      const packageJson = JSON.parse(
        fs.readFileSync('./test/fixtures/nopt.json').toString()
      )
      const ls = new RemoteLS({
        queue: {
          pause () {},
          push ({ name, version }) {
            t.equal(name, 'tap')
            t.equal(version, '1.0.0')
            t.end()
          }
        }
      })

      ls._walkDependencies({
        name: 'nopt',
        version: '1.0.8',
        parent: ls.tree
      }, packageJson, () => {})
    })

    t.test('should not raise an exception if package has no dependencies', t => {
      const packageJson = JSON.parse(
        fs.readFileSync('./test/fixtures/abbrev.json').toString()
      )
      const ls = new RemoteLS()

      t.doesNotThrow(() => {
        ls._walkDependencies({
          name: 'abbrev',
          version: '*',
          parent: {}
        }, packageJson, () => {})
      })

      t.end()
    })

    t.test('should not walk dependency if dependency has already been observed', t => {
      const packageJson = JSON.parse(
        fs.readFileSync('./test/fixtures/nopt.json').toString()
      )
      const ls = new RemoteLS({
        flat: {
          'nopt@1.0.0': true
        },
        queue: {
          pause () {},
          push (obj) {
            t.fail('should not walk dependency')
            t.end()
          }
        }
      })

      ls._walkDependencies({
        name: 'nopt',
        version: '1.0.0',
        parent: {}
      }, packageJson, () => {})

      t.end()
    })

    t.test('should push peerDependencies to queue', t => {
      const packageJson = JSON.parse(
        fs.readFileSync('./test/fixtures/angular-core.json').toString()
      )
      const ls = new RemoteLS({
        peer: true,
        queue: {
          pause () {},
          push ({ name, version }) {
            t.equal(name, 'rxjs')
            t.equal(version, '5.0.0-beta.6')
            t.end()
          }
        }
      })

      ls._walkDependencies({
        name: 'angular',
        version: '2.0.0-rc.3',
        parent: ls.tree
      }, packageJson, () => {})
    })

    t.end()
  })

  t.test('ls', t => {
    t.test('handles a 404 and prints an appropriate message', t => {
      nock('https://skimdb.npmjs.com')
        .get('/registry/request')
        .reply(404)
      const ls = new RemoteLS({
        registry: 'https://skimdb.npmjs.com/registry/',
        logger: {
          log (msg) {
            t.match(msg, /status = 404/)
            t.end()
          }
        }
      })

      ls.ls('request', '*', () => {})
    })

    t.test('defaults to appropriate registry URL', t => {
      nock('https://registry.npmjs.org')
        .get('/request')
        .reply(404)
      const ls = new RemoteLS({
        logger: {
          log (msg) {
            t.match(msg, /status = 404/)
            t.end()
          }
        }
      })

      ls.ls('request', '*', () => {})
    })

    t.test('happy path works as expected', t => {
      const request = nock('https://registry.npmjs.org')
        .get('/request')
        .reply(200, {
          name: 'request',
          versions: {
            '0.0.1': {
              dependencies: {
                lodash: '0.0.2'
              }
            }
          }
        })
      const lodash = nock('https://registry.npmjs.org')
        .get('/lodash')
        .reply(200, {
          name: 'lodash',
          versions: {
            '0.0.2': {
              dependencies: {}
            }
          }
        })
      const ls = new RemoteLS()

      ls.ls('request', '*', ({ should }) => {
        should.deep.equal({ 'request@0.0.1': { 'lodash@0.0.2': {} } })
        request.done()
        lodash.done()
        t.end()
      })
    })

    t.test('supports scoped packages', t => {
      const storybook = nock('https://registry.npmjs.org')
        .get('/@kadira%2fstorybook')
        .reply(200, {
          name: '@kadira/storybook',
          versions: {
            '1.30.0': {
              dependencies: { '@kadira/storybook-core': '1.27.0' }
            }
          }
        })
      const storybook404 = nock('https://registry.npmjs.org')
        .get('/@kadira/storybook')
        .reply(404, {
          error: 'Not found'
        })
      const core = nock('https://registry.npmjs.org')
        .get('/@kadira%2fstorybook-core')
        .reply(200, {
          name: '@kadira/storybook-core',
          versions: {
            '1.27.0': { dependencies: {} }
          }
        })
      const core404 = nock('https://registry.npmjs.org')
        .get('/@kadira/storybook-core')
        .reply(404, {
          error: 'Not found'
        })
      const ls = new RemoteLS()

      ls.ls('@kadira/storybook', '*', ({ should }) => {
        should.deep.equal({ '@kadira/storybook@1.30.0': { '@kadira/storybook-core@1.27.0': {} } })
        storybook.done()
        core.done()
        t.notOk(storybook404.isDone())
        t.notOk(core404.isDone())
        t.end()
      })
    })

    t.end()
  })

  t.end()
})
