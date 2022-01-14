let config = null;

export default opts => {
  if (!opts && config) {
    return config
  } else {
    config = opts
    return config
  }
};