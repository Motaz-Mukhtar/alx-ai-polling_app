# Polling App with QR Code Sharing

A modern, full-stack polling application built with Next.js 15, Supabase, and Tailwind CSS. Users can create polls, share them via unique links and QR codes, and collect votes from their audience.

## 🚀 Features

- 🔐 **Secure Authentication** - User registration and login with Supabase Auth
- 📊 **Poll Management** - Create, view, and manage polls with detailed analytics
- 🗳️ **Voting System** - Interactive voting with real-time results and vote updates
- 📱 **QR Code Sharing** - Generate QR codes for easy poll sharing
- 🎨 **Modern UI** - Beautiful, responsive design with custom color scheme
- 🔒 **Protected Routes** - Middleware-based route protection and session management
- 📈 **Analytics Dashboard** - Comprehensive poll statistics and performance metrics
- 🎯 **Real-time Updates** - Live vote counts and percentage calculations

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Backend**: Supabase (Database, Authentication, Real-time)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **State Management**: Server Components, React hooks
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

Before you begin, ensure you have the following:

- Node.js 18+ installed
- A Supabase account and project
- Git for version control

## 🗄️ Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Get your Supabase URL and Anon Key from project settings (API section)

2. **Run Database Schema**
   Execute the following SQL commands in your Supabase SQL Editor:

   ```sql
   -- 1. Create profiles table
   CREATE TABLE IF NOT EXISTS profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     username TEXT UNIQUE NOT NULL,
     phone_number TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );

   -- 2. Enable RLS for profiles
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   -- 3. Drop existing policies if they exist
   DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
   DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
   DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

   -- 4. Create proper RLS policies for profiles
   CREATE POLICY "Users can insert own profile" ON profiles 
   FOR INSERT WITH CHECK (auth.uid() = id);

   CREATE POLICY "Users can update own profile" ON profiles 
   FOR UPDATE USING (auth.uid() = id);

   CREATE POLICY "Profiles are viewable by everyone" ON profiles 
   FOR SELECT USING (true);

   -- 5. Create polls table
   CREATE TABLE IF NOT EXISTS polls (
     id SERIAL PRIMARY KEY,
     question TEXT NOT NULL,
     options JSONB NOT NULL,
     created_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );

   -- 6. Create votes table
   CREATE TABLE IF NOT EXISTS votes (
     id SERIAL PRIMARY KEY,
     poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
     option_index INTEGER NOT NULL,
     voted_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
     UNIQUE(poll_id, voted_by) -- Prevent multiple votes per user per poll
   );

   -- 7. Enable RLS for polls
   ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

   -- 8. Drop existing policies if they exist
   DROP POLICY IF EXISTS "Polls are viewable by everyone" ON polls;
   DROP POLICY IF EXISTS "Authenticated users can create polls" ON polls;

   -- 9. Create RLS policies for polls
   CREATE POLICY "Polls are viewable by everyone" ON polls 
   FOR SELECT USING (true);

   CREATE POLICY "Authenticated users can create polls" ON polls 
   FOR INSERT WITH CHECK (auth.uid() = created_by);

   -- 10. Enable RLS for votes
   ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

   -- 11. Drop existing policies if they exist
   DROP POLICY IF EXISTS "Votes are viewable by everyone" ON votes;
   DROP POLICY IF EXISTS "Authenticated users can vote" ON votes;
   DROP POLICY IF EXISTS "Users can update own votes" ON votes;

   -- 12. Create RLS policies for votes
   CREATE POLICY "Votes are viewable by everyone" ON votes 
   FOR SELECT USING (true);

   CREATE POLICY "Authenticated users can vote" ON votes 
   FOR INSERT WITH CHECK (auth.uid() = voted_by);

   CREATE POLICY "Users can update own votes" ON votes 
   FOR UPDATE USING (auth.uid() = voted_by);

   -- 13. Create function to handle new user profile creation
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS trigger AS $$
   BEGIN
     INSERT INTO public.profiles (id, username, phone_number)
     VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'phone_number');
     RETURN new;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- 14. Create trigger to automatically create profile on user signup
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
   ```

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SECRET_KEY=your-supabase-service-role-key
```

> **Note**: You can find these values in your Supabase project settings under the "API" section.

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd polling-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage Examples

### Creating a Poll

1. **Sign up** for a new account or **log in** to your existing account
2. **Navigate** to the "Create New Poll" page
3. **Enter** your poll question (minimum 5 characters)
4. **Add options** separated by commas (minimum 2, maximum 10 options)
5. **Submit** the form to create your poll

**Example Poll:**
- **Question**: "What is your favorite programming language?"
- **Options**: "JavaScript, Python, TypeScript, Rust, Go"

### Voting on Polls

1. **Browse** available polls on the main dashboard
2. **Click** on any poll to view details and vote
3. **Select** your preferred option using the radio buttons
4. **Submit** your vote to see real-time results
5. **View** vote counts, percentages, and progress bars

### Managing Your Polls

1. **Access** the "My Polls" section from the dashboard
2. **View** detailed analytics for each of your polls:
   - Total vote counts
   - Most popular options
   - Vote percentages
   - Poll performance metrics
3. **Delete** polls you no longer need
4. **Share** poll links with others for voting

### Sharing Polls

1. **Copy** the poll URL from your browser
2. **Share** the link via email, social media, or messaging apps
3. **Generate QR codes** for easy mobile sharing (feature coming soon)
4. **Track** engagement through the analytics dashboard

## 📁 Project Structure

```
polling-app/
├── app/                      # Next.js App Router pages
│   ├── auth/                 # Authentication pages
│   │   ├── login/page.tsx    # Login page
│   │   └── signup/page.tsx   # Registration page
│   ├── polls/                # Polling features
│   │   ├── create/page.tsx   # Poll creation page
│   │   ├── manage/page.tsx   # Poll management dashboard
│   │   ├── [id]/page.tsx     # Individual poll view
│   │   └── page.tsx          # Main polls dashboard
│   ├── api/                  # API routes
│   │   ├── polls/            # Poll CRUD operations
│   │   └── votes/            # Voting operations
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── components/               # Reusable UI components
│   ├── ui/                   # shadcn/ui components
│   ├── AuthForm.tsx          # Authentication form
│   ├── PollForm.tsx          # Poll creation form
│   ├── VoteForm.tsx          # Voting interface
│   ├── PollCard.tsx          # Poll display card
│   └── PollManagementCard.tsx # Poll management card
├── lib/                      # Utility functions
│   ├── auth.ts               # Authentication helpers
│   ├── pollActions.ts        # Poll management functions
│   ├── supabaseClient.ts     # Supabase configuration
│   └── utils.ts              # General utilities
├── middleware.ts             # Route protection middleware
├── database-setup.sql        # Database schema
└── tailwind.config.js        # Tailwind CSS configuration
```

## 🎨 Design System

The app uses a carefully crafted color scheme:

- **Primary Blue**: `#8FD9FB` (Baby Blue)
- **Secondary Blue**: `#87CEEB` (Sky Blue)  
- **Background**: `#ffffff` (White)
- **Accent Colors**: Various shades for status indicators

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run tests
npm test
```

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **Protected Routes** - Middleware-based route protection
- **JWT Authentication** - Secure token-based authentication
- **Server-side Validation** - Input validation on the server
- **CSRF Protection** - SameSite cookie configuration
- **XSS Prevention** - HTTP-only cookies and input sanitization

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect** your GitHub repository to Vercel
2. **Set** environment variables in Vercel dashboard
3. **Deploy** automatically on every push to main branch

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📊 Performance Features

- **Server-side Rendering** - Fast initial page loads
- **Static Generation** - Optimized for performance
- **Image Optimization** - Next.js automatic image optimization
- **Code Splitting** - Automatic code splitting for smaller bundles
- **Caching** - Intelligent caching strategies

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style and patterns
- Add comprehensive docstrings to new functions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components

## 📞 Support

If you encounter any issues or have questions:

1. **Check** the [Issues](https://github.com/your-repo/issues) page
2. **Create** a new issue with detailed information
3. **Join** our community discussions

---

**Happy Polling! 🗳️**
