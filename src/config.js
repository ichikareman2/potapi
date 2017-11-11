'use strict'

let os = require('os')
let path = require('path')

module.exports = {
    uploadDestination: path.join(os.homedir(), 'uploads')
}