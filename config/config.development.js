const config = {
  PATH_BLACKLIST: JSON.stringify('/ajax/handleBlacklist.json'),
  PATH_MENTORS: JSON.stringify('/ajax/handleSubscribe.json'),
  PATH_STUDENTS: JSON.stringify('/ajax/handleStudents.json'),
  PATH_OTHERS: JSON.stringify('/ajax/handleOthers.json'),
  PATH_CART: JSON.stringify('/ajax/handleCart.json'),
  PATH_INSURANCE_NOTE: JSON.stringify('/ajax/handleInsuranceNote.json'),
  PATH_STATS: JSON.stringify('/ajax/getStats.json'),
  PATH_POSTS_STATS: JSON.stringify('/ajax/getPostsStats.json'),
  PATH_UNREAD_CHATS: JSON.stringify('/ajax/getUnreadChats.json'),
  PATH_CHAT_ACCESS: JSON.stringify('/ajax/chat/getAccess.json'),
  PATH_DELETE_COMMENT: JSON.stringify('/ajax/deleteComment.json'),
  PATH_NOTIFICATIONS: JSON.stringify('/ajax/handleNotifications.html'),
  PATH_ACCESS_CONFIRM: JSON.stringify('/ajax/confirmAcces.json')
};

module.exports = config;
