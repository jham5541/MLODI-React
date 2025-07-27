# 🗳️ M3lodi Voting System

A comprehensive voting system for the M3lodi music platform that allows users to participate in polls and surveys about music preferences, artist features, and community decisions.

## 🎯 Features

### Core Functionality
- **Multiple Poll Types**: Single choice, multiple choice, and rating polls
- **Anonymous & Authenticated Voting**: Support for both logged-in users and anonymous participants
- **Real-time Updates**: Live vote count updates and progress visualization
- **Vote Management**: Users can view, change, or remove their votes
- **Featured Polls**: Highlight important polls on the trending page

### Analytics & Insights
- **Vote Analytics**: Track voting patterns, demographics, and engagement
- **Poll Performance**: Monitor vote counts, participation rates, and trending
- **Results Visualization**: Progress bars and percentage displays
- **Historical Data**: Track poll performance over time

## 🏗️ Architecture

### Database Schema
- `polls` - Store poll questions, settings, and metadata
- `poll_options` - Store individual poll answer options
- `poll_votes` - Record user votes with device info and timestamps
- `poll_analytics` - Aggregate voting analytics and insights

### Components
- `TrendingPoll` - Main poll display component with voting interface
- `votingService` - Service layer for all poll-related operations
- Database functions for vote counting, eligibility checking, and results calculation

## 🚀 Setup Instructions

### 1. Database Setup
Run the migration files in your Supabase SQL editor:

```bash
# Run the setup script to see migration previews
node scripts/setup-voting-system.js
```

Or manually execute these migrations in Supabase:
1. `supabase/migrations/20240127000001_create_voting_tables.sql`
2. `supabase/migrations/20240127000002_seed_poll_data.sql`

### 2. Environment Variables
Ensure your Supabase credentials are configured in your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Testing
The system includes sample polls that work without database setup for testing purposes.

## 📱 Usage

### Viewing Polls
Polls are automatically displayed on the Trending page. Featured polls appear prominently with full voting interface.

### Voting Process
1. Users see poll question and available options
2. Click "Vote" button on desired option
3. Vote is recorded with real-time count updates
4. Users can change or remove votes if allowed

### Poll Management
Polls can be:
- Created with various question types
- Scheduled with start/end dates
- Featured for higher visibility
- Analyzed for engagement metrics

## 🔧 Technical Details

### Anonymous Voting
- Uses device-specific anonymous IDs stored in AsyncStorage
- Prevents duplicate votes while maintaining user privacy
- Tracks basic device info for analytics without personal data

### Real-time Updates
- Vote counts update immediately after voting
- Progress bars reflect current vote percentages
- Poll status (active/ended) checked in real-time

### Error Handling
- Graceful fallback to sample polls if database unavailable
- User-friendly error messages for voting failures
- Retry mechanisms for network issues

## 🎨 UI Components

### Poll Display
- Clean, card-based design matching app theme
- Progress bars showing vote distribution
- Clear voting buttons with state indicators
- Descriptive text for poll context

### Vote States
- **Can Vote**: Blue primary button
- **Already Voted**: Green success button with checkmark
- **Voting in Progress**: Loading spinner
- **Cannot Vote**: Disabled grey button

## 📊 Sample Polls

The system includes several pre-configured sample polls:

1. **Music Genre Preferences** - Single choice poll about favorite genres
2. **Artist Collaborations** - Vote for best music collaborations
3. **Platform Experience Rating** - 5-star rating poll
4. **Featured Artist Selection** - Community choice for artist highlights

## 🔐 Security & Privacy

### Data Protection
- Anonymous voting preserves user privacy
- Vote data encrypted in transit and at rest
- No personal information required for participation

### Vote Integrity
- Database constraints prevent duplicate votes
- Server-side validation of vote eligibility
- Audit trail for vote modifications and deletions

## 🚦 Status Indicators

### Poll Status
- **Active**: Currently accepting votes
- **Scheduled**: Will start at specified time
- **Ended**: No longer accepting votes
- **Featured**: Highlighted for increased visibility

### User States
- **Can Vote**: User eligible to participate
- **Already Voted**: User has cast their vote
- **Vote Limit Reached**: User has reached vote limit for this poll

## 🔄 Future Enhancements

### Planned Features
- **Poll Creation UI**: Allow users to create their own polls
- **Advanced Analytics**: Detailed demographic breakdowns
- **Social Sharing**: Share poll results on social media
- **Notification System**: Alert users about new featured polls
- **Poll Categories**: Organize polls by music genres, artists, etc.

### API Extensions
- **RESTful Poll API**: External access to poll data
- **Webhook Support**: Real-time poll event notifications
- **Bulk Operations**: Import/export poll data
- **Advanced Filtering**: Complex poll queries and searches

## 📝 Contributing

When adding new poll features:

1. Update database schema with proper migrations
2. Add TypeScript interfaces for new data structures
3. Include proper error handling and user feedback
4. Add analytics tracking for new poll interactions
5. Update documentation and example usage

## 🐛 Troubleshooting

### Common Issues

**Poll not loading:**
- Check Supabase connection and credentials
- Verify database migrations have been run
- Sample polls will display as fallback

**Voting fails:**
- Ensure user meets voting eligibility requirements
- Check poll status (active/ended)
- Verify network connectivity

**Anonymous voting issues:**
- Clear app storage to reset anonymous ID
- Check AsyncStorage permissions
- Verify device info collection is working

### Debug Information
- Anonymous ID stored in AsyncStorage as `anonymous_voting_id`
- Vote attempts logged to console with detailed error info
- Poll loading states tracked for debugging UI issues

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [React Navigation](https://reactnavigation.org/)
- [Expo Vector Icons](https://docs.expo.dev/guides/icons/)

---

The voting system enhances community engagement by giving users a voice in platform decisions and music preferences. The flexible architecture supports various poll types while maintaining privacy and security standards.
