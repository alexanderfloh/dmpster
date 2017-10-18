/**
* @jsx React.DOM
*/

define(['react', 'classnames'], function(React, classNames) {
  class AnalyzingDumps extends React.Component {
    render() {
      const dumpNodes = this.props.analyzingDumps.map(dump => {
        return (
          <section key={dump} className="dmp processing">
          <h1>
          {dump}
          </h1>
          <div className="spinner">
            <div className="dot1"></div>
            <div className="dot2"></div>
          </div>
          </section>
        );
      });

      const className = classNames({hidden: !this.props.analyzingDumps.size});
      return (
        <article id="processing" className={className}>
          <h1>
            Currently processing...
            <br/>
          </h1>
          {dumpNodes}
        </article>
      );
    }
  };

  return AnalyzingDumps;
});