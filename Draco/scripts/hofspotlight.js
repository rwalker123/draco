function InitHOFSpotlightViewModel(accountId) {

    var hofViewElem = document.getElementById("hofView");
    if (hofViewElem) {
        var hofViewVM = new HOFViewModel(accountId);
        ko.applyBindings(hofViewVM, hofViewElem);
    }
}

var SpotlightHOFViewModel = function (data, accountId) {
    var self = this;

    self.accountId = accountId;

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

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}
var HOFViewModel = function (accountId) {
    var self = this;

    self.accountId = accountId;

    self.isLoading = ko.observable(true);

    self.hofMember = ko.observable();

    self.loadSpotlightHOFMember = function () {
        var url = window.config.rootUri + '/api/HallOfFameAPI/' + self.accountId + '/randommember';

        $.ajax({
            type: "GET",
            url: url,
            success: function (hofMember) {
                self.hofMember(new SpotlightHOFViewModel(hofMember, self.accountId));
                self.isLoading(false);
            }
        });
    }

    self.loadSpotlightHOFMember();
}