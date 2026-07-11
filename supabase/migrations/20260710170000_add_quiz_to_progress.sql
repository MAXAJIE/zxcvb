-- Add quiz columns to user_artifact_progress
ALTER TABLE user_artifact_progress 
ADD COLUMN quiz_correct_count INTEGER,
ADD COLUMN quiz_total_questions INTEGER,
ADD COLUMN quiz_completed_at TIMESTAMP WITH TIME ZONE;

-- Comment for context
COMMENT ON COLUMN user_artifact_progress.quiz_correct_count IS 'Number of correct answers in the artifact quiz';
COMMENT ON COLUMN user_artifact_progress.quiz_total_questions IS 'Total number of questions in the artifact quiz';
COMMENT ON COLUMN user_artifact_progress.quiz_completed_at IS 'Timestamp when the quiz was completed';
