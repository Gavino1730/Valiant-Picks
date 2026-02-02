/**
 * Popup Queue Manager
 * Coordinates the display of multiple popups to show them one at a time
 * with appropriate delays between each popup.
 */

class PopupQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.currentPopup = null;
    this.delayBetweenPopups = 1000; // 1 second delay between popups
  }

  /**
   * Add a popup to the queue
   * @param {string} id - Unique identifier for the popup
   * @param {Function} showCallback - Function to call to show the popup
   * @param {number} priority - Priority level (lower number = higher priority)
   * @param {number} initialDelay - Delay before showing this popup (in ms)
   */
  enqueue(id, showCallback, priority = 5, initialDelay = 0) {
    // Check if popup with this id already exists in queue
    const existing = this.queue.find(p => p.id === id);
    if (existing) {
      return; // Don't add duplicate
    }

    this.queue.push({
      id,
      showCallback,
      priority,
      initialDelay,
      timestamp: Date.now()
    });

    // Sort by priority (lower number first)
    this.queue.sort((a, b) => a.priority - b.priority);

    // Start processing if not already
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the queue - show popups one at a time
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const popup = this.queue.shift();
      this.currentPopup = popup;

      // Wait for initial delay
      if (popup.initialDelay > 0) {
        await this.wait(popup.initialDelay);
      }

      // Show the popup
      popup.showCallback();

      // Wait for the popup to be dismissed
      await this.waitForDismissal(popup.id);

      // Wait between popups
      await this.wait(this.delayBetweenPopups);

      this.currentPopup = null;
    }

    this.isProcessing = false;
  }

  /**
   * Mark current popup as dismissed
   */
  dismiss(id) {
    if (this.currentPopup && this.currentPopup.id === id) {
      this.currentPopup.dismissed = true;
    }
  }

  /**
   * Wait for a popup to be dismissed
   */
  waitForDismissal(id) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.currentPopup && this.currentPopup.id === id && this.currentPopup.dismissed) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Auto-dismiss after 30 seconds if not manually dismissed
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 30000);
    });
  }

  /**
   * Wait for specified time
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue = [];
    this.isProcessing = false;
    this.currentPopup = null;
  }

  /**
   * Check if a specific popup is in the queue or currently showing
   */
  has(id) {
    return this.queue.some(p => p.id === id) || 
           (this.currentPopup && this.currentPopup.id === id);
  }
}

// Create and export a singleton instance
const popupQueue = new PopupQueue();
export default popupQueue;
