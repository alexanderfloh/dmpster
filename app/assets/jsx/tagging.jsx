/**
/**
* @jsx React.DOM
*/

define(['react', 'jquery'], function(React, $) {
  const markedForDeletion = 'marked for deletion';
  const keepForever = 'keep forever';

  function withTagging(WrappedComponent) {

    return class extends React.Component {
    
      constructor(props) {
        super(props);
        this.state = {
          tags: props.tagging.tags,
          optimisticAdd: [],
          optimisticRemove: [],
        };

        this.handleClickOnRemove = this.handleClickOnRemove.bind(this);
        this.handleClickOnArchive = this.handleClickOnArchive.bind(this);
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

      render () {
        let newProps = Object.assign({ 
          tags: this.getTags(),
          handleAddTag: this.handleAddTag,
          handleRemoveTag: this.handleRemoveTag,
          handleClickOnArchive: this.handleClickOnArchive,
          handleClickOnRemove: this.handleClickOnRemove,
        }, this.props)
        return <WrappedComponent {...newProps} {...this.state} />;
      }
    };
  };
  return withTagging;
});
