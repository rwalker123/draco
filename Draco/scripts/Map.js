function initFieldsViewModel(accountId, isAdmin, selectedField) {
    initKOHelpers();

    var fieldsElem = document.getElementById("fields");
    if (fieldsElem) {
        var fieldsVM = new FieldsViewModel(accountId, isAdmin, selectedField);
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

var FieldsViewModel = function (accountId, isAdmin, selectedField) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.map = null;

    self.viewMode = ko.observable(true);
    self.addMode = ko.observable(true); // true for new field, false for edit existing.
    self.fields = ko.observableArray();
    self.selectedFieldId = ko.observable();
    self.selectedField = ko.computed(function () {
        return ko.utils.arrayFirst(self.fields(), function (item) {
            if (item.Id() === self.selectedFieldId())
                return item;
        });
    });
    self.foundLocations = ko.observableArray();

    self.newFieldViewModel = new FieldViewModel({
        Id: 0,
        Address: '',
        City: '',
        State: '',
        ZipCode: '',
        Comment: '',
        Contacts: [],
        Directions: '',
        Latitude: '',
        Longitude: '',
        Name: '',
        RainoutNumber: '',
        ShortName: ''
    });

    // data for game currently being edit.
    self.editingField = ko.validatedObservable(new FieldViewModel({
        Id: 0,
        Address: '',
        City: '',
        State: '',
        ZipCode: '',
        Comment: '',
        Contacts: [],
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
        self.editingField().update(self.newFieldViewModel.toJS());

        self.viewMode(!self.viewMode());
        if (self.editPin && self.viewMode())
            self.removeEditPin();

        self.addMode(true);
    }

    self.startEditField = function (field) {
        self.editingField().update(field.toJS());

        self.viewMode(false);
        self.addMode(false);
    }

    self.cancelEditMode = function () {
        self.removeEditPin();
        self.viewMode(true);
    }

    self.saveEdit = function (theField) {
        if (!self.editingField.isValid())
            return;

        var newData = self.editingField().toJS();

        $.ajax({
            type: (self.addMode()) ? "POST" : "PUT",
            url: window.config.rootUri + '/api/FieldsAPI/' + self.accountId,
            data: newData,
            success: function (field) {
                if (self.addMode()) {
                    var fieldVM = new FieldViewModel(field);
                    self.fields.push(fieldVM);
                    self.addFieldPin(fieldVM);
                    self.fields.sort(function(left, right) {
                        return left.Name() == right.Name() ? 0 : (left.Name() < right.Name() ? -1 : 1);
                    });
                }
                else {
                    ko.utils.arrayFirst(self.fields(), function (item) {
                        if (item.Id() === field.Id) {
                            self.removeFieldPin(item);
                            item.update(field);
                            self.addFieldPin(item);
                            return;
                        }
                    });
                }
                self.cancelEditMode();
            }
        });
    }

    self.deleteField = function (field) {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/FieldsAPI/' + self.accountId + '/field/' + field.Id(),
            success: function () {
                self.removeFieldPin(field);
                self.fields.remove(field);
            }
        });

    }

    self.removeFieldPin = function (field) {
        if (field.pin) {
            map.entities.remove(field.pin);
            field.pin = null;
            field.location = null;
        }
    }

    self.addFieldPin = function (field) {
        if (field.Latitude() && field.Longitude()) {
            var latVal = parseFloat(field.Latitude());
            var longVal = parseFloat(field.Longitude());

            field.location = new Microsoft.Maps.Location(latVal, longVal);
            field.pin = self.loadPin(field.location, field.ShortName(), field.Name(), field.Directions());
        }
    }

    self.viewAllFields = function () {
        var locations = $.map(self.fields(), function (field) {
            return field.location ? field.location : null;
        });

        // get all fields in view.
        if (locations.length > 0) {
            var viewBoundaries = Microsoft.Maps.LocationRect.fromLocations(locations);
            map.setView({ bounds: viewBoundaries });
        }
    }

    self.loadFields = function () {

        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/FieldsAPI/' + self.accountId,
            success: function (fields) {
                var fieldsVM = $.map(fields, function (field) {
                    var fieldVM = new FieldViewModel(field);
                    self.addFieldPin(fieldVM);
                    return fieldVM;
                });

                self.fields(fieldsVM);
                self.selectedFieldId(selectedField);
                if (selectedField > 0) {
                    self.centerOnMap(self.selectedField());
                }
                else {
                    self.viewAllFields();
                }
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
    }

    self.activeInfobox = null;

    self.loadPin = function (loc, name, longName, description) {
        var pin = new Microsoft.Maps.Pushpin(loc, { text: name });

        // Create the infobox for the pushpin
        var pinInfobox = new Microsoft.Maps.Infobox(pin.getLocation(),
            {
                title: longName,
                description: description,
                visible: false,
                offset: new Microsoft.Maps.Point(0, 15)
            });

        // Add handler for the pushpin click event.
        Microsoft.Maps.Events.addHandler(pin, 'click', function (e) {
            if (self.activeInfobox)
                self.activeInfobox.setOptions({ visible: false });

            pinInfobox.setOptions({ visible: true });
            self.activeInfobox = pinInfobox;
        });

        // Hide the infobox when the map is moved.
        Microsoft.Maps.Events.addHandler(map, 'viewchange', function (e) {
            pinInfobox.setOptions({ visible: false });
            self.activeInfobox = null;
        });

        // Add the pushpin and infobox to the map
        map.entities.push(pin);
        map.entities.push(pinInfobox);

        return pin;
    }

    self.centerOnMap = function (field) {
        var latVal = parseFloat(field.Latitude());
        var longVal = parseFloat(field.Longitude());

        // Center the map on the location
        map.setView({ center: new Microsoft.Maps.Location(latVal, longVal), zoom: 17 });
    }

    self.removeEditPin = function () {
        map.entities.remove(self.editPin);
        self.editingField().Latitude(0);
        self.editingField().Longitude(0);
    }

    self.addEditPin = function (loc) {
        self.editPin = new Microsoft.Maps.Pushpin(loc);
        map.entities.push(self.editPin);

        self.editingField().Latitude(loc.latitude);
        self.editingField().Longitude(loc.longitude);
    }

    self.addPin = function (e) {
        if (self.viewMode())
            return;

        if (e.targetType == "map") {
            var point = new Microsoft.Maps.Point(e.getX(), e.getY());
            var loc = e.target.tryPixelToLocation(point);
            if (self.editPin)
                self.removeEditPin();

            self.addEditPin(loc)
        }
        else if (e.targetType == "pushpin") {
            if (e.target == self.editPin) 
                self.removeEditPin();
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

    self.clearLocations = function () {
        self.foundLocations.removeAll();
    }

    self.pinEditLocation = function (location) {
        // Set the map view using the returned bounding box
        var bbox = location.bbox;
        var viewBoundaries = Microsoft.Maps.LocationRect.fromLocations(new Microsoft.Maps.Location(bbox[0], bbox[1]), new Microsoft.Maps.Location(bbox[2], bbox[3]));
        map.setView({ bounds: viewBoundaries });

        // Add a pushpin at the found location
        var location = new Microsoft.Maps.Location(location.point.coordinates[0], location.point.coordinates[1]);
        if (self.editPin)
            self.removeEditPin();

        self.addEditPin(location);
    }

    self.geocodeCallback = function (result) {
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
