let express = require('express')
let path = require('path')
let os = require('os')
let formidable = require('formidable')
let fs = require('fs')
let cors = require('cors')

let util = require('util')

let readdir = util.promisify(fs.readdir)
// let stat = util.promisify(fs.stat)

let app = express();
//config
let conf = require('./config.js')

const TEMPDIRNAME = 'pot-temp'

app.use(cors());
app.post('/upload/:dirPath?', (req, res) => {
    let destination = conf.uploadDestination;
    let dirPath = req.params.dirPath ? req.params.dirPath.replace(/\.\./g, "") : "";
    let rootConPath = path.join(destination, dirPath)
    // let rootConTemp = path.join(destination, TEMPDIRNAME)

    let form = new formidable.IncomingForm();
    form.multiples = true;
    // form.uploadDir = path.join(__dirname, '/uploads');

    // form.uploadDir = rootConTemp;
    form.on('file', (field, file) => {
        fs.rename(file.path, path.join(rootConPath, file.name), (err) => {
            if (err) {
                fs.unlink(file.path)
                res.end(`error \n ${err}`)
            }
        })
    });

    form.on('error', (err) => {
        res.status(500).end();
        console.error(`An error has occured: \n ${err}`)
    });
    form.on('end', () => {
        res.end('success')
    });
    form.parse(req)
    // destinationCreated.then((v) => {
    //     form.parse(req)
    // }, (err) => {
    //     res.end(`error \n ${err}`)
    // })
})

app.get('/browse/:dirPath?', (req, res) => {
    let destination = conf.uploadDestination;
    let dirPath = req.params.dirPath ? req.params.dirPath.replace(/\.\./g, "") : "";
    let rootConPath = path.join(destination, dirPath)

    let dir = readdir(rootConPath);
    dir.then((dirFiles) => {
        let dirStatPromises = dirFiles.map(x => {
            return stat(rootConPath, x)
        })
        Promise.all(dirStatPromises).then(dirStats => {
            res.send(dirStats)
        })
            .catch(err => console.log(err))
    }).catch(err => {
        if (err.code === 'ENOTDIR') {
            console.error(err)
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

function stat(pathString, fileName) {
    return new Promise((res, rej) => {
        let filePath = path.join(pathString, fileName)
        fs.stat(filePath, (err, stat) => {
            if (err) rej(err);
            else res({
                isFile: stat.isFile(),
                size: stat.size === 0 ? stat.size : stat.size / 1024,
                file: fileName
            })
        })
    })

}

function preStartup(startup) {
    let createRoot = new Promise((res, rej) => {
        fs.mkdir(conf.uploadDestination, err => {
            if (err) {
                if (err.code !== 'EEXIST') {
                    return rej(err)
                }
            }
            return res()
        })
    });
    // let createTemporaryFilesFolder = createRoot.then((res) => {
    //     return new Promise((res, rej) => {
    //         let tempDirName = path.join(conf.uploadDestination, TEMPDIRNAME)
    //         fs.mkdir(tempDirName, err => {
    //             if (err) {
    //                 if (err.code !== 'EEXIST') {
    //                     return rej(err)
    //                 }
    //             }
    //             return res()
    //         })
    //     })
    // });
    // return [createRoot, createTemporaryFilesFolder]
    return [createRoot]
}
// function readdir (dir) {
//     return new Promise((res,rej) => {
//         fs.readdir(dir, (err, files) => {
//             if(err) rej(err);
//             else res(files)
//         })
//     })
// }
let prestart = preStartup()

Promise.all(prestart)
.then((results) => {
    app.listen(3000, () => {
        console.log(`destination set to ${conf.uploadDestination}`)
        console.log('Server listens to 3000')
    })
}, err => {
    console.error(err)
})
