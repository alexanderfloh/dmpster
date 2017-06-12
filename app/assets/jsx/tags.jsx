/**
/**
* @jsx React.DOM
*/

define(['react', 'jquery'], function(React, $) {
  class Tags extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        inputVisible: false,
        value: ''
      };

      this.handleInputKeyDown = this.handleInputKeyDown.bind(this);
      this.handleInputChange = this.handleInputChange.bind(this);
      this.handleInputBlur = this.handleInputBlur.bind(this);
      this.handleAddTagClick = this.handleAddTagClick.bind(this);
    }

    handleInputKeyDown(event) {
      if (event.keyCode == 13 || event.which == 13) {
        var domNode = this.refs.tagInput.getDOMNode();
        $(domNode).hideBalloon();

        this.props.handleAddTag(this.state.value);
        this.setState({
          inputVisible: false,
          value: ''
        });
      }
    }

    handleInputBlur() {
      var domNode =
      this.refs.tagInput.getDOMNode();
      $(domNode).hideBalloon();

      this.setState({
        inputVisible: false,
        value: ''
      });
    }

    handleInputChange(event) {
      this.setState({value: event.target.value});
    }

    handleAddTagClick() {
      this.setState({ inputVisible: true });
    }

    componentDidUpdate() {
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
    }

    render() {
      var removeTag = this.props.handleRemoveTag;
      var tagNodes = this.props.tags.map((tag) => 
        (<Tag key={tag.name} tag={tag} handleRemoveTag={removeTag}></Tag>)
      );
      if(this.state.inputVisible) {
        return (
          <span id="tags" className="tag-container">
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
          id="tags" className="tag-container">
          {tagNodes}
          <a
          href="javascript:void(0);"
          className="tag add"
          onClick={this.handleAddTagClick}>
          add a tag
          </a>
          </span>
        );
      }
    }
  }

  class Tag extends React.Component {
    constructor(props) {
      super(props);
      this.handleRemoveClick = this.handleRemoveClick.bind(this);
    }

    handleRemoveClick() {
      this.props.handleRemoveTag(this.props.tag.name);
    }

    render() {
      var cx = React.addons.classSet;
      var tagClass = this.props.tag.name.split(' ').join('-');
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
  }
  return Tags;
});
