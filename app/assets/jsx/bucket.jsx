/** @jsx React.DOM */

define(['require', 'react', 'tagging', 'tags', 'd3', 'calHeatmap', 'marked'],
  function(require, React, Tagging, Tags, d3, CalHeatMap, marked) {

  var Bucket = React.createClass({
    mixins: [Tagging],

    componentWillMount: function() {
      if(this.props.key) {
        var that = this;
        var dt = new Date();
        var currentMonth = dt.getMonth();
        var month = currentMonth;
        var futureDaysInMonth = ['now'];
        var daysOffset = 1;
        dt.setDate(dt.getDate() + daysOffset++);

        while(month === currentMonth) {
          futureDaysInMonth.push(dt);
          dt = new Date();
          dt.setDate(dt.getDate() + daysOffset++);
          month = dt.getMonth();
        }


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
            scale: [0, 1, 10, 20],
            highlight: futureDaysInMonth
          });
        });
      }
    },

    render: function() {
      var dumpNodes = this.props.dumps.map(function(dump) {
        return <Dump key={dump.id} dump={dump} tagging={dump.tagging}></Dump>;
      });
      var nameParts;
      if(this.props.name) {
        nameParts = this.props.name.split('!').map(function(part) {
          return <span key={part}>{part} </span>;
        });
      } else {
        nameParts = "";
      }
      var chartId = "cal-heatmap" + this.props.key;

      return (
        <article id={this.props.key}>
        <h1>
        <a href={this.props.url}>
        {nameParts}<br/>
        </a>
        <Tags
        tags = {this.state.tags}
        handleAddTag = {this.handleAddTag}
        handleRemoveTag = {this.handleRemoveTag} />
        </h1>

        <div className="dump-container">
          <div id={chartId} className="heatmap"></div>
        {dumpNodes}
        </div>
        <Notes bucketId={this.props.key} notes={this.props.notes}/>
        </article>
      );
    }
  });

  var Notes = React.createClass({
    getInitialState: function() {
      return {value: this.props.notes};
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState({value: nextProps.notes});
    },

    handleChange: function(event) {
      this.setState({value: event.target.value});
    },

    submitChange: function(event) {
      $.post('/dmpster/bucket/' + this.props.bucketId + '/updateNotes', {notes: this.state.value});
      event.preventDefault();
    },

    render: function() {
      var value = this.state.value;
      var rawMarkup = marked(value, {sanitize: true});

      return (
        <div className="notes">
          <form onSubmit={this.submitChange}>
            <textarea value={value} onChange={this.handleChange} rows="10"></textarea>
            <input type="submit"/>
          </form>
          <span id="markdown-preview" dangerouslySetInnerHTML={{__html: rawMarkup}} />
        </div>
      );
    }
  });

  var Dump = React.createClass({
    mixins: [Tagging],

    render: function() {
      var cx = React.addons.classSet;
      var tagNames = this.state.tags.map(function(elem) {
        return elem.name;
      });
      var tagsFiltered = this.state.tags.filter(function(elem){
        return elem.name !== 'keep forever' && elem.name !== 'marked for deletion';
      });
      var classes = cx({
        'dmp': true,
        'new': this.props.dump.isNew,
        'archived': tagNames.indexOf('keep forever') != -1,
        'delete': tagNames.indexOf('marked for deletion') != -1
      });
      return (
        <section className={classes}>
        <h1>
        <a href={"/dmpster/dmp/" + this.props.dump.id + "/details"}>
        {this.props.dump.filename}
        </a>
        </h1>
        <time>{this.props.dump.ageLabel}</time>
        <Tags
        tags = {tagsFiltered}
        handleAddTag = {this.handleAddTag}
        handleRemoveTag = {this.handleRemoveTag} />
        <div className="side-menu">
        <a href={this.props.dump.dmpUrl} download={this.props.dump.filename}>
        <img src="/assets/images/download.svg" title={'download ' + this.props.dump.filename} ></img>
        </a>
        <a
        className="remove-dump"
        href="javascript: void(0);"
        onClick={this.handleClickOnRemove} >
        <img src="/assets/images/delete.svg" title="mark for deletion"></img>
        </a>
        <a
        className="archive-dump"
        href="javascript: void(0);"
        onClick={this.handleClickOnArchive} >
        <img src="/assets/images/archive.svg" title="keep forever"></img>
        </a>
        </div>
        </section>
      );
    }
  });
  return Bucket;
});
