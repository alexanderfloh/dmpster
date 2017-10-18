/** @jsx React.DOM */

define(['react', 'tagging', 'tags', 'classnames'],
  function(React, withTagging, Tags, classNames) {

    class Dump extends React.Component {

    // propTypes: {
    //   dump: React.PropTypes.shape({
    //     id: React.PropTypes.number.isRequired,
    //     isNew: React.PropTypes.bool,
    //     ageLabel: React.PropTypes.string,
    //     filename: React.PropTypes.string
    //   })
    // },

      constructor(props) {
        super(props);  
      }

      render() {
        var tagNames = this.props.tags.map(function(elem) {
          return elem.name;
        });
        var tagsFiltered = this.props.tags.filter(function(elem){
          return elem.name !== 'keep forever' && elem.name !== 'marked for deletion';
        });
        var classes = classNames({
          'dmp': true,
          'new': this.props.isNew,
          'archived': tagNames.indexOf('keep forever') != -1,
          'delete': tagNames.indexOf('marked for deletion') != -1
        });
        return (
          <section className={classes}>
            <h1>
              <a href={"/dmpster/dmp/" + this.props.id + "/details"}>
                {this.props.filename}
              </a>
            </h1>
            <time>{this.props.ageLabel}</time>
            <Tags
            containerId = {this.props.id}
            tags = {tagsFiltered}
            handleAddTag = {this.props.handleAddTag}
            handleRemoveTag = {this.props.handleRemoveTag}
            addTagUrl = {this.props.tagging.addTagUrl} 
            removeTagUrl = {this.props.tagging.removeTagUrl}
            />
            <div className="side-menu">
              <a href={this.props.dmpUrl} download={this.props.filename}>
                <img src="/assets/images/download.svg" title={'download ' + this.props.filename} ></img>
              </a>

              <a
              className="archive-dump"
              href="javascript: void(0);"
              onClick={this.props.handleClickOnArchive} >
                <img src="/assets/images/archive.svg" title="keep forever"></img>
              </a>
              <a
              className="remove-dump"
              href="javascript: void(0);"
              onClick={this.props.handleClickOnRemove} >
                <img src="/assets/images/delete.svg" title="mark for deletion"></img>
              </a>
            </div>
          </section>
        );
      }
    }
    
    const DumpWithTagging = withTagging(Dump);
    return DumpWithTagging;
  }
);
