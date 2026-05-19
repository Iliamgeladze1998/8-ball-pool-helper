# Tribe-Sync

A minimalist social network for collaborative goal achievement. Unlike traditional social media focused on content consumption, Tribe-Sync is designed for productive collaboration and progress tracking.

## Features

- **Goal Creation**: Set personal goals with descriptions, tags, and target dates
- **Progress Tracking**: Visual progress bars to track goal completion
- **Collaboration**: Join goals created by others and work together
- **AI-Powered Suggestions**: Intelligent goal matching based on interests and content
- **Minimalist Interface**: Clean design focused on progress, not doom-scrolling
- **Interest-Based Matching**: Users specify interests to get relevant recommendations

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Supabase** - Backend, database, and authentication
- **AI Agent** - Custom logic for goal analysis and matching

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. A Supabase account (free at https://supabase.com)

### Setup

1. **Clone and install dependencies**:
```bash
cd tribe-sync
npm install
```

2. **Set up Supabase**:
   - Create a new project at https://supabase.com
   - Go to Project Settings → API to get your credentials
   - Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Set up the database**:
   - Go to SQL Editor in your Supabase dashboard
   - Copy and run the contents of `supabase-schema.sql`
   - This creates tables for users, goals, collaboration, and AI suggestions

4. **Enable authentication**:
   - In Supabase, go to Authentication → Providers
   - Enable Google OAuth (or other providers)
   - Add your OAuth credentials

5. **Run the development server**:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Usage

### Creating Goals

1. Sign in with your OAuth provider
2. Click "New Goal" on the home page
3. Fill in the goal details:
   - Title: What you want to achieve
   - Description: More details about your goal
   - Tags: Categories (comma-separated)
   - Target Date: Optional deadline
4. The AI will automatically analyze and suggest your goal to matching users

### Joining Goals

- Browse goals on the home page
- Click "Join Goal" on any goal you'd like to collaborate on
- Track progress together with the goal owner

### AI Suggestions

- Go to the "Suggestions" page
- View goals matched to your interests
- See match scores and reasoning for each suggestion
- Join relevant goals to collaborate

### Managing Interests

- Go to the "Profile" page
- Select interests that match your goals
- The AI uses these to improve suggestion quality

## Database Schema

### Users
- Extends Supabase auth
- Stores username and interests for AI matching

### Goals
- Title, description, tags, target date
- Progress tracking (0-100%)
- Status (active, completed, paused)

### Goal Members
- Manages collaboration between users
- Owner vs member roles

### Goal Suggestions
- AI-generated recommendations
- Match scores and reasoning
- Links goals to interested users

## AI Agent Logic

The AI agent:

1. **Analyzes Goals**: Extracts keywords and categorizes goals into themes (fitness, learning, career, etc.)

2. **Matches Users**: Compares goal categories with user interests to calculate match scores

3. **Generates Suggestions**: Creates recommendations for users with matching interests

4. **Provides Context**: Explains why each goal was suggested

Match scores range from 0-100, with higher scores indicating better alignment with user interests.

## Project Structure

```
tribe-sync/
├── src/
│   ├── app/
│   │   ├── actions.ts          # Server actions for database operations
│   │   ├── api/                # API routes
│   │   ├── page.tsx            # Home page (goals)
│   │   ├── suggestions/        # AI suggestions page
│   │   ├── profile/            # User profile page
│   │   └── layout.tsx          # Root layout
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client
│   │   └── ai-agent.ts        # AI matching logic
│   └── types/
│       └── database.ts        # TypeScript types
├── supabase-schema.sql        # Database setup
├── SETUP.md                    # Detailed setup guide
└── README.md                   # This file
```

## Development

### Adding New Features

1. Database changes: Update `supabase-schema.sql` and types in `src/types/database.ts`
2. New pages: Add to `src/app/` directory
3. Server actions: Add to `src/app/actions.ts`
4. AI logic: Extend `src/lib/ai-agent.ts`

### Testing

```bash
npm run build
npm run start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Any platform that supports Next.js will work. Ensure you:
- Set environment variables
- Build the application: `npm run build`
- Start the production server: `npm start`

## License

This project is open source and available for personal and commercial use.

## Support

For detailed setup instructions, see `SETUP.md`
