var express = require('express');
var router = express.Router();
var apiproxy = require('../apiproxy')

var resourceId = process.env.DJANGO_RESOURCE_ID
var apiUrl = process.env.DJANGO_API_URL


router.param('id', function(req, res, next, id) {
  req.itemId = id
  next()
})


router.all('/:id?', new apiproxy(resourceId, apiUrl));

module.exports = router;
