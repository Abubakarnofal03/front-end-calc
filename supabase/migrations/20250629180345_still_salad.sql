/*
  # Initial Schema for NeuraLearn

  1. New Tables
    - `learning_plans`
      - `id` (uuid, primary key)  
      - `user_id` (uuid, references auth.users)
      - `topic` (text)
      - `duration_days` (integer)
      - `current_level` (text)
      - `daily_time` (text)
      - `start_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `daily_lessons`
      - `id` (uuid, primary key)
      - `learning_plan_id` (uuid, references learning_plans)
      - `day_number` (integer)
      - `title` (text)
      - `subtopics` (text array)
      - `explanations` (text array)
      - `created_at` (timestamp)

    - `quiz_questions`
      - `id` (uuid, primary key)
      - `daily_lesson_id` (uuid, references daily_lessons)
      - `question` (text)
      - `type` (text, 'mcq' or 'theory')
      - `options` (text array, nullable)
      - `correct_answer` (text)
      - `created_at` (timestamp)

    - `quiz_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `quiz_question_id` (uuid, references quiz_questions)
      - `user_answer` (text)
      - `is_correct` (boolean)
      - `score` (integer, nullable)
      - `feedback` (text, nullable)
      - `created_at` (timestamp)

    - `progress_tracker`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `learning_plan_id` (uuid, references learning_plans)
      - `day_number` (integer)
      - `subtopic_index` (integer)
      - `completed` (boolean, default false)
      - `completed_at` (timestamp, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create learning_plans table
CREATE TABLE IF NOT EXISTS learning_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  topic text NOT NULL,
  duration_days integer NOT NULL,
  current_level text NOT NULL,
  daily_time text NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create daily_lessons table
CREATE TABLE IF NOT EXISTS daily_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_plan_id uuid REFERENCES learning_plans(id) ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL,
  title text NOT NULL,
  subtopics text[] NOT NULL DEFAULT '{}',
  explanations text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_lesson_id uuid REFERENCES daily_lessons(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  type text NOT NULL CHECK (type IN ('mcq', 'theory')),
  options text[] DEFAULT NULL,
  correct_answer text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create quiz_responses table
CREATE TABLE IF NOT EXISTS quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  quiz_question_id uuid REFERENCES quiz_questions(id) ON DELETE CASCADE NOT NULL,
  user_answer text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  score integer DEFAULT NULL,
  feedback text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create progress_tracker table
CREATE TABLE IF NOT EXISTS progress_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  learning_plan_id uuid REFERENCES learning_plans(id) ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL,
  subtopic_index integer NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, learning_plan_id, day_number, subtopic_index)
);

-- Enable Row Level Security
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracker ENABLE ROW LEVEL SECURITY;

-- Create policies for learning_plans
CREATE POLICY "Users can read own learning plans"
  ON learning_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own learning plans"
  ON learning_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning plans"
  ON learning_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for daily_lessons
CREATE POLICY "Users can read own daily lessons"
  ON daily_lessons
  FOR SELECT
  TO authenticated
  USING (
    learning_plan_id IN (
      SELECT id FROM learning_plans WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create daily lessons for own plans"
  ON daily_lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    learning_plan_id IN (
      SELECT id FROM learning_plans WHERE user_id = auth.uid()
    )
  );

-- Create policies for quiz_questions
CREATE POLICY "Users can read quiz questions for own lessons"
  ON quiz_questions
  FOR SELECT
  TO authenticated
  USING (
    daily_lesson_id IN (
      SELECT dl.id FROM daily_lessons dl
      JOIN learning_plans lp ON dl.learning_plan_id = lp.id
      WHERE lp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create quiz questions for own lessons"
  ON quiz_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    daily_lesson_id IN (
      SELECT dl.id FROM daily_lessons dl
      JOIN learning_plans lp ON dl.learning_plan_id = lp.id
      WHERE lp.user_id = auth.uid()
    )
  );

-- Create policies for quiz_responses
CREATE POLICY "Users can read own quiz responses"
  ON quiz_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quiz responses"
  ON quiz_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz responses"
  ON quiz_responses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for progress_tracker
CREATE POLICY "Users can read own progress"
  ON progress_tracker
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress"
  ON progress_tracker
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON progress_tracker
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_id ON learning_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_lessons_plan_id ON daily_lessons(learning_plan_id);
CREATE INDEX IF NOT EXISTS idx_daily_lessons_day_number ON daily_lessons(day_number);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_lesson_id ON quiz_questions(daily_lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_id ON quiz_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracker_user_plan ON progress_tracker(user_id, learning_plan_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracker_day ON progress_tracker(day_number);

-- Create updated_at trigger for learning_plans
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_learning_plans_updated_at
    BEFORE UPDATE ON learning_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();