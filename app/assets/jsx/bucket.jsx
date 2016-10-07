/** @jsx React.DOM */

define(['react', 'tagging', 'tags', 'calendar', 'notes', 'dump'],
  function(React, Tagging, Tags, Calendar, Notes, Dump) {

  var Bucket = React.createClass({
    mixins: [Tagging],

    propTypes: {
      id: React.PropTypes.number.isRequired,
      url: React.PropTypes.string.isRequired,
      name: React.PropTypes.string.isRequired,
      dumps: React.PropTypes.arrayOf(
        React.PropTypes.shape({
          id: React.PropTypes.number.isRequired,
          isNew: React.PropTypes.bool,
          ageLabel: React.PropTypes.string,
          filename: React.PropTypes.string
        })
      ),

      notes: React.PropTypes.string,
    },

    render: function() {
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
            tags = {this.getTags()}
            handleAddTag = {this.handleAddTag}
            handleRemoveTag = {this.handleRemoveTag} />
          </h1>

          <div className="dump-container">
            <Calendar bucketId={this.props.id} hits={this.props.hits} />
            {dumpNodes}
          </div>
          <Notes bucketId={this.props.id} notes={this.props.notes}/>
        </article>
      );
    }
  });


  return Bucket;
});
