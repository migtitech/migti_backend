// Dummy country data for seeding the database
export const countryDummyData = [
  {
    name: 'United States',
    countryCode: 'US',
    sortCode: 'USA',
  },
  {
    name: 'Canada',
    countryCode: 'CA',
    sortCode: 'CAN',
  },
  {
    name: 'United Kingdom',
    countryCode: 'GB',
    sortCode: 'GBR',
  },
  {
    name: 'Germany',
    countryCode: 'DE',
    sortCode: 'DEU',
  },
  {
    name: 'France',
    countryCode: 'FR',
    sortCode: 'FRA',
  },
  {
    name: 'Italy',
    countryCode: 'IT',
    sortCode: 'ITA',
  },
  {
    name: 'Spain',
    countryCode: 'ES',
    sortCode: 'ESP',
  },
  {
    name: 'Netherlands',
    countryCode: 'NL',
    sortCode: 'NLD',
  },
  {
    name: 'Belgium',
    countryCode: 'BE',
    sortCode: 'BEL',
  },
  {
    name: 'Switzerland',
    countryCode: 'CH',
    sortCode: 'CHE',
  },
  {
    name: 'Austria',
    countryCode: 'AT',
    sortCode: 'AUT',
  },
  {
    name: 'Sweden',
    countryCode: 'SE',
    sortCode: 'SWE',
  },
  {
    name: 'Norway',
    countryCode: 'NO',
    sortCode: 'NOR',
  },
  {
    name: 'Denmark',
    countryCode: 'DK',
    sortCode: 'DNK',
  },
  {
    name: 'Finland',
    countryCode: 'FI',
    sortCode: 'FIN',
  },
  {
    name: 'Poland',
    countryCode: 'PL',
    sortCode: 'POL',
  },
  {
    name: 'Czech Republic',
    countryCode: 'CZ',
    sortCode: 'CZE',
  },
  {
    name: 'Hungary',
    countryCode: 'HU',
    sortCode: 'HUN',
  },
  {
    name: 'Portugal',
    countryCode: 'PT',
    sortCode: 'PRT',
  },
  {
    name: 'Greece',
    countryCode: 'GR',
    sortCode: 'GRC',
  },
  {
    name: 'Ireland',
    countryCode: 'IE',
    sortCode: 'IRL',
  },
  {
    name: 'Australia',
    countryCode: 'AU',
    sortCode: 'AUS',
  },
  {
    name: 'New Zealand',
    countryCode: 'NZ',
    sortCode: 'NZL',
  },
  {
    name: 'Japan',
    countryCode: 'JP',
    sortCode: 'JPN',
  },
  {
    name: 'South Korea',
    countryCode: 'KR',
    sortCode: 'KOR',
  },
  {
    name: 'China',
    countryCode: 'CN',
    sortCode: 'CHN',
  },
  {
    name: 'India',
    countryCode: 'IN',
    sortCode: 'IND',
  },
  {
    name: 'Brazil',
    countryCode: 'BR',
    sortCode: 'BRA',
  },
  {
    name: 'Argentina',
    countryCode: 'AR',
    sortCode: 'ARG',
  },
  {
    name: 'Mexico',
    countryCode: 'MX',
    sortCode: 'MEX',
  },
  {
    name: 'South Africa',
    countryCode: 'ZA',
    sortCode: 'ZAF',
  },
  {
    name: 'Egypt',
    countryCode: 'EG',
    sortCode: 'EGY',
  },
  {
    name: 'Nigeria',
    countryCode: 'NG',
    sortCode: 'NGA',
  },
  {
    name: 'Kenya',
    countryCode: 'KE',
    sortCode: 'KEN',
  },
  {
    name: 'Morocco',
    countryCode: 'MA',
    sortCode: 'MAR',
  },
  {
    name: 'Turkey',
    countryCode: 'TR',
    sortCode: 'TUR',
  },
  {
    name: 'Israel',
    countryCode: 'IL',
    sortCode: 'ISR',
  },
  {
    name: 'United Arab Emirates',
    countryCode: 'AE',
    sortCode: 'ARE',
  },
  {
    name: 'Saudi Arabia',
    countryCode: 'SA',
    sortCode: 'SAU',
  },
  {
    name: 'Thailand',
    countryCode: 'TH',
    sortCode: 'THA',
  },
  {
    name: 'Singapore',
    countryCode: 'SG',
    sortCode: 'SGP',
  },
  {
    name: 'Malaysia',
    countryCode: 'MY',
    sortCode: 'MYS',
  },
  {
    name: 'Indonesia',
    countryCode: 'ID',
    sortCode: 'IDN',
  },
  {
    name: 'Philippines',
    countryCode: 'PH',
    sortCode: 'PHL',
  },
  {
    name: 'Vietnam',
    countryCode: 'VN',
    sortCode: 'VNM',
  },
  {
    name: 'Russia',
    countryCode: 'RU',
    sortCode: 'RUS',
  },
  {
    name: 'Ukraine',
    countryCode: 'UA',
    sortCode: 'UKR',
  },
  {
    name: 'Romania',
    countryCode: 'RO',
    sortCode: 'ROU',
  },
  {
    name: 'Bulgaria',
    countryCode: 'BG',
    sortCode: 'BGR',
  },
  {
    name: 'Croatia',
    countryCode: 'HR',
    sortCode: 'HRV',
  },
  {
    name: 'Slovenia',
    countryCode: 'SI',
    sortCode: 'SVN',
  },
  {
    name: 'Slovakia',
    countryCode: 'SK',
    sortCode: 'SVK',
  },
  {
    name: 'Lithuania',
    countryCode: 'LT',
    sortCode: 'LTU',
  },
  {
    name: 'Latvia',
    countryCode: 'LV',
    sortCode: 'LVA',
  },
  {
    name: 'Estonia',
    countryCode: 'EE',
    sortCode: 'EST',
  },
]

// Function to seed countries into the database
export const seedCountries = async (CountryModel) => {
  try {
    // Check if countries already exist
    const existingCountries = await CountryModel.countDocuments()

    if (existingCountries > 0) {
      console.log('Countries already exist in database, skipping seed')
      return { message: 'Countries already exist', count: existingCountries }
    }

    // Insert all countries
    const insertedCountries = await CountryModel.insertMany(countryDummyData)

    console.log(`Successfully seeded ${insertedCountries.length} countries`)
    return {
      message: 'Countries seeded successfully',
      count: insertedCountries.length,
      countries: insertedCountries,
    }
  } catch (error) {
    console.error('Error seeding countries:', error)
    throw error
  }
}
