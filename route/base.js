const express = require('express');
const _ = require('lodash');
const util = require('../utils')
const auth = require('../middleware/auth')
const controllerSession = require('../controller/session')

const route = express.Router();
// route.get('/', (req, res) => {
//     res.reply('Hola!');
// })

var list=[
    { path: '/login', method: 'get',func: 'get',middlewares:[] },
]

util.buildRoute(list,route,controllerSession)

exports.route=route
