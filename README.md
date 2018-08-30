# hyperdrive-to-zip-stream

Usage

```js
const toZipStream = require('hyperdrive-to-zip-stream')

toZipStream(archive, '/').pipe(fs.createWriteStream(...))
```

The output zip will only contain files that are fully downloaded.
You can specify subfolders to fetch part of the archive.

## License

MIT