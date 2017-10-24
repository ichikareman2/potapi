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

app.get('/browse', (req, res) => {
    let destination = conf.uploadDestination;


    let dir = readdir(destination);
    dir.then((dirFiles) => {
        let dirStatPromises = dirFiles.map(x => {
            return stat(path.join(destination, x))
        })
        Promise.all(dirStatPromises).then(dirStats => {
            res.send(dirStats)
        })
    }).catch(err => {
        console.error(err)
    })

    // // let dirStat = dir.map(x => {
    // //     let st = stat(path.join(destination, x))
    // // })
    // // let stats = Promise.all(dirStat)
    // // res.send(stats)
    // readdir(destination).then((files) => {
    //     let stats = files.map((x, i) => {
    //         let filepath = path.join(destination, x)
    //         stat(filepath).then((fileStat) => {


    //             fileStat.isFile()
    //         })
    //     })
    // })



    // fs.readdir(destination, (err, files) => {
    //     let dirData = files.map((x, i) => {
    //         let filepath = path.join(destination, x)
    //         fs.stat(filepath, (err, y) => {

    //         })
    //     })
    //     if (err) {
    //         console.error(`An error has occured: \n ${err}`);
    //     }
    //     else {
    //         res.send(dirData)
    //     }
    // })
})

function stat(filePath) {
    return new Promise((res, rej) => {
        fs.stat(filePath, (err, stat) => {
            if (err) rej(err);
            else res({ 
                isFile: stat.isFile(), 
                size: stat.size === 0 ? stat.size : stat.size / 1024,
                file: path.basename(filePath), 
                path: filePath })
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