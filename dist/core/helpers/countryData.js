"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.seedCountries = exports.countryDummyData = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
// Dummy country data for seeding the database
var countryDummyData = exports.countryDummyData = [{
  name: 'United States',
  countryCode: 'US',
  sortCode: 'USA'
}, {
  name: 'Canada',
  countryCode: 'CA',
  sortCode: 'CAN'
}, {
  name: 'United Kingdom',
  countryCode: 'GB',
  sortCode: 'GBR'
}, {
  name: 'Germany',
  countryCode: 'DE',
  sortCode: 'DEU'
}, {
  name: 'France',
  countryCode: 'FR',
  sortCode: 'FRA'
}, {
  name: 'Italy',
  countryCode: 'IT',
  sortCode: 'ITA'
}, {
  name: 'Spain',
  countryCode: 'ES',
  sortCode: 'ESP'
}, {
  name: 'Netherlands',
  countryCode: 'NL',
  sortCode: 'NLD'
}, {
  name: 'Belgium',
  countryCode: 'BE',
  sortCode: 'BEL'
}, {
  name: 'Switzerland',
  countryCode: 'CH',
  sortCode: 'CHE'
}, {
  name: 'Austria',
  countryCode: 'AT',
  sortCode: 'AUT'
}, {
  name: 'Sweden',
  countryCode: 'SE',
  sortCode: 'SWE'
}, {
  name: 'Norway',
  countryCode: 'NO',
  sortCode: 'NOR'
}, {
  name: 'Denmark',
  countryCode: 'DK',
  sortCode: 'DNK'
}, {
  name: 'Finland',
  countryCode: 'FI',
  sortCode: 'FIN'
}, {
  name: 'Poland',
  countryCode: 'PL',
  sortCode: 'POL'
}, {
  name: 'Czech Republic',
  countryCode: 'CZ',
  sortCode: 'CZE'
}, {
  name: 'Hungary',
  countryCode: 'HU',
  sortCode: 'HUN'
}, {
  name: 'Portugal',
  countryCode: 'PT',
  sortCode: 'PRT'
}, {
  name: 'Greece',
  countryCode: 'GR',
  sortCode: 'GRC'
}, {
  name: 'Ireland',
  countryCode: 'IE',
  sortCode: 'IRL'
}, {
  name: 'Australia',
  countryCode: 'AU',
  sortCode: 'AUS'
}, {
  name: 'New Zealand',
  countryCode: 'NZ',
  sortCode: 'NZL'
}, {
  name: 'Japan',
  countryCode: 'JP',
  sortCode: 'JPN'
}, {
  name: 'South Korea',
  countryCode: 'KR',
  sortCode: 'KOR'
}, {
  name: 'China',
  countryCode: 'CN',
  sortCode: 'CHN'
}, {
  name: 'India',
  countryCode: 'IN',
  sortCode: 'IND'
}, {
  name: 'Brazil',
  countryCode: 'BR',
  sortCode: 'BRA'
}, {
  name: 'Argentina',
  countryCode: 'AR',
  sortCode: 'ARG'
}, {
  name: 'Mexico',
  countryCode: 'MX',
  sortCode: 'MEX'
}, {
  name: 'South Africa',
  countryCode: 'ZA',
  sortCode: 'ZAF'
}, {
  name: 'Egypt',
  countryCode: 'EG',
  sortCode: 'EGY'
}, {
  name: 'Nigeria',
  countryCode: 'NG',
  sortCode: 'NGA'
}, {
  name: 'Kenya',
  countryCode: 'KE',
  sortCode: 'KEN'
}, {
  name: 'Morocco',
  countryCode: 'MA',
  sortCode: 'MAR'
}, {
  name: 'Turkey',
  countryCode: 'TR',
  sortCode: 'TUR'
}, {
  name: 'Israel',
  countryCode: 'IL',
  sortCode: 'ISR'
}, {
  name: 'United Arab Emirates',
  countryCode: 'AE',
  sortCode: 'ARE'
}, {
  name: 'Saudi Arabia',
  countryCode: 'SA',
  sortCode: 'SAU'
}, {
  name: 'Thailand',
  countryCode: 'TH',
  sortCode: 'THA'
}, {
  name: 'Singapore',
  countryCode: 'SG',
  sortCode: 'SGP'
}, {
  name: 'Malaysia',
  countryCode: 'MY',
  sortCode: 'MYS'
}, {
  name: 'Indonesia',
  countryCode: 'ID',
  sortCode: 'IDN'
}, {
  name: 'Philippines',
  countryCode: 'PH',
  sortCode: 'PHL'
}, {
  name: 'Vietnam',
  countryCode: 'VN',
  sortCode: 'VNM'
}, {
  name: 'Russia',
  countryCode: 'RU',
  sortCode: 'RUS'
}, {
  name: 'Ukraine',
  countryCode: 'UA',
  sortCode: 'UKR'
}, {
  name: 'Romania',
  countryCode: 'RO',
  sortCode: 'ROU'
}, {
  name: 'Bulgaria',
  countryCode: 'BG',
  sortCode: 'BGR'
}, {
  name: 'Croatia',
  countryCode: 'HR',
  sortCode: 'HRV'
}, {
  name: 'Slovenia',
  countryCode: 'SI',
  sortCode: 'SVN'
}, {
  name: 'Slovakia',
  countryCode: 'SK',
  sortCode: 'SVK'
}, {
  name: 'Lithuania',
  countryCode: 'LT',
  sortCode: 'LTU'
}, {
  name: 'Latvia',
  countryCode: 'LV',
  sortCode: 'LVA'
}, {
  name: 'Estonia',
  countryCode: 'EE',
  sortCode: 'EST'
}];

// Function to seed countries into the database
var seedCountries = exports.seedCountries = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(CountryModel) {
    var existingCountries, insertedCountries, _t;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 1;
          return CountryModel.countDocuments();
        case 1:
          existingCountries = _context.sent;
          if (!(existingCountries > 0)) {
            _context.next = 2;
            break;
          }
          console.log('Countries already exist in database, skipping seed');
          return _context.abrupt("return", {
            message: 'Countries already exist',
            count: existingCountries
          });
        case 2:
          _context.next = 3;
          return CountryModel.insertMany(countryDummyData);
        case 3:
          insertedCountries = _context.sent;
          console.log("Successfully seeded ".concat(insertedCountries.length, " countries"));
          return _context.abrupt("return", {
            message: 'Countries seeded successfully',
            count: insertedCountries.length,
            countries: insertedCountries
          });
        case 4:
          _context.prev = 4;
          _t = _context["catch"](0);
          console.error('Error seeding countries:', _t);
          throw _t;
        case 5:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 4]]);
  }));
  return function seedCountries(_x) {
    return _ref.apply(this, arguments);
  };
}();