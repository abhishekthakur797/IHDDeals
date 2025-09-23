export interface Database {
  public: {
    Tables: {
      user_accounts: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          username: string;
          password_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          username: string;
          password_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          username?: string;
          password_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      affiliate_products: {
        Row: {
          id: string;
          name: string;
          price: number;
          image_url: string;
          affiliate_link: string;
          category: string;
          description: string;
          rating: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          image_url: string;
          affiliate_link: string;
          category: string;
          description?: string;
          rating?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          image_url?: string;
          affiliate_link?: string;
          category?: string;
          description?: string;
          rating?: number;
          created_at?: string;
        };
      };
      discussions: {
        Row: {
          id: string;
          title: string;
          content: string;
          author_id: string | null;
          author_name: string;
          created_at: string;
          updated_at: string;
          likes: number;
          views: number;
          reply_count: number;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          author_id?: string | null;
          author_name: string;
          created_at?: string;
          updated_at?: string;
          likes?: number;
          views?: number;
          reply_count?: number;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          author_id?: string | null;
          author_name?: string;
          created_at?: string;
          updated_at?: string;
          likes?: number;
          views?: number;
          reply_count?: number;
        };
      };
      discussion_replies: {
        Row: {
          id: string;
          discussion_id: string;
          content: string;
          author_id: string | null;
          author_name: string;
          parent_reply_id: string | null;
          created_at: string;
          likes: number;
        };
        Insert: {
          id?: string;
          discussion_id: string;
          content: string;
          author_id?: string | null;
          author_name: string;
          parent_reply_id?: string | null;
          created_at?: string;
          likes?: number;
        };
        Update: {
          id?: string;
          discussion_id?: string;
          content?: string;
          author_id?: string | null;
          author_name?: string;
          parent_reply_id?: string | null;
          created_at?: string;
          likes?: number;
        };
      };
      discussion_likes: {
        Row: {
          id: string;
          discussion_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          discussion_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          discussion_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      reply_likes: {
        Row: {
          id: string;
          reply_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reply_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          reply_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
}