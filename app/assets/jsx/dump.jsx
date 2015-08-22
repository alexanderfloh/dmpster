/** @jsx React.DOM */

define(['react', 'tagging', 'tags'],
  function(React, Tagging, Tags) {

    var Dump = React.createClass({
      mixins: [Tagging],

      propTypes: {
        dump: React.PropTypes.shape({
          id: React.PropTypes.number.isRequired,
          isNew: React.PropTypes.bool,
          ageLabel: React.PropTypes.string,
          filename: React.PropTypes.string
        })
      },

      render: function() {
        var cx = React.addons.classSet;
        var tagNames = this.getTags().map(function(elem) {
          return elem.name;
        });
        var tagsFiltered = this.getTags().filter(function(elem){
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
              className="archive-dump"
              href="javascript: void(0);"
              onClick={this.handleClickOnArchive} >
                <img src="/assets/images/archive.svg" title="keep forever"></img>
              </a>
              <a
              className="remove-dump"
              href="javascript: void(0);"
              onClick={this.handleClickOnRemove} >
                <img src="/assets/images/delete.svg" title="mark for deletion"></img>
              </a>
            </div>
          </section>
        );
      }
    });
    return Dump;
  }
);
