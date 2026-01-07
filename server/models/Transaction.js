const { supabase } = require('../supabase');

class Transaction {
  static async create(userId, type, amount, description = '') {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ user_id: userId, type, amount, description }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      throw new Error(`Error creating transaction: ${err.message}`);
    }
  }

  static async findByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      throw new Error(`Error fetching transactions: ${err.message}`);
    }
  }

  static async findLatestGiftForUser(userId) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('type', 'gift')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data && data.length ? data[0] : null;
    } catch (err) {
      throw new Error(`Error fetching gift transactions: ${err.message}`);
    }
  }
}

module.exports = Transaction;
