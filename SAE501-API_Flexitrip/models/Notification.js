class Notification {
  static async findUnreadByUser() { return []; }
  static async countUnreadByUser() { return 0; }
  static async findOne() { return null; }
  static async insertMany() { return []; }
  static async markAsRead() { return { modifiedCount: 0 }; }
  static async deleteExpired() { return { deletedCount: 0 }; }
  async markRead() { return this; }
}

module.exports = Notification;
