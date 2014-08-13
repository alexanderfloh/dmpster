requirejs.config({
  paths: {
    'jquery': '../lib/jquery/jquery',
    'jquery.ui.widget': '../jQuery-File-Upload-8.8.5/js/vendor/jquery.ui.widget',
    'jquery.fileupload': '../jQuery-File-Upload-8.8.5/js/jquery.fileupload',
    'react': '../lib/react/react-with-addons',
    'tagging': '../jsx/tagging',
    'tags': '../jsx/tags',
    'Bucket': '../jsx/bucket',
    'buckets': '../jsx/buckets',
    'view-bucket': '../jsx/viewBucket',
    'details': '../jsx/details'
  }
});

define(function(require) {
  var jQuery = require('jquery'),
  jQueryUiWidget = require('jquery.ui.widget'),
  jQueryFileUpload = require('jquery.fileupload'),
  jQueryBalloon = require('jquery.balloon'),
  React = require('react'),
  Tagging = require('tagging'),
  Tags = require('tags'),
  Bucket = require('Bucket'),
  Buckets = require('buckets');
  menu = require('menu');

  React.renderComponent(
        Buckets.Buckets(
          { url:"/dmpster/search.json/" + searchString, pollInterval:5000 }),
        document.getElementById('content'));

  $(function() {
    var holder = $('body').get(0);
    holder.ondragover = function() {
      $('#holder').addClass('dragging');
      event.preventDefault();
    };
    holder.ondragleave = function(dataTransfer) {
      $('#holder').removeClass('dragging');
      event.preventDefault();
    };
    holder.ondrop = function(e) {
      $('#holder').removeClass('dragging');
    };
  });

//Create a clone of the menu, right next to original.
  $('.cloned').css('position','fixed').css('left','0').css('top','0');

  stickMenu();
  jQuery( window ).resize(function() {stickMenu();});
  jQuery( window ).scroll(function() {stickMenu();});


  function stickMenu() {

    var orgElementPos = $('.original').offset();
    orgElementTop = orgElementPos.top;

    stickyTop = 0;

    if ($(window).scrollTop() >= (orgElementTop - stickyTop)) {
      // scrolled past the original position; now only show the cloned, sticky element.

      // Cloned element should always have same left position and width as original element.
      orgElement = $('.original');
      coordsOrgElement = orgElement.offset();
      leftOrgElement = coordsOrgElement.left;
      widthOrgElement = orgElement.width();

      $('.cloned').css('left',leftOrgElement+'px').css('top',stickyTop+'px').css('width',widthOrgElement+'px').show();
      $('.original').css('visibility','hidden');
    } else {
      // not scrolled past the menu; only show the original menu.
      $('.cloned').hide();
      $('.original').css('visibility','visible');
    }
  }

});
