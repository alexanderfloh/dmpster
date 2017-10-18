define(['buckets', 'react-redux', 'actions'], 
  function(BucketList, ReactRedux, Actions) {
    const mapStateToProps = state => {
      return {
        buckets: state.Buckets,
      };
    };

    const mapDispatchToProps = (dispatch, ownProps) => {
      return {
        handleAddTag: (id, tagName, url) => {
          dispatch(Actions.addTagToBucket(id, tagName, url));
        },
        handleRemoveTag: (id, tagName, url) => {
          dispatch(Actions.removeTagFromBucket(id, tagName, url));
        },

        setNotes: (id, notes) => {
          dispatch(Actions.setNotes(id, notes));
        },

        addAnalysis: (fileName) => {
          dispatch(Actions.addAnalysis(fileName));
        },
      };
    };

    const BucketListConnected = ReactRedux.connect(
      mapStateToProps,
      mapDispatchToProps
    )(BucketList.BucketList);
    return BucketListConnected;
  }
);