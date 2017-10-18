define(['analyzingDumpsView', 'react-redux'], 
  function(AnalyzingDumps, ReactRedux) {
    const mapStateToProps = state => {
      return {
        analyzingDumps: state.Analyzing,
      };
    };

    return ReactRedux.connect(
      mapStateToProps
    )(AnalyzingDumps);
  }
);