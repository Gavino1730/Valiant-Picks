/**
 * Utility to handle Supabase errors consistently across all models
 * Detects HTML error responses (Cloudflare/Supabase down) and provides user-friendly messages
 */

/**
 * Check if an error is an HTML response (Supabase/Cloudflare connectivity issue)
 * @param {Error|Object} error - The error to check
 * @returns {boolean} - True if error is HTML response
 */
function isHtmlError(error) {
  if (!error) return false;
  
  const message = error.message || '';
  return typeof message === 'string' && (
    message.includes('<!DOCTYPE html>') ||
    message.includes('<html>') ||
    message.includes('<html\r\n') ||
    message.includes('<html\n') ||
    /<html[\s>]/i.test(message)
  );
}

/**
 * Handle Supabase errors with proper logging and user-friendly messages
 * @param {Error} error - The error from Supabase
 * @param {string} operation - The operation being performed (e.g., "fetching user bets")
 * @param {string} [logPrefix=''] - Optional prefix for console logging
 * @throws {Error} - Throws a user-friendly error
 */
function handleSupabaseError(error, operation, logPrefix = '') {
  if (isHtmlError(error)) {
    console.error(`${logPrefix}Supabase connectivity error - HTML response received`);
    throw new Error('Database temporarily unavailable. Please try again in a few moments.');
  }
  
  console.error(`${logPrefix}Supabase error during ${operation}:`, error);
  throw new Error(`Error ${operation}: ${error.message}`);
}

/**
 * Wrap a Supabase query with error handling
 * @param {Function} queryFn - Async function that executes the Supabase query
 * @param {string} operation - Description of the operation
 * @returns {Promise<any>} - The query result
 */
async function wrapSupabaseQuery(queryFn, operation) {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      handleSupabaseError(error, operation);
    }
    
    return data;
  } catch (err) {
    if (isHtmlError(err)) {
      console.error('Supabase connectivity error - HTML response received');
      throw new Error('Database temporarily unavailable. Please try again in a few moments.');
    }
    
    // Re-throw if already a user-friendly error
    if (err.message.includes('Database temporarily unavailable')) {
      throw err;
    }

    // Re-throw if already wrapped by handleSupabaseError to avoid double-nesting
    if (err.message.startsWith('Error ')) {
      throw err;
    }
    
    throw new Error(`Error ${operation}: ${err.message}`);
  }
}

module.exports = {
  isHtmlError,
  handleSupabaseError,
  wrapSupabaseQuery
};
