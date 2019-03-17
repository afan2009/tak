'use strict';

// const config = require('../config')       // 配置

// 要求用户登录
function isLogin(req, res, next) {
  next()
}



module.exports = {
  isLogin: isLogin,
};
