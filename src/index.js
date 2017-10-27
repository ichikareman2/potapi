let express = require('express')
let path = require('path')
let formidable = require('formidable')
let fs = require('fs')
let cors = require('cors')

let util = require('util')

let readdir = util.promisify(fs.readdir)
// let stat = util.promisify(fs.stat)

let app = express();
//config
let conf = require('./config.js')

app.use(cors());
app.post('/upload', (req, res) => {
    let destination = conf.uploadDestination;
    let form = new formidable.IncomingForm();
    form.multiples = true;
    // form.uploadDir = path.join(__dirname, '/uploads');

    let destinationCreated = new Promise((res, rej) => {
        fs.mkdir(destination, (err) => {
            if (err) {
                if (err.code === 'EEXIST') {
                    res();
                }
                else {
                    rej();
                }
            }
            res()
        })
    })

    form.uploadDir = destination;
    form.on('file', (field, file) => {
        fs.rename(file.path, path.join(form.uploadDir, file.name), (err) => {
            if (err) {
                fs.unlink(file.path)
                res.end(`error \n ${err}`)
            }
        })
    });

    form.on('error', (err) => {
        console.error(`An error has occured: \n ${err}`)
    });
    form.on('end', () => {
        res.end('success')
    });
    destinationCreated.then((v) => {
        form.parse(req)
    }, (err) => {
        res.end(`error \n ${err}`)
    })
})

app.get('/browse/:dirPath?', (req, res) => {
    let destination = conf.uploadDestination;
    let dirPath = req.params.dirPath ? req.params.dirPath.replace(/\.\./g, "") : "";
    let rootConPath = path.join(destination, dirPath)

    let dir = readdir(rootConPath);
    dir.then((dirFiles) => {
        let dirStatPromises = dirFiles.map(x => {
            return stat(path.join(rootConPath, x))
        })
        Promise.all(dirStatPromises).then(dirStats => {
            res.send(dirStats)
        })
        .catch(err => console.log(err))
    }).catch(err => {
        if (err.code === 'ENOTDIR') {
            res.status(400).end()
        }
        else {
            console.error(err)
            res.status(500).end();
        }
    })
})

app.get('/download/:filename', (req, res) => {
    let destination = conf.uploadDestination;
    let filename = req.params.filename
    let filePath = path.join(destination, filename)

    res.download(filePath, (err) => {
        if (err) {
            console.error(`error happened: \n ${err}`)
            res.status(404).end();
        }
    });
})

app.get('/test/:dirPath?', (req, res) => {
    let destination = conf.uploadDestination;
    let dirPath = req.params.dirPath ? req.params.dirPath.replace(/\.\./g, "") : "";
    let rootConPath = path.join(destination, dirPath)

    res.send({
        rootConPath,
        dirPath
    })
})

function stat(filePath) {
    return new Promise((res, rej) => {
        fs.stat(filePath, (err, stat) => {
            if (err) rej(err);
            else res({
                isFile: stat.isFile(),
                size: stat.size === 0 ? stat.size : stat.size / 1024,
                file: path.basename(filePath),
                path: filePath
            })
        })
    })

}

// function readdir (dir) {
//     return new Promise((res,rej) => {
//         fs.readdir(dir, (err, files) => {
//             if(err) rej(err);
//             else res(files)
//         })
//     })
// }

app.listen(3000, () => {
    console.log('Server listens to 3000')
})