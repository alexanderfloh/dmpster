/** @jsx React.DOM */

define(['react', 'tagging', 'tags', 'calendar', 'notes', 'dump'],
  function(React, TaggingEnhance, Tags, Calendar, Notes, Dump) {

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
      this.state = {
        tags: props.tagging.tags,
        optimisticAdd: [],
        optimisticRemove: [],
      };
      this.handleAddTag = this.handleAddTag.bind(this);
      this.handleRemoveTag = this.handleRemoveTag.bind(this);
    }

    componentWillReceiveProps(newProps) {
      var removeAllFromArray = function(arr, toRemove) {
        return arr.filter(function(elem) {return toRemove.indexOf(elem) === -1;});
      }

      this.setState({
        tags: newProps.tagging.tags,
        optimisticAdd: removeAllFromArray(this.state.optimisticAdd, newProps.tagging.tags),
        optimisticRemove: this.state.optimisticRemove.filter(
          function(elem) {
            return newProps.tagging.tags.some(function(newTag) {
              return elem.name === newTag.name;
              })
            })
      });
    }  

    hasTag(tagName) {
      var tags = this.state.tags;
      return tags.some(function(tag) { return tag.name === tagName });
    }

    getTags() {
      var optimisticRemove = this.state.optimisticRemove;
      return this.state.tags.concat(this.state.optimisticAdd).filter(function(elem) {
        // filter elements that are contained in optimisticRemove
        return !optimisticRemove.some(function(elemToRemove){
           return elem.name === elemToRemove.name;
        });
      });
    }

    isMarkedForDeletion() {
      return this.hasTag(this.markedForDeletion);
    }

    isArchived() {
      return this.hasTag(this.keepForever);
    }

    handleClickOnRemove() {
      if(this.isMarkedForDeletion()) {
        this.handleRemoveTag(this.markedForDeletion);
      }
      else {
        this.handleAddTag(this.markedForDeletion);
      }
    }

    handleClickOnArchive() {
      if(this.isArchived()) {
        this.handleRemoveTag(this.keepForever);
      }
      else {
        this.handleAddTag(this.keepForever);
      }
    }

    handleAddTag(tagName) {
      var tags = this.state.tags;
      if(!this.hasTag(tagName)) {
        this.setState({tags:
          React.addons.update(tags,
            {$push: [{name: tagName}]}
            )});
      }
      $('datalist#tags').append('<option>' + tagName + '<option>');
      $.ajax({
        type : 'POST',
        url : this.props.tagging.addTagUrl +
        encodeURIComponent(tagName)
      });
    }

    handleRemoveTag(tagName) {
      var update = React.addons.update;
      var tags = this.state.tags;
      var newTags = tags.filter(function(elem) { return elem.name !== tagName; });
      var optimisticRemove = update(this.state.optimisticRemove, {$push: [{name: tagName}]});
      this.setState({
        tags: this.state.tags,
        optimisticAdd: this.state.optimisticAdd,
        optimisticRemove: optimisticRemove
      });
      $.ajax({
        type : 'POST',
        url :
        this.props.tagging.removeTagUrl + encodeURIComponent(tagName)
      });
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
  };
  
  return Bucket;
});
