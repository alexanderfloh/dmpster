/**
/**
* @jsx React.DOM
*/

define(['react', 'jquery'], function(React, $) {
  const markedForDeletion = 'marked for deletion';
  const keepForever = 'keep forever';

  return TaggingEnhance = ComposedComponent => class extends React.Component {
    

    constructor(props) {
      this.state = {
        tags: props.tagging.tags,
        optimisticAdd: [],
        optimisticRemove: [],
      };
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

    render () {
      let newProps = Object.assign({ getTags: this.getTags }, this.props)
      return <ComposedComponent {...newProps} {...this.state} />;
    }
  };
});
