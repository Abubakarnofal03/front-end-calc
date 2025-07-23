# NeuraLearn - AI-Powered Learning Platform

A modern, AI-powered learning platform that creates personalized learning plans, interactive quizzes, and provides smart tutoring using advanced language models.

## Features

- 🤖 **AI-Generated Learning Plans**: Personalized curriculum based on your skill level and time commitment
- 📚 **Interactive Lessons**: Structured daily lessons with detailed explanations and examples
- 🧠 **Smart Quizzes**: AI-generated multiple choice and theory questions with intelligent grading
- 💬 **AI Tutor**: Ask questions and get detailed explanations with code examples
- 📊 **Progress Tracking**: Monitor your learning journey with detailed analytics
- 🎯 **Adaptive Content**: Content that adapts to your learning pace and preferences
- 🔊 **Text-to-Speech**: Listen to lesson content with built-in TTS
- 📱 **Responsive Design**: Beautiful, modern interface that works on all devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **AI**: Groq API (Llama 3.1), ElevenLabs TTS (optional)
- **Deployment**: Vercel
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Groq API key
- ElevenLabs API key (optional, for enhanced TTS)

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd neuralearn
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables (see above)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Database Setup

The application uses Supabase for data storage. The database schema includes:

- `learning_plans` - User learning plans and preferences
- `daily_lessons` - AI-generated lesson content
- `quiz_questions` - Quiz questions with explanations
- `quiz_responses` - User quiz responses and scores
- `progress_tracker` - Learning progress tracking

Run the migrations in the `supabase/migrations` folder to set up your database schema.

## Deployment on Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/neuralearn)

### Manual Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GROQ_API_KEY`
   - `VITE_ELEVENLABS_API_KEY`

### Environment Variables for Production

In your Vercel dashboard, add these environment variables:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `VITE_GROQ_API_KEY` | Your Groq API key for AI features |
| `VITE_ELEVENLABS_API_KEY` | Your ElevenLabs API key (optional) |

## Usage

1. **Sign Up/Login**: Create an account or sign in
2. **Create Learning Plan**: Choose a topic, duration, skill level, and daily time commitment
3. **Daily Learning**: Follow your personalized daily lessons
4. **Interactive Content**: Expand lessons for detailed explanations, examples, and applications
5. **Take Quizzes**: Test your knowledge with AI-generated quizzes
6. **Ask Questions**: Use the AI tutor for clarifications and additional help
7. **Track Progress**: Monitor your learning journey and achievements

## Features in Detail

### AI-Generated Content
- Personalized learning plans based on your preferences
- Detailed explanations with code examples and practical applications
- Adaptive quiz questions that test understanding, not memorization
- Intelligent grading with constructive feedback

### User Experience
- Terminal-inspired design for developers
- Smooth animations and micro-interactions
- Responsive design for all screen sizes
- Dark theme optimized for extended learning sessions

### Progress Tracking
- Daily completion tracking
- Streak counters and XP system
- Detailed analytics and insights
- Achievement system

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/neuralearn/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

## Acknowledgments

- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Powered by [Supabase](https://supabase.com/) for backend services
- AI capabilities provided by [Groq](https://groq.com/)
- Icons by [Lucide](https://lucide.dev/)
- Deployed on [Vercel](https://vercel.com/)