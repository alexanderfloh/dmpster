/** @jsx React.DOM */

define(['react', 'tagging', 'tags'],
  function(React, withTagging, Tags) {

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
        var cx = React.addons.classSet;
        var tagNames = this.props.tags.map(function(elem) {
          return elem.name;
        });
        var tagsFiltered = this.props.tags.filter(function(elem){
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
            handleAddTag = {this.props.handleAddTag}
            handleRemoveTag = {this.props.handleRemoveTag} />
            <div className="side-menu">
              <a href={this.props.dump.dmpUrl} download={this.props.dump.filename}>
                <img src="/assets/images/download.svg" title={'download ' + this.props.dump.filename} ></img>
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
