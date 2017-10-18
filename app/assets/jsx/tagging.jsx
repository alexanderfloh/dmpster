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

        this.handleClickOnRemove = this.handleClickOnRemove.bind(this);
        this.handleClickOnArchive = this.handleClickOnArchive.bind(this);
      }

      hasTag(tagName) {
        return this.getTags().some(function(tag) { return tag.name === tagName });
      }

      getTags() {
        return this.props.tagging.tags;
      }

      isMarkedForDeletion() {
        return this.hasTag(markedForDeletion);
      }

      isArchived() {
        return this.hasTag(keepForever);
      }

      handleClickOnRemove() {
        if(this.isMarkedForDeletion()) {
          this.props.handleRemoveTag(this.props.id, markedForDeletion, this.props.tagging.removeTagUrl);
        }
        else {
          this.props.handleAddTag(this.props.id, markedForDeletion, this.props.tagging.addTagUrl);
        }
      }

      handleClickOnArchive() {
        if(this.isArchived()) {
          this.props.handleRemoveTag(this.props.id, keepForever, this.props.tagging.removeTagUrl);
        }
        else {
          this.props.handleAddTag(this.props.id, keepForever, this.props.tagging.addTagUrl);
        }
      }

      render () {
        let newProps = Object.assign({ 
          tags: this.getTags(),
          handleClickOnArchive: this.handleClickOnArchive,
          handleClickOnRemove: this.handleClickOnRemove,
        }, this.props)
        return <WrappedComponent {...newProps} {...this.state} />;
      }
    };
  };
  return withTagging;
});
