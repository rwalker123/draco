var map = null;
var noPins = true;
function LoadMap(latitude, longitude) {

    var mapOptions = {
        credentials: "AkBXseKhXZx9aqWYyHF5ognpGb5_Z9i1RyH1Z0Pqi6VFyRhjciANULA09DtX8Xef",
        center: new Microsoft.Maps.Location(45.5, -122.5),
        mapTypeId: Microsoft.Maps.MapTypeId.auto,
        zoom: 5
    }

    map = new Microsoft.Maps.Map(document.getElementById("theMap"), mapOptions);

    $(window).unload(function () {
        map.dispose();
    });

    //Add handler for the map click event.
    Microsoft.Maps.Events.addHandler(map, 'click', displayLatLong);

    //try {
    //    // Create the tile layer source
    //    var tileSource = new Microsoft.Maps.TileSource({ uriConstructor: 'http://www.microsoft.com/maps/isdk/ajax/layers/lidar/{quadkey}.png' });

    //    // Construct the layer using the tile source
    //    var tilelayer = new Microsoft.Maps.TileLayer({ mercator: tileSource, opacity: .7 });

    //    // Push the tile layer to the map
    //    map.entities.push(tilelayer);

    //}
    //catch (err) {
    //    alert('Error Message:' + err.message);
    //}

    var center = map.getCenter();
    LoadPin(center, "CP", "Capitol Park");

    // Define the pushpin location
    //var loc = new Microsoft.Maps.Location(latitude, longitude);
    //map.setView({ center: loc, zoom: 10 });

}

function LoadPin(loc, name, description) {
    var pin = new Microsoft.Maps.Pushpin(loc, { text: name });

    // Create the infobox for the pushpin
    pinInfobox = new Microsoft.Maps.Infobox(pin.getLocation(),
        {
            title: name,
            description: description,
            visible: false,
            offset: new Microsoft.Maps.Point(0, 15)
        });

    // Add handler for the pushpin click event.
    Microsoft.Maps.Events.addHandler(pin, 'click', displayInfobox);

    // Add a handler to function that will grey out 
    //    other pins in the collection when a new one is added
    Microsoft.Maps.Events.addHandler(map.entities, 'entityadded', shadePins);

    // Hide the infobox when the map is moved.
    Microsoft.Maps.Events.addHandler(map, 'viewchange', hideInfobox);

    // Add the pushpin and infobox to the map
    map.entities.push(pin);
    map.entities.push(pinInfobox);

    // Center the map on the location
    map.setView({ center: loc, zoom: 10 });
}

function displayInfobox(e) {
    pinInfobox.setOptions({ visible: true });
}

function hideInfobox(e) {
    pinInfobox.setOptions({ visible: false });
}

function displayLatLong(e) {
    addPin(e);

    if (e.targetType == "map") {
        var point = new Microsoft.Maps.Point(e.getX(), e.getY());
        var loc = e.target.tryPixelToLocation(point);
        document.getElementById("textBox").value = loc.latitude + ", " + loc.longitude;
    }
}

function addPin(e) {
    if (e.targetType == "map") {
        var point = new Microsoft.Maps.Point(e.getX(), e.getY());
        var loc = e.target.tryPixelToLocation(point);
        var pin = new Microsoft.Maps.Pushpin(loc);

        map.entities.push(pin);
    }
}

function shadePins(e) {

    if (noPins) {

        // If there aren't yet any pins on the map, do not grey the pin out.   
        noPins = false;

    }
    else {
        var pin = null;

        // Loop through the collection of pushpins on the map and grey out 
        //    all but the last one added (which is at the end of the array). 
        var i = 0;
        for (i = 0; i < e.collection.getLength() - 1; i++) {
            pin = e.collection.get(i);
            pin.setOptions({ icon: "GreyPin.png" });
        }
    }
}



