// Seed preferences data for user signup preferences
export const seedPreferences = async (PreferenceMasterModel) => {
  try {
    // Check if preferences already exist
    const existingPreferences = await PreferenceMasterModel.countDocuments()
    if (existingPreferences > 0) {
      return {
        success: true,
        message: 'Preferences already exist in database',
        data: { count: existingPreferences },
      }
    }

    // Define 10 essential GCA preferences for signup
    const preferences = [
      // Communication
      {
        preferenceTitle: 'Email Notifications',
        type: 'communication',
        radio: ['Daily', 'Weekly', 'Monthly', 'Never'],
      },
      {
        preferenceTitle: 'SMS Notifications',
        type: 'communication',
        radio: ['Enabled', 'Disabled'],
      },
      {
        preferenceTitle: 'Push Notifications',
        type: 'communication',
        radio: ['All', 'Important Only', 'Off'],
      },

      // Marketing
      {
        preferenceTitle: 'Marketing Communications',
        type: 'marketing',
        radio: ['Yes', 'No'],
      },
      {
        preferenceTitle: 'Newsletter Subscription',
        type: 'marketing',
        radio: ['Subscribed', 'Unsubscribed'],
      },

      // Culinary & Events
      {
        preferenceTitle: 'Event Updates',
        type: 'events',
        radio: ['All Events', 'My Events Only', 'None'],
      },
      {
        preferenceTitle: 'Competition Alerts',
        type: 'events',
        radio: ['Immediate', 'Daily Digest', 'Weekly Digest', 'Off'],
      },

      // Learning
      {
        preferenceTitle: 'Learning Material',
        type: 'learning',
        radio: ['All', 'Recommended Only', 'None'],
      },

      // Social
      {
        preferenceTitle: 'Team Invitations',
        type: 'social',
        radio: ['Accept All', 'Manual Review', 'Decline All'],
      },

      // System
      {
        preferenceTitle: 'System Updates',
        type: 'system',
        radio: ['Enable', 'Disable'],
      },
    ]

    const insertedPreferences =
      await PreferenceMasterModel.insertMany(preferences)

    return {
      success: true,
      message: 'Preferences seeded successfully',
      data: {
        count: insertedPreferences.length,
        preferences: insertedPreferences,
      },
    }
  } catch (error) {
    console.error('Error seeding preferences:', error)
    throw error
  }
}
