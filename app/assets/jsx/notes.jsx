/** @jsx React.DOM */

define(['react', 'marked', 'highlight'],
  function(React, marked, highlight) {
    class Notes extends React.Component {
      // propTypes: {
      //   notes: React.PropTypes.string,
      //   bucketId: React.PropTypes.number.isRequired,
      // },

      constructor(props) {
        super(props);
        this.state = {
          value: props.notes,
          editing: false,
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleEditClick = this.handleEditClick.bind(this);
        this.submitChange = this.submitChange.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
      }

      componentWillReceiveProps(nextProps) {
        if(this.state.editing) {
          //TODO: handle conflict
        }
        else {
          if(!this.state.pendingText || nextProps.notes === this.state.pendingText) {
            this.setState({
              value: nextProps.notes,
              pendingText: ''
            });
          }
        }
      }

      componentDidMount() {
        marked.setOptions({
          highlight: function (code) {
            return highlight.highlightAuto(code).value;
          }
        });
      }

      handleChange(event) {
        this.setState({
          value: event.target.value,
        });
      }

      handleEditClick(event) {
        this.setState({
          editing: true,
        });
      }

      submitChange(event) {
        event.preventDefault();
        this.props.setNotes(this.props.bucketId, this.state.value);

        this.setState({
          editing: false,
        });
      }

      handleCancel(event) {
        event.preventDefault();

        this.setState({
          editing: false,
        });
      }

      componentDidUpdate() {
        if(this.state.editing) {
          this.refs.notesEdit.focus();
        }
      }

      render() {
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
              <h3>Preview</h3>
              <span id="markdown-preview" dangerouslySetInnerHTML={{__html: rawMarkup}} />
              <form onSubmit={this.submitChange}>
                <textarea value={value} onChange={this.handleChange} rows="10" ref="notesEdit"></textarea>
                <input type="submit"/>
                <button onClick={this.HandleCancel}>Cancel</button>
              </form>
              
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
    };
    return Notes;
  }
);
