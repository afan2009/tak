
require('dotenv').config();         //加载环境变量

var express = require('express');       // express框架
var morgan = require('morgan')           // 中间件记录功能
var bodyParser = require('body-parser')          //http请求体解析组件
var app = express();

var config = require('../config')       // 配置
var middleware = require('../middleware/base.js')       // 请求状态中间件
var route = require('../route/base.js')       // 路由
var utils = require('../utils/index.js')       // 路由
const fs = require('fs')
const mime = require('mime')
const path = require('path')
const url = require('url')

const https = require('https');

global.jsapi_ticket = null;



//添加所有请求的中间件
app.all('*', function (req, res, next) {
    // 设置cors
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', "POST, GET, OPTIONS, DELETE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Credentials', 'true');  // 允许发送Cookie数据
    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
});

//中间件记录日志
app.use(morgan('dev'))

app.use(bodyParser.json())   //解析application/json

//添加请求状态中间件
app.use(middleware.reply)    //自定义中间件

//路由api
app.use(config.apiPath, route.route);

//wx验证
app.use('/wx', function(req,res,next){
    var query = url.parse(req.url,true).query;
	var signature = query.signature;
	var timestamp = query.timestamp;
	var nonce = query.nonce;
	var echostr = query.echostr;
	if(utils.check(timestamp,nonce,signature,"weixinCourse123456")){
		res.send(echostr);
	}else{
		res.send("It is not from weixin");
	}
});

//首页
app.use('/', function(req,res,next){
    if(req.path==='/'){
        fs.readFile('web/index.html', function (err, data) {
            if (err) {
                next()
            }else{             
                res.header({'Content-Type': 'text/html'});   
                res.send(data.toString());
            }
         });
    }else{
        fs.readFile('web'+req.path, function (err, data) {
            if (err) {
                next()
            }else{             
                res.header({'Content-Type': mime.getType(path.basename(req.path))});   
                res.send(data);
            }
         });
    }
});

//调取微信api
app.use('/wechartApi', function(req,res,next){
    if(req.path==='/getToken'){
        if(global.jsapi_ticket){
            res.send(utils.encryption({
                'jsapi_ticket':JSON.parse(global.jsapi_ticket.toString()).ticket,
                'noncestr':utils.RandomString(),
                'timestamp':Date.parse(new Date())/1000,
                'url':config.urls
            }))
        }else{
            https.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+config.weChartAppid+'&secret='+config.weChartSecret, (_) => {
                _.on('data', (d) => {
                    d=JSON.parse(d.toString())
                    if(d.access_token){
                        https.get('https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token='+d.access_token+'&type=jsapi', (_) => {
                            _.on('data', (data) => {
                                global.jsapi_ticket = data
                                data=JSON.parse(data.toString())
                                setTimeout(function(){
                                    if(data.ticket==JSON.parse(global.jsapi_ticket.toString()).ticket){
                                        global.jsapi_ticket = null
                                    }
                                },data.expires_in)
                                res.send(utils.encryption({
                                    'jsapi_ticket':data.ticket,
                                    'noncestr':utils.RandomString(),
                                    'timestamp':Date.parse(new Date())/1000,
                                    'url':config.urls
                                }))
                            });
                        }).on('error', (e) => {
                            res.send(e)
                        });
                    }else{
                        res.replyError('错误')
                    }
                });
            }).on('error', (e) => {
                res.send(e)
            });
        }
    }
});


// 错误处理
app.use(middleware.notFound);
app.use(middleware.error);        //错误中间件，当参数为4个时，会被express视为错误处理中间件

app.listen(config.servicePort, function (req, res) {
  console.log('app is running at port '+config.servicePort);
});