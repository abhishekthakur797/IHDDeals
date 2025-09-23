import { supabase } from '../lib/supabase';
import { Post, CreatePost } from '../types/auth';

/**
 * Post Service
 * Handles community discussion posts
 */
export class PostService {
  
  /**
   * Gets all posts with author information
   */
  static async getAllPosts(): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:user_accounts(full_name, username)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return [];
      }

      return (data || []).map(post => ({
        id: post.id,
        user_id: post.user_id,
        title: post.title,
        content: post.content,
        created_at: post.created_at,
        author: post.author ? {
          full_name: post.author.full_name,
          username: post.author.username
        } : undefined
      }));
    } catch (error) {
      console.error('Error in getAllPosts:', error);
      return [];
    }
  }

  /**
   * Creates a new post
   */
  static async createPost(postData: CreatePost): Promise<{ success: boolean; post?: Post; error?: string }> {
    try {
      // Validate input
      if (!postData.title || postData.title.trim().length === 0) {
        return { success: false, error: 'Title is required' };
      }
      
      if (!postData.content || postData.content.trim().length === 0) {
        return { success: false, error: 'Content is required' };
      }

      if (postData.title.trim().length > 200) {
        return { success: false, error: 'Title must be 200 characters or less' };
      }

      if (postData.content.trim().length > 10000) {
        return { success: false, error: 'Content must be 10,000 characters or less' };
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'You must be logged in to create a post' };
      }

      // Create the post
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: postData.title.trim(),
          content: postData.content.trim()
        })
        .select(`
          *,
          author:user_accounts(full_name, username)
        `)
        .single();

      if (error) {
        console.error('Error creating post:', error);
        return { success: false, error: 'Failed to create post. Please try again.' };
      }

      const newPost: Post = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        content: data.content,
        created_at: data.created_at,
        author: data.author ? {
          full_name: data.author.full_name,
          username: data.author.username
        } : undefined
      };

      return { success: true, post: newPost };
    } catch (error: any) {
      console.error('Error in createPost:', error);
      return { success: false, error: 'An unexpected error occurred while creating the post' };
    }
  }

  /**
   * Gets posts by a specific user
   */
  static async getPostsByUser(userId: string): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:user_accounts(full_name, username)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user posts:', error);
        return [];
      }

      return (data || []).map(post => ({
        id: post.id,
        user_id: post.user_id,
        title: post.title,
        content: post.content,
        created_at: post.created_at,
        author: post.author ? {
          full_name: post.author.full_name,
          username: post.author.username
        } : undefined
      }));
    } catch (error) {
      console.error('Error in getPostsByUser:', error);
      return [];
    }
  }

  /**
   * Deletes a post (only by the author)
   */
  static async deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Error deleting post:', error);
        return { success: false, error: 'Failed to delete post. You can only delete your own posts.' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in deletePost:', error);
      return { success: false, error: 'An unexpected error occurred while deleting the post' };
    }
  }

  /**
   * Updates a post (only by the author)
   */
  static async updatePost(postId: string, updates: Partial<CreatePost>): Promise<{ success: boolean; post?: Post; error?: string }> {
    try {
      // Validate input
      if (updates.title !== undefined && updates.title.trim().length === 0) {
        return { success: false, error: 'Title cannot be empty' };
      }
      
      if (updates.content !== undefined && updates.content.trim().length === 0) {
        return { success: false, error: 'Content cannot be empty' };
      }

      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title.trim();
      if (updates.content !== undefined) updateData.content = updates.content.trim();

      const { data, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .select(`
          *,
          author:user_accounts(full_name, username)
        `)
        .single();

      if (error) {
        console.error('Error updating post:', error);
        return { success: false, error: 'Failed to update post. You can only update your own posts.' };
      }

      const updatedPost: Post = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        content: data.content,
        created_at: data.created_at,
        author: data.author ? {
          full_name: data.author.full_name,
          username: data.author.username
        } : undefined
      };

      return { success: true, post: updatedPost };
    } catch (error: any) {
      console.error('Error in updatePost:', error);
      return { success: false, error: 'An unexpected error occurred while updating the post' };
    }
  }
}