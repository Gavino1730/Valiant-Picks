const { supabase } = require('../supabase');
const bcrypt = require('bcryptjs');

class User {
  static async create(username, email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ username, email, password: hashedPassword }])
        .select()
        .single();

      if (error) throw error;
      return { id: data.id, username: data.username, email: data.email };
    } catch (err) {
      throw new Error(`Error creating user: ${err.message}`);
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, balance, is_admin')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      throw new Error(`Error finding user: ${err.message}`);
    }
  }

  static async findByUsername(username) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      throw new Error(`Error finding user: ${err.message}`);
    }
  }

  static async updateBalance(userId, amount) {
    try {
      const { error } = await supabase
        .rpc('update_user_balance', { p_user_id: userId, p_amount: amount });

      if (error) throw error;
      return { changes: 1 };
    } catch (err) {
      // Fallback: fetch current balance and update
      const user = await this.findById(userId);
      if (!user) throw new Error('User not found');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: user.balance + amount })
        .eq('id', userId);

      if (updateError) throw updateError;
      return { changes: 1 };
    }
  }

  static async setBalance(userId, amount) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ balance: amount })
        .eq('id', userId);

      if (error) throw error;
      return { changes: 1 };
    } catch (err) {
      throw new Error(`Error updating balance: ${err.message}`);
    }
  }

  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, balance, is_admin, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      throw new Error(`Error fetching users: ${err.message}`);
    }
  }

  static async setAdminStatus(userId, isAdmin) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: isAdmin })
        .eq('id', userId);

      if (error) throw error;
      return { changes: 1 };
    } catch (err) {
      throw new Error(`Error updating admin status: ${err.message}`);
    }
  }

  static async delete(userId) {
    try {
      // Use RPC function to delete user with CASCADE
      // This bypasses RLS policies while maintaining security at the app layer
      const { data, error } = await supabase
        .rpc('delete_user_cascade', { p_user_id: userId });

      if (error) {
        console.error('RPC delete error:', error);
        // Fallback to direct delete if RPC doesn't exist
        const { error: directError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);
        
        if (directError) throw directError;
      }

      return { success: true, data };
    } catch (err) {
      throw new Error(`Error deleting user: ${err.message}`);
    }
  }
}

module.exports = User;
