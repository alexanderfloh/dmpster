/**
/**
* @jsx React.DOM
*/

define(['react', 'jquery'], function(React, $) {
  var TaggingMixin = {
    markedForDeletion: 'marked for deletion',
    keepForever: 'keep forever',

    getInitialState: function() {
      return {
        tags: this.props.tagging.tags,
        optimisticAdd: [],
        optimisticRemove: [],
      };
    },

    componentWillReceiveProps: function(newProps) {
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
    },

    getTags: function() {
      var optimisticRemove = this.state.optimisticRemove;
      return this.state.tags.concat(this.state.optimisticAdd).filter(function(elem) {
        // filter elements that are contained in optimisticRemove
        return !optimisticRemove.some(function(elemToRemove){
           return elem.name === elemToRemove.name;
        });
      });
    },

    hasTag: function(tagName) {
      var tags = this.state.tags;
      return tags.some(function(tag) { return tag.name === tagName });
    },

    isMarkedForDeletion: function() {
      return this.hasTag(this.markedForDeletion);
    },

    isArchived: function() {
      return this.hasTag(this.keepForever);
    },

    handleClickOnRemove: function() {
      if(this.isMarkedForDeletion()) {
        this.handleRemoveTag(this.markedForDeletion);
      }
      else {
        this.handleAddTag(this.markedForDeletion);
      }

    },

    handleClickOnArchive: function() {
      if(this.isArchived()) {
        this.handleRemoveTag(this.keepForever);
      }
      else {
        this.handleAddTag(this.keepForever);
      }
    },

    handleAddTag: function(tagName) {
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
    },

    handleRemoveTag: function(tagName) {
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
  };

  return TaggingMixin;
});
