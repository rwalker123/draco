function initPlayerSurveysViewModel(accountId, isAdmin, contactId) {

    initKOHelpers();

    var playerSurveysElem = document.getElementById("playersurvey");
    if (playerSurveysElem) {
        var playerSurveysVM = new PlayerSurveysViewModel(accountId, isAdmin, contactId);
        ko.applyBindings(playerSurveysVM, playerSurveysElem);
    }
}

var PlayerSurveyViewModel = function (data, accountId) {
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

var PlayerSurveysViewModel = function (accountId, isAdmin, contactId) {
    var self = this;

    self.accountId = accountId;
    self.contactId = contactId;
    self.isAdmin = isAdmin;

    self.isLoading = ko.observable(true);

    self.surveys = ko.observableArray();

    self.editMode = ko.observable(false);
    self.startEditSurvey = function () {
        self.editMode(true);
    }

    self.loadSurveys = function () {
        var url = window.config.rootUri + '/api/PlayerSurveyAPI/' + self.accountId;

        $.ajax({
            type: "GET",
            url: url,
            success: function (playerSurveys) {
                var mappedSurveys = $.map(playerSurveys, function (survey) {
                    return new PlayerSurveyViewModel(survey, self.accountId);
                });

                self.surveys(mappedSurveys);

                self.isLoading(false);
            }
        });
    }

    self.loadSurveys();
}