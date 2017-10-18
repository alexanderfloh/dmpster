define(['dump', 'react-redux', 'actions'], 
  function(Dump, ReactRedux, Actions) {
    
    const mapStateToProps = (state, ownProps) => {
      const dump = state.Dumps.get(ownProps.dumpId);
      return dump.toJS();
    };

    const mapDispatchToProps = (dispatch, ownProps) => {
      return {
        // handleClickOnRemove: () => {

        // },
        // handleClickOnArchive: () => {

        // },
        handleAddTag: (id, tagName, url) => {
          dispatch(Actions.addTagToDump(id, tagName, url));
        },
        handleRemoveTag: (id, tagName, url) => {
          dispatch(Actions.removeTagFromDump(id, tagName, url));
        },
      };
    };

    return ReactRedux.connect(
      mapStateToProps,
      mapDispatchToProps
    )(Dump);
  }
);