# Tribe-Sync Setup Guide

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project in Supabase

## Configuration Steps

### 1. Set Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project dashboard under:
- Project Settings -> API

### 2. Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and run the contents of `supabase-schema.sql`

This will create:
- `users` table for user profiles
- `goals` table for goal tracking
- `goal_members` table for collaboration
- `goal_suggestions` table for AI recommendations

### 3. Enable Authentication

Supabase comes with built-in authentication. Make sure:
- Email authentication is enabled (default)
- You can add other providers (Google, GitHub, etc.) if desired

### 4. Run the Application

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Database Schema Overview

### Users Table
- Extends Supabase auth.users
- Stores username and interests for AI matching

### Goals Table
- Stores goal information
- Tracks progress (0-100)
- Supports tags for categorization

### Goal Members Table
- Manages collaboration
- Owner vs member roles

### Goal Suggestions Table
- AI-generated recommendations
- Match scores and reasoning

## AI Agent Logic

The AI agent will:
1. Parse new goals for keywords and themes
2. Match against user interests
3. Generate suggestions with match scores
4. Provide reasoning for recommendations

## Development Notes

- The app uses Next.js 16 with App Router
- Tailwind CSS for styling
- Supabase for backend and authentication
- TypeScript for type safety
