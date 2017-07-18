/** @jsx React.DOM */

define(['react', 'jquery', 'tagging', 'tags'], function(React, $, TaggingMixin, Tags) {
  class DetailsContainer extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        details: { }, 
        tagging: { 
          tags: []
        }
      };

      this.loadDetailsFromServer = this.loadDetailsFromServer.bind(this);
    }
    
    render() {
      return (<Details details={this.state.details} tagging={this.state.tagging} />);
    }

    componentWillMount() {
      this.loadDetailsFromServer();
      setInterval(this.loadDetailsFromServer, this.props.pollInterval);
    }

    loadDetailsFromServer() {
      $.ajax({
        url: this.props.url,
        dataType: 'json',
        success: function(data) {
          this.setState({ details: data });
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
    }

  };

  class Details extends React.Component{
    // mixins: [TaggingMixin],
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

    componentWillReceiveProps(nextProps) {
      this.setState({tags: nextProps.tagging.tags});
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
      return(
        <article>
        <h1>{this.props.details.filename}</h1>

        <section className="details">
        <h1>
        <a href={this.props.details.dmpUrl} download={this.props.details.filename}>
        <img src="/assets/images/download.svg" title={"download "+ this.props.details.filename}></img>
        </a>
        <Tags
        tags = {this.state.tags}
        handleAddTag = {this.handleAddTag}
        handleRemoveTag = {this.handleRemoveTag} />
        </h1>
        <pre>
        {this.props.details.content}
        </pre>
        </section>
        </article>
      );
    }

  };
  return DetailsContainer;
});
