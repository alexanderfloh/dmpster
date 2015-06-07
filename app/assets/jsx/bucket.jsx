/** @jsx React.DOM */

define(['require', 'react', 'tagging', 'tags', 'd3', 'calHeatmap'],
  function(require, React, Tagging, Tags, d3, CalHeatMap) {

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
        <article id={this.props.id}>
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
        <div className="notes">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur bibendum lacinia sapien, dictum fringilla quam cursus id. Donec ornare nisl at felis pretium hendrerit. Sed in malesuada enim. Proin eros ipsum, consectetur ut ipsum a, condimentum cursus urna. Suspendisse viverra diam et mi iaculis, a eleifend velit maximus. Fusce pulvinar molestie est, a porta orci tempus sit amet. Morbi urna ipsum, laoreet ut tellus eu, gravida euismod augue. Aliquam tristique magna id turpis sodales tempor. Nulla tristique tristique mauris. Nulla facilisi. Fusce eget enim molestie dolor tincidunt laoreet. Quisque mollis pellentesque ultricies. Praesent ut ultrices tortor. Nulla pharetra augue non lacus bibendum aliquet vel quis ligula. Vivamus dui turpis, dignissim eget tincidunt sed, porta eget ipsum. Aenean nibh libero, aliquam eget pellentesque eu, vestibulum non justo.
Pellentesque finibus urna vel mi euismod pretium. Vivamus vel mollis eros, at ultrices magna. Maecenas venenatis mollis purus, eget laoreet nisi ultrices id. Etiam sed arcu vel mi commodo semper et nec quam. Donec euismod vestibulum turpis, aliquet ullamcorper orci vestibulum eget. Morbi in velit venenatis, ultrices enim quis, aliquet urna. Cras vehicula enim at mauris efficitur, ut ullamcorper nisi ullamcorper.

<pre>Nunc velit lectus, ornare non purus vestibulum, sollicitudin dignissim lectus.</pre> Proin et mauris sollicitudin, porta turpis id, imperdiet nulla. Ut orci lorem, convallis in laoreet non, gravida non lorem. Maecenas id ornare nisl. Duis feugiat laoreet nulla, quis porta diam mattis non. Sed egestas risus at dolor placerat lacinia. Morbi nec iaculis odio.

Proin id turpis lacus. Donec lacinia et arcu ut dapibus. Proin eu rhoncus arcu, id vestibulum neque. Donec volutpat tempus urna eget luctus. In lobortis eleifend mi et dapibus. Suspendisse aliquet tincidunt ante, eu sagittis turpis porttitor accumsan. Quisque malesuada at nulla in luctus. In semper id ligula eget accumsan. Duis blandit egestas lobortis.

Donec placerat quis massa ut condimentum. Duis est metus, interdum quis velit sit amet, porta euismod nunc. Sed id metus enim. Suspendisse non erat at metus sollicitudin luctus. Phasellus pulvinar sem libero, sit amet consectetur orci aliquam sit amet. Cras pretium eu nisi vel vestibulum. Vestibulum eget tellus sit amet velit sagittis ultrices nec sed ex. Phasellus a nisl et odio sagittis consequat vitae vel metus. Vivamus efficitur ut lacus ut luctus. Fusce id consequat felis. Fusce aliquam ullamcorper sem gravida condimentum. In ac sem a tellus ultricies volutpat. Aenean auctor justo id urna scelerisque, eu accumsan leo malesuada.


        </div>
        </article>
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
