
-- Create messages table for internal messaging
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can mark messages as read
CREATE POLICY "Users can update messages they received"
  ON public.messages FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Update app_role enum to include the new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ceo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'brand_manager';
