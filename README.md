[![deprecated](http://badges.github.io/stability-badges/dist/deprecated.svg)](https://dat-ecosystem.org/) 

More info on active projects and modules at [dat-ecosystem.org](https://dat-ecosystem.org/) <img src="https://i.imgur.com/qZWlO1y.jpg" width="30" height="30" /> 

---

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
