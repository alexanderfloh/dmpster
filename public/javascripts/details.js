/** @jsx React.DOM */

var DetailsContainer = React.createClass({
  getInitialState: function() {
    return {details: { }, tagging: { tags: []}};
  },
  
  render: function() {
    return (<Details details={this.state.details} tagging={this.state.tagging} />);
  },
  
  componentWillMount: function() {
    this.loadDetailsFromServer();
    setInterval(this.loadDetailsFromServer, this.props.pollInterval);
  },
  
  loadDetailsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      success: function(data) {
        this.setState({ details: data, tagging: data.tagging });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  }
  
});

var Details = React.createClass({
  mixins: [TaggingMixin],

  componentWillReceiveProps: function(nextProps) {
    this.setState({tags: nextProps.tagging.tags});
  },
  
  render: function() {
    return(
      <article>
      <h1>{this.props.details.filename}</h1>
      
      <section className="details">
        <h1>
          <a href="downloadPath" download>
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
  
});
