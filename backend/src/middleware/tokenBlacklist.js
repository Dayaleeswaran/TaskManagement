const blacklist = new Set();

/**
 * Add a token to the blacklist.
 * @param {string} token
 */
const addToBlacklist = (token) => {
  if (token) {
    blacklist.add(token);
  }
};

/**
 * Check if a token is in the blacklist.
 * @param {string} token
 * @returns {boolean}
 */
const isBlacklisted = (token) => {
  return blacklist.has(token);
};

module.exports = {
  addToBlacklist,
  isBlacklisted,
};
