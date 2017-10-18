define(['loadOlderDumps', 'react-redux', 'actions'], 
  function(LoadOlderDumps, ReactRedux, Actions) {
    
    const mapStateToProps = (state, ownProps) => {
      return {
        loadingState: state.LoadOlderDumps,
      };
    };

    const mapDispatchToProps = (dispatch, ownProps) => {
      return {
        handleLoadOlderDumps: () => {
          dispatch(Actions.loadOlderDumps());
        },
      };
    };

    return ReactRedux.connect(
      mapStateToProps,
      mapDispatchToProps
    )(LoadOlderDumps);
});