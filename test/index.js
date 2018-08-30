const tape = require('tape')
const hyperdrive = require('hyperdrive')
const yauzl = require('yauzl')
const tempy = require('tempy')
const fs = require('fs')
const path = require('path')
const concat = require('concat-stream')
const pda = require('pauls-dat-api')
const toZipStream = require('../')

function readFile (name) {
  return fs.readFileSync(path.join(__dirname, name), 'utf8')
}

tape('creates a valid zip archive', async t => {
  var archive = hyperdrive(tempy.directory())
  await new Promise(archive.ready)
  await pda.writeFile(archive, 'hello.txt', readFile('hello.txt'), 'utf8')
  await pda.writeFile(archive, 'log.js', readFile('log.js'), 'utf8')
  await pda.mkdir(archive, 'dir')
  await pda.writeFile(archive, 'dir/hello.txt', readFile('dir/hello.txt'), 'utf8')

  toZipStream(archive).pipe(concat(zipBuf => {

    yauzl.fromBuffer(zipBuf, (err, zip) => {
      if (err) throw err
      getAllEntries(zip, entries => {
        t.equal(Object.keys(entries).length, 3)
        t.ok(entries['hello.txt'])
        t.ok(entries['log.js'])
        t.ok(entries['dir/hello.txt'])
        t.end()
      })
    })

  }))
})

tape('creates a valid zip archive from subfolders', async t => {
  var archive = hyperdrive(tempy.directory())
  await new Promise(archive.ready)
  await pda.writeFile(archive, 'hello.txt', readFile('hello.txt'), 'utf8')
  await pda.writeFile(archive, 'log.js', readFile('log.js'), 'utf8')
  await pda.mkdir(archive, 'dir')
  await pda.writeFile(archive, 'dir/hello.txt', readFile('dir/hello.txt'), 'utf8')

  toZipStream(archive, '/dir').pipe(concat(zipBuf => {

    yauzl.fromBuffer(zipBuf, (err, zip) => {
      if (err) throw err
      getAllEntries(zip, entries => {
        t.equal(Object.keys(entries).length, 1)
        t.ok(entries['hello.txt'])
        t.end()
      })
    })

  }))
})

tape('creates a valid zip archive from an empty archives', async t => {
  var archive = hyperdrive(tempy.directory())
  await new Promise(archive.ready)

  toZipStream(archive).pipe(concat(zipBuf => {

    yauzl.fromBuffer(zipBuf, (err, zip) => {
      if (err) throw err
      getAllEntries(zip, entries => {
        t.equal(Object.keys(entries).length, 0)
        t.end()
      })
    })

  }))
})

function getAllEntries (zip, cb) {
  var entries = {}
  zip.on('entry', entry => {
    entries[entry.fileName] = entry
  })
  zip.on('end', () => cb(entries))
}