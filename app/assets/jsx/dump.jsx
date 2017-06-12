/** @jsx React.DOM */

define(['react', 'tagging', 'tags'],
  function(React, TaggingEnhance, Tags) {

  const markedForDeletion = 'marked for deletion';
  const keepForever = 'keep forever';

  class Dump extends React.Component {
    // mixins: [Tagging],

    // propTypes: {
    //   dump: React.PropTypes.shape({
    //     id: React.PropTypes.number.isRequired,
    //     isNew: React.PropTypes.bool,
    //     ageLabel: React.PropTypes.string,
    //     filename: React.PropTypes.string
    //   })
    // },

    constructor(props) {
      this.state = {
        tags: props.tagging.tags,
        optimisticAdd: [],
        optimisticRemove: [],
      };
    
      this.handleAddTag = this.handleAddTag.bind(this);
      this.handleRemoveTag = this.handleRemoveTag.bind(this);
      this.handleClickOnArchive = this.handleClickOnArchive.bind(this);
      this.handleClickOnRemove = this.handleClickOnRemove.bind(this);
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
      return this.hasTag(markedForDeletion);
    }

    isArchived() {
      return this.hasTag(keepForever);
    }

    handleClickOnRemove() {
      if(this.isMarkedForDeletion()) {
        this.handleRemoveTag(markedForDeletion);
      }
      else {
        this.handleAddTag(markedForDeletion);
      }
    }

    handleClickOnArchive() {
      if(this.isArchived()) {
        this.handleRemoveTag(keepForever);
      }
      else {
        this.handleAddTag(keepForever);
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
        var cx = React.addons.classSet;
        var tagNames = this.getTags().map(function(elem) {
          return elem.name;
        });
        var tagsFiltered = this.getTags().filter(function(elem){
          return elem.name !== 'keep forever' && elem.name !== 'marked for deletion';
        });
        var classes = cx({
          'dmp': true,
          'new': this.props.dump.isNew,
          'archived': tagNames.indexOf('keep forever') != -1,
          'delete': tagNames.indexOf('marked for deletion') != -1
        });
        return (
          <section className={classes}>
            <h1>
              <a href={"/dmpster/dmp/" + this.props.dump.id + "/details"}>
                {this.props.dump.filename}
              </a>
            </h1>
            <time>{this.props.dump.ageLabel}</time>
            <Tags
            tags = {tagsFiltered}
            handleAddTag = {this.handleAddTag}
            handleRemoveTag = {this.handleRemoveTag} />
            <div className="side-menu">
              <a href={this.props.dump.dmpUrl} download={this.props.dump.filename}>
                <img src="/assets/images/download.svg" title={'download ' + this.props.dump.filename} ></img>
              </a>

              <a
              className="archive-dump"
              href="javascript: void(0);"
              onClick={this.handleClickOnArchive} >
                <img src="/assets/images/archive.svg" title="keep forever"></img>
              </a>
              <a
              className="remove-dump"
              href="javascript: void(0);"
              onClick={this.handleClickOnRemove} >
                <img src="/assets/images/delete.svg" title="mark for deletion"></img>
              </a>
            </div>
          </section>
        );
      }
    }
    return Dump;
  }
);
