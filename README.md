# Polling App with Next.js and Supabase

A modern polling application built with Next.js 15, Supabase for authentication and database, and Tailwind CSS for styling.

## Features

- 🔐 User authentication (signup/login) with Supabase Auth
- 📊 Create and view polls
- 🗳️ Vote on polls
- 🎨 Modern UI with custom color scheme
- 🔒 Protected routes with middleware
- 📱 Responsive design

## Prerequisites

1. **Supabase Project Setup**
   - Create a project at [supabase.com](https://supabase.com)
   - Get your Supabase URL and Anon Key from project settings (API section)

2. **Database Schema**
   Run these SQL commands in your Supabase SQL Editor:

   ```sql
   -- Create profiles table
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     username TEXT UNIQUE NOT NULL,
     phone_number TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );

   -- Enable RLS for profiles
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   -- Policies for profiles
   CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
   CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
   CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

   -- Create polls table
   CREATE TABLE polls (
     id SERIAL PRIMARY KEY,
     question TEXT NOT NULL,
     options JSONB NOT NULL,
     created_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );

   -- Create votes table
   CREATE TABLE votes (
     id SERIAL PRIMARY KEY,
     poll_id INTEGER REFERENCES polls(id),
     option_index INTEGER NOT NULL,
     voted_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );

   -- RLS for polls
   ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Polls are viewable by everyone" ON polls FOR SELECT USING (true);
   CREATE POLICY "Authenticated users can create polls" ON polls FOR INSERT WITH CHECK (auth.uid() = created_by);

   -- RLS for votes
   ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Votes are viewable by everyone" ON votes FOR SELECT USING (true);
   CREATE POLICY "Authenticated users can vote" ON votes FOR INSERT WITH CHECK (auth.uid() = voted_by);
   ```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
polling-app/
├── app/
│   ├── auth/                 # Authentication pages
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── polls/                # Polling features
│   │   ├── create/page.tsx
│   │   ├── [id]/page.tsx
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/               # Reusable components
│   └── AuthForm.tsx
├── lib/                      # Utilities
│   ├── supabaseClient.ts
│   └── auth.ts
├── middleware.ts             # Route protection
└── tailwind.config.js        # Custom styling
```

## Usage

1. **Sign Up/Login:** Visit `/auth/signup` or `/auth/login`
2. **Create Polls:** Navigate to `/polls/create` to create new polls
3. **View Polls:** Visit `/polls` to see all polls
4. **Vote:** Click on any poll to view and vote

## Custom Colors

The app uses a custom color scheme:
- Baby Blue: `#8FD9FB`
- Sky Blue: `#87CEEB`
- White: `#ffffff`

## Technologies Used

- **Next.js 15** - React framework with App Router
- **Supabase** - Backend as a Service (Auth & Database)
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type safety
- **React Hook Form** - Form handling and validation

## Development

- **Build:** `npm run build`
- **Start:** `npm start`
- **Lint:** `npm run lint`

## Security Features

- Row Level Security (RLS) enabled on all tables
- Protected routes with middleware
- JWT token-based authentication
- Server-side session validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
