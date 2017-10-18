let express = require('express')
let path = require('path')
let formidable = require('formidable')
let fs = require('fs')
let cors = require('cors')



let app = express();
//config
let conf = require('./config.js')

app.use(cors());
app.post('/upload', (req, res) => {
    let destination = conf.uploadDestination;
    let form = new formidable.IncomingForm();
    form.multiples = true;
    // form.uploadDir = path.join(__dirname, '/uploads');

    let destinationCreated = new Promise((res,rej) => {
        fs.mkdir(destination, (err) => {
            if(err) {
                if(err.code === 'EEXIST') {
                    res();
                }
                else{
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
    fs.readdir(destination, (err, files) => {
        if (err) {
            console.error(`An error has occured: \n ${err}`);
        }
        else {
            res.send(files)
        }
    })
})

app.listen(3000, () => {
    console.log('Server listens to 3000')
})