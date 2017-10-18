define(['immutable', 'records/tag', 'records/tagging', 'records/dump', 'records/dumpBuilder'], 
function(Immutable, TagRecord, TaggingRecord, DumpRecord, DumpBuilder) {

  const dumps = (state = Immutable.OrderedMap(), action = '') => {
    switch(action.type) {
      // case 'ADD_DUMP':
      //   return Object.assign({}, state, {
      //     dumps: [...state.buckets, {text: action.bucket.text}]
      //   });

      case 'LOAD_DUMPS': {
        return Immutable.OrderedMap(action.dumps)
          .map(DumpBuilder);
      }

      case 'UPDATE_DUMP': {
        const updatedDump = Immutable.OrderedMap([action.dump]).map(DumpBuilder);
        return state.merge(updatedDump);
      }

      case 'POST_ADD_TAG': {
        if(action.containerType === 'dump' && action.status === 'success') {
          return state.updateIn([String(action.id), 'tagging', 'tags'], 
            tags => tags.add(new TagRecord({
              name: action.tagName
            }))
          );
        }
        else return state;
        break;
      }

      case 'POST_REMOVE_TAG': {
        if(action.containerType === 'dump' && action.status === 'success') {
          return state.updateIn([String(action.id), 'tagging', 'tags'],
            tags => tags.filter(t => t.name !== action.tagName)
          );
        }
        else return state;
        break;
      }

      default:
        return state;
    }
  };

  return dumps;
});