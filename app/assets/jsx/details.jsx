/** @jsx React.DOM */

define(['react', 'jquery', 'tagging', 'tags'], function(React, $, withTagging, Tags) {
  class DetailsContainer extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        details: { 
          tagging: { 
            tags: []
          }
        }, 
      };

      this.loadDetailsFromServer = this.loadDetailsFromServer.bind(this);
    }
    
    render() {
      return (<DetailsWithTagging details={this.state.details} tagging={this.state.details.tagging} />);
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
    constructor(props) {
      super(props);
    }

    componentWillReceiveProps(nextProps) {
      this.setState({tags: nextProps.tagging.tags});
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
        tags = {this.props.tags}
        handleAddTag = {this.props.handleAddTag}
        handleRemoveTag = {this.props.handleRemoveTag} />
        </h1>
        <pre>
        {this.props.details.content}
        </pre>
        </section>
        </article>
      );
    }

  };
  const DetailsWithTagging = withTagging(Details);
  return DetailsContainer;
});
