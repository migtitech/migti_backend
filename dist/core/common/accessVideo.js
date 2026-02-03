"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateSignedCloudFrontUrl = generateSignedCloudFrontUrl;
var _cloudfrontSigner = require("@aws-sdk/cloudfront-signer");
var _fs = _interopRequireDefault(require("fs"));
// accessVideo.js

function generateSignedCloudFrontUrl(_ref) {
  var url = _ref.url,
    keyPairId = _ref.keyPairId,
    privateKeyPath = _ref.privateKeyPath,
    _ref$expiresInSeconds = _ref.expiresInSeconds,
    expiresInSeconds = _ref$expiresInSeconds === void 0 ? 3600 : _ref$expiresInSeconds;
  var privateKey = _fs["default"].readFileSync(privateKeyPath, 'utf8');
  var expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  console.log('DEBUG INPUT', {
    url: url,
    keyPairId: keyPairId,
    expires: expires
  });
  return (0, _cloudfrontSigner.getSignedUrl)({
    url: url,
    keyPairId: keyPairId,
    privateKey: privateKey,
    expires: expires
  });
}