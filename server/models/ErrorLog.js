const { supabase } = require('../supabase');

class ErrorLog {
  static async create({
    userId = null,
    username = null,
    errorType,
    errorMessage,
    errorStack = null,
    endpoint = null,
    method = null,
    requestBody = null,
    userAgent = null,
    ipAddress = null,
    pageUrl = null,
    severity = 'error',
    statusCode = null,
    componentStack = null,
    responseData = null
  }) {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .insert([{
          user_id: userId,
          username,
          error_type: errorType,
          error_message: errorMessage,
          error_stack: errorStack,
          endpoint,
          method,
          request_body: requestBody ? JSON.stringify(requestBody) : null,
          user_agent: userAgent,
          ip_address: ipAddress,
          page_url: pageUrl,
          severity,
          status_code: statusCode,
          component_stack: componentStack,
          response_data: responseData ? JSON.stringify(responseData) : null
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      // Don't throw - logging errors shouldn't break the app
      console.error('Failed to log error:', err.message);
      return null;
    }
  }

  static async getAll(limit = 100, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (err) {
      throw new Error(`Error fetching error logs: ${err.message}`);
    }
  }

  static async getByUserId(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      throw new Error(`Error fetching user error logs: ${err.message}`);
    }
  }

  static async getSummary() {
    try {
      const { data, error } = await supabase
        .from('error_summary')
        .select('*')
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (err) {
      throw new Error(`Error fetching error summary: ${err.message}`);
    }
  }

  static async markResolved(errorId) {
    try {
      const { error } = await supabase
        .from('error_logs')
        .update({ resolved: true })
        .eq('id', errorId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      throw new Error(`Error marking log as resolved: ${err.message}`);
    }
  }

  static async deleteOldLogs(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('error_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      return { success: true };
    } catch (err) {
      throw new Error(`Error deleting old logs: ${err.message}`);
    }
  }
}

module.exports = ErrorLog;
