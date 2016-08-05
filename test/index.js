const tape = require('tape')
const hyperdrive = require('hyperdrive')
const yauzl = require('yauzl')
const fs = require('fs')
const memdb = require('memdb')
const path = require('path')
const raf = require('random-access-file')
const concat = require('concat-stream')
const toZipStream = require('../')

tape('creates a valid zip archive from static dats', t => {
  var drive = hyperdrive(memdb())

  var archive = drive.createArchive({
    live: false,
    file: function (name) {
      return raf(path.join(__dirname, name), {readable: true, writable: false})
    }
  })
  archive.append('hello.txt')
  archive.append('log.js')
  archive.append('dir/hello.txt')

  archive.finalize(function () {

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
})

tape('creates a valid zip archive from live dats', t => {
  var drive = hyperdrive(memdb())

  var archive = drive.createArchive({
    live: true,
    file: function (name) {
      return raf(path.join(__dirname, name), {readable: true, writable: false})
    }
  })
  archive.append('hello.txt', done)
  archive.append('log.js', done)
  archive.append('dir/hello.txt', done)

  var ndone = 3
  function done () {
    if (--ndone) return

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
  }
})

tape('creates a valid zip archive from an empty static dats', t => {
  var drive = hyperdrive(memdb())

  var archive = drive.createArchive({
    live: false,
    file: function (name) {
      return raf(path.join(__dirname, name), {readable: true, writable: false})
    }
  })

  archive.finalize(function () {

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
})

function getAllEntries (zip, cb) {
  var entries = {}
  zip.on('entry', entry => {
    entries[entry.fileName] = entry
  })
  zip.on('end', () => cb(entries))
}