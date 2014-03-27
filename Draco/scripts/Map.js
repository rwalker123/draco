function initFieldsViewModel(accountId, isAdmin) {
    initKOHelpers();

    var fieldsElem = document.getElementById("fields");
    if (fieldsElem) {
        var fieldsVM = new FieldsViewModel(accountId, isAdmin);
        ko.applyBindings(fieldsVM, fieldsElem);
    }
}



var FieldViewModel = function (data) {
    var self = this;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        // example:
        //'HomeTeamId': {
        //    create: function (options) {
        //        return ko.observable(options.data);
        //    },
        //    update: function (options) {
        //        return options.data;
        //    }
        //}
    }

    ko.mapping.fromJS(data, self.mapping, self);

    self.Name.extend({ required: true });
    self.ShortName.extend({
        required: true,
        maxLength: 4
    });

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }

}

var FieldsViewModel = function (accountId, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.map = null;
    self.noPins = true;

    self.viewMode = ko.observable(true);
    self.fields = ko.observableArray();
    self.foundLocations = ko.observableArray();

    // data for game currently being edit.
    self.editingField = ko.validatedObservable(new FieldViewModel({
        Id: 0,
        Address: '',
        City: '',
        State: '',
        ZipCode: '',
        Comment: '',
        Contacts: ko.observableArray(),
        Directions: '',
        Latitude: '',
        Longitude: '',
        Name: '',
        RainoutNumber: '',
        ShortName: ''
    }));

    self.searchField = '';

    self.editingField().onFindLocation = function (field) {
        self.foundLocations.removeAll();
        var searchField = field.Address();
        if (field.City()) {
            if (searchField) {
                searchField += ', ';
            }
            searchField += field.City();
        }

        if (field.State()) {
            if (searchField) {
                searchField += ', ';
            }
            searchField += field.State();
        }

        if (field.ZipCode()) {
            if (searchField) {
                searchField += ' ';
            }
            searchField += field.ZipCode();
        }

        self.searchField = searchField;
        map.getCredentials(self.makeGeocodeRequest);
    }

    self.editPin;

    self.startFieldAdd = function () {
        self.viewMode(!self.viewMode());
        if (self.editPin && self.viewMode())
            map.entities.remove(self.editPin);
    }

    self.loadFields = function () {

        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/FieldsAPI/' + self.accountId,
            success: function (fields) {
                var fieldsVM = $.map(fields, function (field) {
                    return new FieldViewModel(field);
                });

                self.fields(fieldsVM);

            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.loadMap = function(latitude, longitude) {

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
        Microsoft.Maps.Events.addHandler(map, 'click', self.addPin);

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

        //var center = map.getCenter();
        //self.loadPin(center, "CP", "Capitol Park");

        // Define the pushpin location
        //var loc = new Microsoft.Maps.Location(latitude, longitude);
        //map.setView({ center: loc, zoom: 10 });

    }

    self.loadPin = function (loc, name, description) {
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
        Microsoft.Maps.Events.addHandler(pin, 'click', self.displayInfobox);

        // Add a handler to function that will grey out 
        //    other pins in the collection when a new one is added
        Microsoft.Maps.Events.addHandler(map.entities, 'entityadded', self.shadePins);

        // Hide the infobox when the map is moved.
        Microsoft.Maps.Events.addHandler(map, 'viewchange', self.hideInfobox);

        // Add the pushpin and infobox to the map
        map.entities.push(pin);
        map.entities.push(pinInfobox);

        // Center the map on the location
        map.setView({ center: loc, zoom: 10 });
    }

    self.displayInfobox = function (e) {
        pinInfobox.setOptions({ visible: true });
    }

    self.hideInfobox = function (e) {
        pinInfobox.setOptions({ visible: false });
    }

    //self.displayLatLong = function (e) {
    //    self.addPin(e);

    //    if (e.targetType == "map") {
    //        var point = new Microsoft.Maps.Point(e.getX(), e.getY());
    //        var loc = e.target.tryPixelToLocation(point);
    //        //document.getElementById("textBox").value = loc.latitude + ", " + loc.longitude;
    //    }
    //}

    self.addPin = function (e) {
        if (self.viewMode())
            return;

        if (e.targetType == "map") {
            var point = new Microsoft.Maps.Point(e.getX(), e.getY());
            var loc = e.target.tryPixelToLocation(point);
            if (self.editPin)
                map.entities.remove(self.editPin);

            self.editPin = new Microsoft.Maps.Pushpin(loc);
            map.entities.push(self.editPin);
        }
    }

    self.shadePins = function (e) {

        if (self.noPins) {
            
            // If there aren't yet any pins on the map, do not grey the pin out.   
            self.noPins = false;

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

    self.makeGeocodeRequest = function (credentials) {

        $.getJSON('http://dev.virtualearth.net/REST/v1/Locations?query=' + self.searchField + '&key=' + credentials + '&jsonp=?', function (result) {
            self.geocodeCallback(result);
        });
    }

    self.onClickRoute = function () {
        map.getCredentials(MakeRouteRequest);
    }

    //self.makeRouteRequest = function (credentials) {
    //    $.getJSON("http://dev.virtualearth.net/REST/v1/Routes?wp.0=" + self.routeStart() + "&wp.1=" + self.routeEnd() + "&routePathOutput=Points&key=" + credentials + '&jsonp=?', function (result) {
    //        self.routeCallback(result);
    //    });
    //}

    //self.routeCallback = function (result) {
    //    if (result &&
    //          result.resourceSets &&
    //          result.resourceSets.length > 0 &&
    //          result.resourceSets[0].resources &&
    //          result.resourceSets[0].resources.length > 0) {

    //        // Set the map view
    //        var bbox = result.resourceSets[0].resources[0].bbox;
    //        var viewBoundaries = Microsoft.Maps.LocationRect.fromLocations(new Microsoft.Maps.Location(bbox[0], bbox[1]), new Microsoft.Maps.Location(bbox[2], bbox[3]));
    //        map.setView({ bounds: viewBoundaries });


    //        // Draw the route
    //        var routeline = result.resourceSets[0].resources[0].routePath.line;
    //        var routepoints = new Array();

    //        for (var i = 0; i < routeline.coordinates.length; i++) {

    //            routepoints[i] = new Microsoft.Maps.Location(routeline.coordinates[i][0], routeline.coordinates[i][1]);
    //        }


    //        // Draw the route on the map
    //        var routeshape = new Microsoft.Maps.Polyline(routepoints, { strokeColor: new Microsoft.Maps.Color(200, 0, 0, 200) });
    //        map.entities.push(routeshape);

    //    }
    //}

    self.pinEditLocation = function (location) {
        // Set the map view using the returned bounding box
        var bbox = location.bbox;
        var viewBoundaries = Microsoft.Maps.LocationRect.fromLocations(new Microsoft.Maps.Location(bbox[0], bbox[1]), new Microsoft.Maps.Location(bbox[2], bbox[3]));
        map.setView({ bounds: viewBoundaries });

        // Add a pushpin at the found location
        var location = new Microsoft.Maps.Location(location.point.coordinates[0], location.point.coordinates[1]);
        if (self.editPin)
            map.entities.remove(self.editPin);

        self.editPin = new Microsoft.Maps.Pushpin(location);
        map.entities.push(self.editPin);
    }

    self.geocodeCallback = function (result) {
        //alert("Found location: " + result.resourceSets[0].resources[0].name);
        if (self.viewMode())
            return;

        if (result &&
            result.resourceSets &&
            result.resourceSets.length > 0 &&
            result.resourceSets[0].resources &&
            result.resourceSets[0].resources.length > 0) {
            if (result.resourceSets[0].resources.length > 1) {
                // show a list to choose from
                self.foundLocations(result.resourceSets[0].resources);
            }
            else {

                self.pinEditLocation(result.resourceSets[0].resources[0]);
            }
        }
    }

    self.loadMap();
    self.loadFields();
}
