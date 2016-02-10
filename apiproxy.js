var request = require('request')
var tokenService = require('./tokenservice')
var logger = require('./logger');

/**
 * API Proxy factory.
 * @param {String} resourceId
 * @param {String} apiUrl
 * @return an API Proxy instance
 */
var apiproxy = function(resourceId, apiUrl) {
    /**
     * API Proxy - catches all request below a route path, adds an oauth token and forwards the request to apiUrl
     * @param {!express.Request} req
     * @param {!express.Response} res
     * @param {function} next
     */
    return function (req, res, next) {
        logger.log('debug', 'Got frontend ' + req.method + ' request');
        var user = req.user
        tokenService.getAccessToken(user.sub, resourceId, function (token) {
            logger.log('debug', 'Got security token.');
            // We have a token - call backend service
            var options = {
                baseUrl: apiUrl,
                uri: req.itemId ? req.itemId + '/' : '',
                method: req.method,
                headers: {
                    'Authorization': 'Bearer ' + token,
                }
            }

            if (typeof(req.body) === 'string') {
                options.headers['Content-Type'] = req.headers['content-type']
                options.body = req.body
            }

            logger.log('debug', 'Sending backend ' + options.method + ' request.');

            // Uses https://www.npmjs.com/package/request
            request(options, function (error, response, body) {
                logger.log('debug', 'Got backend ' + req.method + ' response with status: ' + response.statusCode);

                switch (response.statusCode) {
                    case 401:
                        console.log("error: " + response.statusCode)
                        res.status(401);
                        res.send("Access denied in backend service.");
                        break;
                    case 500:
                        console.log("error: " + response.statusCode)
                        res.status(500);
                        res.send("Error in backend communication.");
                        break;
                    default:
                        if (typeof(response.body) === 'string' && response.body != '') {
                            res.status(response.statusCode) // Sets only status code
                            res.type(response.headers['content-type']);
                            res.send(response.body);
                        } else {
                            // Sets status code and status message in body
                            // Without a response body Express will reset status to 404
                            res.sendStatus(response.statusCode)
                        }
                }
                next()
            })
        });
    }
}

module.exports = apiproxy