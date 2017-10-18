define(['immutable', 'records/tagging', 'records/tag', 'records/bucket', 'records/bucketBuilder'], 
function(Immutable, TaggingRecord, TagRecord, BucketRecord, BucketBuilder) {

  const buckets = (state = Immutable.OrderedMap(), action = '') => {
    switch(action.type) {

      case 'LOAD_BUCKETS':
        return Immutable.OrderedMap(action.buckets).map(BucketBuilder);

      case 'UPDATE_BUCKET': {
        const updatedBucket = Immutable.OrderedMap([action.bucket]).map(BucketBuilder);
        return state.merge(updatedBucket);
      }

      case 'POST_ADD_TAG': {
        if (action.containerType === 'bucket' && action.status === 'success') {
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
        if(action.containerType === 'bucket' && action.status === 'success') {
          return state.updateIn([String(action.id), 'tagging', 'tags'],
            tags => tags.filter(t => t.name !== action.tagName)
          );
        }
        else return state;
        break;
      }

      case 'POST_SET_NOTES': {
        if(action.status === 'success') {
          return state.setIn([String(action.id), 'notes'], action.notes);
        }
        return state;
      }

      default:
        return state;
    }
  };

  return buckets;
});