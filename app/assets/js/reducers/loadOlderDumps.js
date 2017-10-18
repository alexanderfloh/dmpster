define(['immutable'], function(Immutable) {
  const loadOlderDumps = (state = null, action = '') => {
    switch(action.type) {
      case 'START_LOADING_OLDER_DUMPS':
        return 'loading';

      case 'FINISH_LOADING_OLDER_DUMPS':
        return 'loaded';

      default:
        return state;
    }
  };

  return loadOlderDumps;
});