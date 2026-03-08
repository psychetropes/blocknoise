// web stub — solana mobile wallet adapter is android-only
const noop = () => {};

module.exports = {
  __esModule: true,
  transact: (cb) => Promise.reject(new Error('MWA not available on web')),
};
