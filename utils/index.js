const _ = require('lodash');

exports.buildRoute= (routeArr, router, controller) => {
    if (routeArr &&  routeArr.length) {
        _.each(routeArr, (route) => {
            router[route.method](route.path,  route.middlewares || [], (req, res) => {
                return controller[route.func](req, res);
            });
        });
    }
}