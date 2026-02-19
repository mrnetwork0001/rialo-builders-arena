
CREATE TABLE public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  visitor_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT reactions_emoji_check CHECK (emoji IN ('👏', '🔥', '💡')),
  CONSTRAINT reactions_unique UNIQUE (participant_id, emoji, visitor_key)
);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
  ON public.reactions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert reactions"
  ON public.reactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete reactions"
  ON public.reactions FOR DELETE
  USING (true);
