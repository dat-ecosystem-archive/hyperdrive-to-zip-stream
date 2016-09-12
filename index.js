const yazl = require('yazl')
const from2 = require('from2')
const through2Concurrent = require('through2-concurrent')

module.exports = function (archive) {
  var zipfile = new yazl.ZipFile()

  // list files
  archive.list((err, entries) => {
    if (err)
      return onerror(err)

    // remove duplicates
    var entriesMap = {}
    entries.forEach(e => entriesMap[e.name] = e)
    var entriesKeys = Object.keys(entriesMap)

    // create listing stream
    var listingStream = from2.obj((size, next) => {
      if (entriesKeys.length === 0)
        return next(null, null)

      // find the next downloaded entry
      var entry
      do { entry = entriesMap[entriesKeys.shift()] }
      while (entry && !isEntryDownloaded(archive, entry))
      next(null, entry || null)
    })

    // create the writestream
    var zipWriteStream = listingStream
      .pipe(through2Concurrent.obj({ maxConcurrency: 3 }, (entry, enc, cb) => {
        // files only
        if (entry.type != 'file')
          return cb()

        // pipe each entry into the zip
        var fileReadStream = archive.createFileReadStream(entry)
        zipfile.addReadStream(fileReadStream, makePathRelative(entry.name))
        fileReadStream.on('error', onerror)
        fileReadStream.on('end', cb)
      }))
    zipWriteStream.on('data', ()=>{})
    zipWriteStream.on('error', onerror)
    zipWriteStream.on('end', () => {
      zipfile.end()
    })
  })

  // on error, push to the output stream
  function onerror (e) {
    zipfile.outputStream.emit('error', e)
  }

  return zipfile.outputStream
}

function makePathRelative (path) {
  return path.replace(/^\//, '')
}

function isEntryDownloaded (archive, entry) {
  var offset = entry.content.blockOffset
  for (var i=0; i < entry.blocks; i++) {
    if (!archive.content.has(i + offset))
      return false
  }
  return true
}