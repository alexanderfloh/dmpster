define(['immutable'], function(Immutable) {
  const analyzing = (state = Immutable.OrderedSet(), action = '') => {
    switch(action.type) {
      case 'ADD_ANALYSIS':
        return state.add(action.fileName);

      case 'LOAD_ANALYZING':
        return Immutable.OrderedSet(action.fileNames);

      default:
        return state;
    }
  };

  return analyzing;
});