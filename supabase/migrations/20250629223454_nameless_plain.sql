/*
  # Add explanation and key_points columns to quiz_questions table

  1. Changes
    - Add `explanation` column (text, nullable) to store detailed explanations for quiz questions
    - Add `key_points` column (text array, nullable) to store key learning points for each question

  2. Security
    - No changes to existing RLS policies needed as these are just additional columns
*/

-- Add explanation column to quiz_questions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_questions' AND column_name = 'explanation'
  ) THEN
    ALTER TABLE quiz_questions ADD COLUMN explanation text;
  END IF;
END $$;

-- Add key_points column to quiz_questions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_questions' AND column_name = 'key_points'
  ) THEN
    ALTER TABLE quiz_questions ADD COLUMN key_points text[];
  END IF;
END $$;