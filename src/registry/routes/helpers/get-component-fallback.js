'use strict';

var request = require('minimal-request');
var url = require('url');
var urlBuilder = require('../../domain/url-builder');
var _ = require('underscore');

function getComponentFallbackForViewType(buildUrl, conf, req, res, registryError, callback) {
  var path = buildUrl({
    name: req.params.componentName,
    version: req.params.componentVersion
  }, conf.fallbackRegistryUrl);

  return request({
    method: 'get',
    url: path,
    headers: _.extend({}, req.headers, {
      'host': url.parse(conf.fallbackRegistryUrl).host,
      'accept': 'application/json'
    })
  }, function (fallbackErr, fallbackResponse) {
    if (fallbackErr === 304) {
      return res.status(304).send('');
    }

    if (fallbackErr) {
      return callback({registryError: registryError, fallbackError: fallbackErr});
    }

    try {
      return callback(null, JSON.parse(fallbackResponse));
    } catch (parseError) {
      return callback({registryError: registryError, fallbackError: 'Could not parse fallback response: ' + fallbackResponse});
    }
  });
}

module.exports = {
  getComponent: function (fallbackRegistryUrl, headers, component, callback) {
    return request({
      method: 'post',
      url: fallbackRegistryUrl,
      headers: _.extend({}, headers, {'host': url.parse(fallbackRegistryUrl).host}),
      json: true,
      body: {
        components: [
          component
        ]
      }
    }, function (err, res) {
      if (err || !res || res.length === 0) {
        return callback({
          status: 404,
          response: {
            code: 'NOT_FOUND',
            error: err
          }
        });
      }

      return callback(res[0]);
    });
  },
  getComponentPreview: function (conf, req, res, registryError, callback) {
    getComponentFallbackForViewType(urlBuilder.componentPreview, conf, req, res, registryError, callback);
  },
  getComponentInfo: function (conf, req, res, registryError, callback) {
    getComponentFallbackForViewType(urlBuilder.componentInfo, conf, req, res, registryError, callback);
  }
};
