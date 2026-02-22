-- =============================================
-- Vibe Forum - Supabase Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email = 'vrtkaarthik6@gmail.com'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- GROUPS
-- =============================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT TRUE,
  member_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GROUP MEMBERS
-- =============================================
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- =============================================
-- POSTS
-- =============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'meme', 'image', 'question')),
  upvotes INT DEFAULT 0,
  downvotes INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COMMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  upvotes INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REACTIONS (upvote/downvote on posts)
-- =============================================
CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('upvote', 'downvote')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Function to update post vote counts
CREATE OR REPLACE FUNCTION update_post_votes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET
    upvotes = (SELECT COUNT(*) FROM reactions WHERE post_id = COALESCE(NEW.post_id, OLD.post_id) AND type = 'upvote'),
    downvotes = (SELECT COUNT(*) FROM reactions WHERE post_id = COALESCE(NEW.post_id, OLD.post_id) AND type = 'downvote')
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_reaction_change
  AFTER INSERT OR UPDATE OR DELETE ON reactions
  FOR EACH ROW EXECUTE FUNCTION update_post_votes();

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- =============================================
-- FRIENDSHIPS
-- =============================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- =============================================
-- MESSAGES (DM + Group Chat)
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,   -- NULL if group message
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,         -- NULL if DM
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (receiver_id IS NOT NULL AND group_id IS NULL) OR
    (group_id IS NOT NULL AND receiver_id IS NULL)
  )
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,  -- 'comment', 'friend_request', 'reaction', 'message', 'group_invite'
  title TEXT NOT NULL,
  body TEXT,
  reference_id UUID,   -- post_id, comment_id, friendship_id etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, private write
CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: public read, owner write
CREATE POLICY "Posts are publicly readable" ON posts FOR SELECT USING (is_deleted = FALSE);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Comments: public read, owner write
CREATE POLICY "Comments are publicly readable" ON comments FOR SELECT USING (is_deleted = FALSE);
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Reactions
CREATE POLICY "Reactions are publicly readable" ON reactions FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can react" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change own reaction" ON reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reaction" ON reactions FOR DELETE USING (auth.uid() = user_id);

-- Friendships
CREATE POLICY "Users see their own friendships" ON friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can send friend requests" ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update friendships they're part of" ON friendships FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can delete friendships" ON friendships FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Groups: public read
CREATE POLICY "Groups are publicly readable" ON groups FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group admins/owner can update" ON groups FOR UPDATE USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role IN ('admin','owner'))
);

-- Group Members
CREATE POLICY "Group members are readable" ON group_members FOR SELECT USING (TRUE);
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- Messages: only sender and receiver
CREATE POLICY "Users see their DMs" ON messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id OR
  EXISTS (SELECT 1 FROM group_members WHERE group_id = messages.group_id AND user_id = auth.uid())
);
CREATE POLICY "Authenticated users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Notifications: private
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can mark notifications read" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKETS (run after creating project)
-- =============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);

-- =============================================
-- DISABLE EMAIL CONFIRMATION (DEV ONLY)
-- =============================================
-- In Supabase Dashboard: Authentication > Settings > Disable "Confirm email"
