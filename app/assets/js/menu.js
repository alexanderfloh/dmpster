define("menu", ['jquery'],
function($) {
  //Create a clone of the menu, right next to original.
  $('.menu').addClass('original')
    .clone()
    .hide()
    .insertAfter('.original')
    .addClass('cloned')
    .removeClass('original')
    .css('position','fixed')
    .css('left','0')
    .css('top','0');

  $('.original > .logo').hide();

  stickMenu();
  jQuery( window ).resize(function() {stickMenu();});
  jQuery( window ).scroll(function() {stickMenu();});

  $( "#search-form" ).on( "submit", function(event) {
    event.preventDefault();
    var searchText = $('#search').val();
    window.location.href = '/dmpster/search/' + encodeURIComponent(searchText);
  });

  function stickMenu() {

    var orgElementPos = $('.original').offset();
    orgElementTop = orgElementPos.top;

    stickyTop = 0;


    if ($(window).scrollTop() >= (orgElementTop - stickyTop)) {
      // scrolled past the original position; now only show the cloned, sticky element.

      if($('.original').css('visibility') === 'visible') {
        // Cloned element should always have same left position and width as original element.
        orgElement = $('.original');
        coordsOrgElement = orgElement.offset();
        leftOrgElement = coordsOrgElement.left;
        widthOrgElement = orgElement.width();

        $('.cloned').css('left',leftOrgElement+'px')
          .css('top',stickyTop+'px')
          .css('width',widthOrgElement+'px')
          .show();
        $('.original').css('visibility','hidden');
        var logo = $('.cloned > .logo');
        logo.animate({ marginLeft: '0' }, 500);
      }
    } else {
      // not scrolled past the menu; only show the original menu.
      if($('.cloned').is(':visible')) {
        $('.cloned > .logo').animate({ marginLeft: '-5em' }, 100, 'swing', function() {
          $('.cloned').hide();
          $('.original').css('visibility','visible');
        });

      }
    }
  }
}
);
