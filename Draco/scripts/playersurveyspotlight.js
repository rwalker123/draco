function InitPlayerSurveySpotlightViewModel(accountId) {

    var playerViewElem = document.getElementById("playerSurveyView");
    if (playerViewElem) {
        var playerViewVM = new PlayerSurveyViewModel(accountId);
        ko.applyBindings(playerViewVM, playerViewElem);
    }
}

var SpotlightPlayerViewModel = function (data, accountId) {
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
var PlayerSurveyViewModel = function (accountId) {
    var self = this;

    self.accountId = accountId;
    self.isLoading = ko.observable(true);

    self.playerSurvey = ko.observable();
    self.question = ko.observable();
    self.answer = ko.observable();

    self.loadSpotlightPlayer = function () {
        var url = window.config.rootUri + '/api/PlayerSurveyAPI/' + self.accountId + '/randomsurvey';

        $.ajax({
            type: "GET",
            url: url,
            success: function (playerSurvey) {
                self.playerSurvey(new SpotlightPlayerViewModel(playerSurvey.PlayerProfile, self.accountId));
                self.question(playerSurvey.Question.Question);
                self.answer(playerSurvey.Answer.Answer);
                self.isLoading(false);
            }
        });
    }

    self.loadSpotlightPlayer();
}