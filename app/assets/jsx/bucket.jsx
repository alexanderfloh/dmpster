/** @jsx React.DOM */

define(['react', 'tagging', 'tags', 'calendar', 'notes', 'dump'],
  function(React, withTagging, Tags, Calendar, Notes, Dump) {

  class Bucket extends React.Component{
    // propTypes: {
    //   id: React.PropTypes.number.isRequired,
    //   url: React.PropTypes.string.isRequired,
    //   name: React.PropTypes.string.isRequired,
    //   dumps: React.PropTypes.arrayOf(
    //     React.PropTypes.shape({
    //       id: React.PropTypes.number.isRequired,
    //       isNew: React.PropTypes.bool,
    //       ageLabel: React.PropTypes.string,
    //       filename: React.PropTypes.string
    //     })
    //   ),

    //   notes: React.PropTypes.string,
    // },

    constructor(props) {
      super(props);
    }

    render() {
      var dumpNodes = this.props.dumps.map(function(dump) {
        return <Dump key={dump.id} dump={dump} tagging={dump.tagging}></Dump>;
      });
      var nameParts;
      if(this.props.name) {
        nameParts = this.props.name.split('!').map(function(part) {
          return <span key={part}>{part} </span>;
        });
      } else {
        nameParts = "";
      }

      return (
        <article id={this.props.id}>
          <h1>
            <a href={this.props.url}>
              {nameParts}<br/>
            </a>
            <Tags
            tags = {this.props.tags}
            handleAddTag = {this.props.handleAddTag}
            handleRemoveTag = {this.props.handleRemoveTag} />
          </h1>

          <div className="dump-container">
            <Calendar bucketId={this.props.id} hits={this.props.hits} />
            {dumpNodes}
          </div>
          <Notes bucketId={this.props.id} notes={this.props.notes}/>
        </article>
      );
    }
  };
  
  return withTagging(Bucket);
});
