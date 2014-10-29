/**
/**
* @jsx React.DOM
*/

define(['react', 'jquery'], function(React, $) {
  var Tags = React.createClass({
    getInitialState: function() {
      return {
        inputVisible: false,
        value: ''
      };
    },

    handleInputKeyDown: function(event) {
      if (event.keyCode == 13 || event.which == 13) {
        var domNode = this.refs.tagInput.getDOMNode();
        $(domNode).hideBalloon();

        this.props.handleAddTag(this.state.value);
        this.setState({
          inputVisible: false,
          value: ''
        });
      }
    },

    handleInputBlur: function() {
      var domNode =
      this.refs.tagInput.getDOMNode();
      $(domNode).hideBalloon();

      this.setState({
        inputVisible: false,
        value: ''
      });
    },

    handleInputChange: function(event) {
      this.setState({value: event.target.value});
    },

    handleAddTagClick: function() {
      this.setState({ inputVisible: true });
    },

    componentDidUpdate: function() {
      if(this.state.inputVisible) {
        var
        domNode = this.refs.tagInput.getDOMNode();
        domNode.focus();

        $.balloon.defaults.classname = 'balloon';
        $.balloon.defaults.css = null;
        var balloonContents = '<div>' +
        '<h2>Special tags</h2>' +
        '<ul>' +
        '<li class="keep-forever">keep forever</li>' +
        '<li class="marked-for-deletion">marked for deletion</li>' +
        '</ul>' +
        '</div>';

        $(domNode).showBalloon({
          contents: balloonContents,
          position:
          'right',
          classname: 'balloon'
        });
      }
    },

    render: function() {
      var removeTag = this.props.handleRemoveTag;
      var
      tagNodes = this.props.tags.map(function(tag) {
        return <Tag key={tag.name}
        tag={tag} handleRemoveTag={removeTag}></Tag>;
      });
      if(this.state.inputVisible) {
        return (
          <span id="tags">
          {tagNodes}
          <input type="text"
          ref="tagInput"
          className="tag-input"
          list="tags"
          placeholder="  add a tag&hellip; "
          onKeyDown={this.handleInputKeyDown}
          onChange={this.handleInputChange}
          onBlur={this.handleInputBlur} >
          </input>
          </span>
        );
      } else {
        return(
          <span
          id="tags">
          {tagNodes}
          <a
          href="javascript:void(0);"
          className="tag add"
          onClick={this.handleAddTagClick}>
          add a tag&hellip;
          </a>
          </span>
        );
      }
    }
  });

  var Tag = React.createClass({
    handleRemoveClick: function() {
      this.props.handleRemoveTag(this.props.tag.name);
    },

    render: function() {
      var cx = React.addons.classSet;
      var tagClass =
      this.props.tag.name.split(' ').join('-');
      var classes = cx({
        'tag':
        true,
        'removeable': true
      });
      classes = classes + ' ' + tagClass;
      return (
        <span className={classes}>
        {this.props.tag.name}
        <span className="remove-tag">
        <a href="javascript:void(0);"
        onClick={this.handleRemoveClick} >
        <img src="/assets/images/delete.svg"
        title="remove tag"></img>
        </a>
        </span>
        </span>
      );
    }
  });
  return Tags;
});
