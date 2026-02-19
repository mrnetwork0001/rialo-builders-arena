
-- Add sort_order column to participants for drag-to-reorder
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Update existing rows with sequential order based on created_at
UPDATE public.participants p
SET sort_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at) AS rn
  FROM public.participants
) sub
WHERE p.id = sub.id;
