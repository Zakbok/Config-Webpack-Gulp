const config = {
  PATH_BLACKLIST: JSON.stringify('/ajax/handleBlacklist.php'),
  PATH_MENTORS: JSON.stringify('/ajax/handleMentors.php'),
  PATH_STUDENTS: JSON.stringify('/ajax/handleStudents.php'),
  PATH_OTHERS: JSON.stringify('/ajax/handleOthers.php'),
  PATH_CART: JSON.stringify('/ajax/handleCart.php'),
  PATH_INSURANCE_NOTE: JSON.stringify('/ajax/handleInsuranceNote.php'),
  PATH_STATS: JSON.stringify('/ajax/getStats.php'),
  PATH_POSTS_STATS: JSON.stringify('/ajax/comments/getStats.php'),
  PATH_UNREAD_CHATS: JSON.stringify('/ajax/chat/getUnreadChats.php'),
  PATH_CHAT_ACCESS: JSON.stringify('/ajax/chat/getAccess.php'),
  PATH_DELETE_COMMENT: JSON.stringify('/ajax/comments/delete.php'),
  PATH_NOTIFICATIONS: JSON.stringify('/ajax/handleNotifications.php'),
  PATH_ACCESS_CONFIRM: JSON.stringify('/ajax/confirmAccess.php')
};

module.exports = config;
