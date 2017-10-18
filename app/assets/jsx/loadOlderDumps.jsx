/** @jsx React.DOM */

define(['react'], function(React) {
  class LoadOlderDumps extends React.Component {
    render() {
      const node = () => {
        switch(this.props.loadingState) {
        case 'loaded':
          return null;

        case 'loading':
          return (
            <div className="spinner">
              <div className="dot1"></div>
              <div className="dot2"></div>
            </div>
          );
        default:
          return (
            <a 
              href="javascript:void(0);"
              onClick={this.props.handleLoadOlderDumps}
              className="link-black centered"
            >
              Load older dumps
            </a>
            );
      }};

      return (
        <article className="content-centered">
          {node()}
        </article>
      );
    }
  }

  return LoadOlderDumps;
});