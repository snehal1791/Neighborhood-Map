'use strict';

var map;

// TODO: Complete the following function to initialize the map
var markers = [];

// foursquareIDs
var clientID = 'Z3LMT4TQ4J0IKMWTELZCAIAA4URF11IR0CRKCF3FC0SMVG52';
var clientSecret = 'VYYP3AXD23YKSJIVAEFGOLKLEOUWYOSDFKFUKMLLLICXDNAI';

//locations of popular places in Italy and Croatia
var locations = [

  {
    title: 'Orzo Bruno',
    category:'Pub',
    location: {lat: 43.717824, lng: 10.403140}
  },
  {
    title: 'Gelateria Primavera',
    category:'ice cream parlor',
    location: {lat: 40.626326, lng: 14.374942}
  },
  {
    title: 'Emporio Del Gusto',
    category:'bar',
    location: {lat: 42.563316, lng: 12.645658}
  },

  {
    title: 'Cremeria Santo Stefan',
    category: 'ice cream parlor',
    location: {lat: 44.488246, lng: 11.352202}
  },

  {
    title: 'Hula hula beach & bar',
    category:'bar',
    location: {lat: 43.1715, lng: 16.4314}
  },
  {
    title: 'Hemingway Lounge Bar',
    category:'bar',
    location: {lat: 45.809955, lng: 15.970962}
  },
  {
    title: 'Venice Jazz Club',
    category: 'bar',
    location: {lat: 45.433316, lng: 12.323822}
  },

];

// initialize google map
function initMap(){
  map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 45.1, lng: 15.2 },
          zoom: 12,
          mapTypeControl: false
        });
  var bounds = new google.maps.LatLngBounds();

  // pop-up window for markers
  var largeInfowindow = new google.maps.InfoWindow();

  // initialize each marker position
  for(var i=0; i < locations.length; i++){
    var position = locations[i].location;
    var title = locations[i].title;
    var marker = new google.maps.Marker({
      position: position,
      title: title,
      id: i
    });

    /* add click event listener to each marker.
      Marker will BOUNCE according to the change in the event of the marker
    */
    marker.addListener('click', function(){
      toggleBounce(this, marker);
      populateInfoWindow(this, largeInfowindow);
    });
    // add marker attribute to each of the locations
    locations[i].marker = marker;

    marker.setMap(map);
    // Extend the boundaries of the map for each marker and display the marker
    bounds.extend(marker.position);
  }

  map.fitBounds(bounds);
  // Adjust map zoom and position as the window resizes
  google.maps.event.addDomListener(window, 'resize', function() {
      map.fitBounds(bounds);
  });
  ko.applyBindings(new ViewModel());
}

// Marker Bounces as clicked
function toggleBounce(marker) {
  if(marker.getAnimation() == null) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }
  else {
    marker.setAnimation(google.maps.Animation.NULL);
  }
}

// Google Map Request Error Handling
function googleError() {
  alert("\n*********!!! ERROR !!!*********\n\nGoogle Map Did Not Load Properly");
  $(".search-area, .list-heading, .map-view").remove();
  $('.sidebar').prepend('<div style="text-align: center; font-size: 20px;">Google Map Error</div>');
}

function populateInfoWindow(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    infowindow.marker = marker;

    // Use of foursquare API to populate info window
    var foursquareUrl = 'https://api.foursquare.com/v2/venues/search?ll=' + marker.position.lat() + ',' + marker.position.lng() + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20161212' ;
    $.getJSON(foursquareUrl, function(data){
      // save the response from foursquare
      var foursquareResponse = data.response.venues[0];
      // add information to info window

      infowindow.setContent('<div class="infowindow-box"><div class="infowindow-heading"><strong>Name: <em style="color:blue">' + marker.title+ '</em></strong></div>' +
        '<div><strong>FourSquare Name: </strong>' + foursquareResponse.name + '</div>' +
        '<div><strong>Category: </strong>' + foursquareResponse.categories[0].name + '</div>' +
        '<div><strong>Address: </strong>' + foursquareResponse.location.formattedAddress + '</div></div>' );
      // open info window
      infowindow.open(map, marker);
    }).fail(function(){
      // if failed to open info window throw error
      alert("\n*********!!! ERROR !!!*********\n\nThere is some problem in retrieving data from FourSquare");
    });

    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
  }
  else if(marker.getAnimation() != null){
      infowindow.open(map, marker);
  }
  else {
    infowindow.close();
  }
  // close info window if the marker is clicked again
  // else {
  //   infowindow.close();
  // }
  // https://api.foursquare.com/v2/venues/search?ll=45.433316,12.323822&client_id=Z3LMT4TQ4J0IKMWTELZCAIAA4URF11IR0CRKCF3FC0SMVG52&client_secret=VYYP3AXD23YKSJIVAEFGOLKLEOUWYOSDFKFUKMLLLICXDNAI&v=20161212
}

// observable data for location variable
var Location = function(data){
  this.title = ko.observable(data.title);
  this.category = ko.observable(data.category);
  this.lat = ko.observable(data.location.lat);
  this.lng = ko.observable(data.location.lng);
  this.marker = ko.observable(data.marker);
};

var ViewModel = function(){
  var self = this;
  // create empty observable array for loation
  this.locationList = ko.observableArray([]);
  // for every location populate the observable array list
  locations.forEach(function(locationItem){
    self.locationList.push(new Location(locationItem));
  });
  // create sidebar list and trigger click event on each location name when clicked
  this.clickLocation = function(clickedData){
    var clickedmarker = clickedData.marker();
    google.maps.event.trigger(clickedmarker, 'click');
  };

  // filter the sidebarlist when user types in the name of the location
  this.inputValue = ko.observable("");
  this.filterList = ko.computed(function(){
    if(self.inputValue !== ""){
      // convert the input values to lower case
      var inputString = self.inputValue().toLowerCase();
      self.locationList.removeAll();
      // for every location search the input value
      locations.forEach(function(locationItem){
        // empty the location list as user types
        locationItem.marker.setMap(null);
        // check if user input matches the location name
        if(locationItem.title.toLowerCase().includes(inputString)){
          // if there is a match then add that location and set the map accordingly
          self.locationList.push(new Location(locationItem));
          locationItem.marker.setMap(map);
        }
     });
    }
  }, this);
};
