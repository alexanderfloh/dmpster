/** @jsx React.DOM */

define(['react'], 
  function(React) {
    const AppView = ({buckets}) => {
      return (
        <ul>
          {buckets.map(bucket => (
            <li>{bucket.text}</li>
          ))}
        </ul>
      );
    }

    // AppView.propTypes = {
    //   buckets: PropTypes.arrayOf(
    //     PropTypes.shape({
    //       text: PropTypes.string.isRequired
    //     })
    //   )
    // };
    return AppView;
  }
);