define(['immutable'], function(Immutable) {
  const uploader = (state = Immutable.OrderedSet(), action = '') => {
    switch(action.type) {

      default:
      return state;
    }
  };
  return uploader;
});