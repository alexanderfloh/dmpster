/** @jsx React.DOM */

define(['require', 'react', 'tagging', 'tags', 'd3', 'calHeatmap'],
  function(require, React, Tagging, Tags, d3, CalHeatMap) {

  var Bucket = React.createClass({
    mixins: [Tagging],

    componentWillMount: function() {
      var that = this;
      var cal = new CalHeatMap();
      $.ajax({
        url: '/dmpster/bucket/' + that.props.key + '/hits.json',

      }).done(function(data){
        cal.init({
          data: data,
          itemSelector: '#cal-heatmap' + that.props.key,
          domain: 'month',
          range : 3,
          start: new Date().setMonth(new Date().getMonth() - 2),
          displayLegend: false,
          scale: [0, 1, 10, 20]
        });
      });
    },

    render: function() {
      var dumpNodes = this.props.dumps.map(function(dump) {
        return <Dump key={dump.id} dump={dump} tagging={dump.tagging}></Dump>;
      });
      var chartId = "cal-heatmap" + this.props.key;
      return (
        <article id={this.props.id}>
        <h1>
        <a href={this.props.url}>
        {this.props.name}<br/>
        </a>
        <Tags
        tags = {this.state.tags}
        handleAddTag = {this.handleAddTag}
        handleRemoveTag = {this.handleRemoveTag} />
        </h1>
        <div id={chartId}></div>
        <div className="dump-container">
        {dumpNodes}
        </div>
        </article>
      );
    }
  });

  var Dump = React.createClass({
    mixins: [Tagging],

    render: function() {
      var cx = React.addons.classSet;
      var classes = cx({
        'dmp': true,
        'new': this.props.dump.isNew
      });
      return (
        <section className={classes}>
        <h1>
        <a href={this.props.dump.dmpUrl} download={this.props.dump.filename}>
        <img src="/assets/images/download.svg" title={'download ' + this.props.dump.filename} width="20px" height="20px"></img>
        </a>
        <a href={"/dmpster/dmp/" + this.props.dump.id + "/details"}>
        {this.props.dump.filename}
        </a>
        </h1>
        <Tags
        tags = {this.state.tags}
        handleAddTag = {this.handleAddTag}
        handleRemoveTag = {this.handleRemoveTag} />
        <time>{this.props.dump.ageLabel}</time>
        <span className="side-menu">
        <a
        className="remove-dump"
        href="javascript: void(0);"
        onClick={this.handleClickOnRemove} >
        <img src="/assets/images/delete.svg" title="mark for deletion" width="35px" height="35px"></img>
        </a>
        <a
        className="archive-dump"
        href="javascript: void(0);"
        onClick={this.handleClickOnArchive} >
        <img src="/assets/images/archive.svg" title="keep forever" width="35px" height="35px"></img>
        </a>
        </span>
        </section>
      );
    }
  });
  return Bucket;
});
