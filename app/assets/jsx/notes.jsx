/** @jsx React.DOM */

define(['react', 'marked', 'highlight'],
  function(React, marked, highlight) {
    var Notes = React.createClass({
      propTypes: {
        notes: React.PropTypes.string,
        bucketId: React.PropTypes.number.isRequired,
      },

      getInitialState: function() {
        return {
          value: this.props.notes,
          editing: false,
        };
      },

      componentWillReceiveProps: function(nextProps) {
        if(this.state.editing) {
          //TODO: handle conflict
        }
        else {
          if(!this.state.pendingText || nextProps.notes === this.state.pendingText) {
            this.setState({
              value: nextProps.notes,
              editing: this.state.editing,
              pendingText: ''
            });
          }
        }
      },

      componentDidMount: function() {
        marked.setOptions({
          highlight: function (code) {
            return highlight.highlightAuto(code).value;
          }
        });
      },

      handleChange: function(event) {
        this.setState({
          value: event.target.value,
          editing: this.state.editing,
          pendingText: this.state.pendingText
          });
      },

      handleEditClick: function(event) {
        this.setState({
          value: this.state.value,
          editing: true,
          pendingText: this.state.pendingText
        });
      },

      submitChange: function(event) {
        $.post('/dmpster/bucket/' + this.props.bucketId + '/updateNotes',
          {notes: this.state.value}
        );

        this.setState({
          value: this.state.value,
          editing: false,
          pendingText: this.state.value
        });
        event.preventDefault();
      },

      handleCancel: function(event) {
        this.setState({
          value: this.state.value,
          editing: false,
          pendingText: this.state.pendingText
        });
        event.preventDefault();
      },

      render: function() {
        var value = this.state.pendingText ? this.state.pendingText : this.state.value;
        var renderer = new marked.Renderer();

        renderer.paragraph = function(text) {
          return (text
            .replace(/(DE[\s]*([\d]+))/gi, '<a href="https://rally1.rallydev.com/#/search?keywords=DE$2" target="_blank">DE$2</a>')
            .replace(/(RPI[\s]*([\d]+))/gi, '<a href="http://pivotalrpi/rpi.asp?w=1&bRPI=Display+RPI+Number&r=$2" target="_blank">RPI$2</a>')
            .replace(/(rST[\s]*([\d]+))/gi, '<a href="http://lnz-phabricator.microfocus.com/rST$2" target="_blank">rST$2</a>')
          );
        };

        var rawMarkup = marked(value, { sanitize: true, renderer: renderer });
        var updating = this.state.pendingText ? (
          <div className="spinner">
          <div className="dot1"></div>
          <div className="dot2"></div>
        </div>) : null;

        if(this.state.editing) {
          return (
            <div className="notes">
              <form onSubmit={this.submitChange}>
                <textarea value={value} onChange={this.handleChange} rows="10"></textarea>
                <input type="submit"/>
                <button onClick={this.HandleCancel}>Cancel</button>
              </form>
              <span id="markdown-preview" dangerouslySetInnerHTML={{__html: rawMarkup}} />
            </div>
          );
        }
        else if (!this.props.notes) {
          return (
            <div className="notes-empty">
              <div className="edit-bar">
              <a
                href="javascript:void(0);"
                onClick={this.handleEditClick}>
                click to add notes
              </a>
              </div>
            </div>
          );
        }
        else {
          return (
            <div className="notes">
              <span id="markdown-preview" dangerouslySetInnerHTML={{__html: rawMarkup}} />
              <div className="edit-bar">
              <a
                href="javascript:void(0);"
                onClick={this.handleEditClick}>
                edit
              </a>
              {updating}
              </div>
            </div>
          );
        }
      }
    });
    return Notes;
  }
);
