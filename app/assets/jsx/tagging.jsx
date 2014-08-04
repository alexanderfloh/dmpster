/**
/**
* @jsx React.DOM
*/

define(['react', 'jquery'], function(React, $) {
  var TaggingMixin = {
    getInitialState: function() {
      return {tags: this.props.tagging.tags};
    },

    handleClickOnRemove: function() {
      this.handleAddTag('marked for deletion');
    },

    handleClickOnArchive: function() {
      this.handleAddTag('keep forever');
    },

    handleAddTag: function(tagName) {
      var tags = this.state.tags;
      if(!tags.some(function(tag) { return tag.name === tagName; })) {
        var
        newTags = tags.concat([{name: tagName}]);
        this.setState({tags: newTags});
      }
      $('datalist#tags').append('<option>' + tagName + '<option>');
      $.ajax({
        type : 'POST',
        url : this.props.tagging.addTagUrl +
        encodeURIComponent(tagName)
      });
    },

    handleRemoveTag: function(tagName) {
      var tags = this.state.tags;
      var
      newTags = tags.filter(function(elem) { return elem.name !== tagName; });
      this.setState({tags: newTags});
      $.ajax({
        type : 'POST',
        url :
        this.props.tagging.removeTagUrl + encodeURIComponent(tagName)
      });
    }
  };
  
  return TaggingMixin;
});
