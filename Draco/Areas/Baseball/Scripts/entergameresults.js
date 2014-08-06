

var GameResultsViewModel = function (accountId, data) {
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

    self.GameDate.TimeText = ko.observable(moment(self.GameDate() || new Date()).format("h:mm a"));
    self.GameDate.DateText = ko.observable(moment(self.GameDate() || new Date()).format("MM/DD/YYYY"));

    self.HomeTeamId.roster = ko.observableArray();
    self.AwayTeamId.roster = ko.observableArray();

    self.Id.EmailResult = ko.observable(true);
    self.Id.TweetResult = ko.observable(true);
    self.Id.showResultsForm = ko.observable(false);

    // score required if game is final or forfeit
    self.HomeScore.extend({
        number: true,
        required: {
            onlyIf: function () {
                return self.GameStatus() == "1" || self.GameStatus() == "4";
            }
        }
    });

    self.AwayScore.extend({
        number: true,
        required: {
            onlyIf: function () {
                return self.GameStatus() == "1" || self.GameStatus() == "4";
            }
        }
    }).extend({
        validation: {
            validator: function (val, someOtherVal) {
                // forfiet game cannot have different score.
                if (self.GameStatus() == "4")
                    return val != someOtherVal;
                else
                    return true;
            },
            message: 'Score cannot be equal.',
            params: self.HomeScore
        }
    });

    self.updateGameResult = function (callback) {

        if (!self.isValid())
            return;

        var data = self.toJS();

        var url = window.config.rootUri + '/api/ScheduleAPI/' + self.accountId + '/league/' + self.LeagueId() + '/gameresult';
        if (self.Id.EmailResult()) {
            url = url + "?emailResult=true";
        }

        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            success: function (game) {
                if (self.Id.TweetResult())
                    self.tweetGameResult(game);

                callback(game);
            }
        });
    }

    self.tweetGameResult = function (game) {
        var url = window.config.rootUri + '/api/ScheduleAPI/' + self.accountId + '/league/' + self.LeagueId() + '/tweetresult/';

        $.ajax({
            type: "PUT",
            url: url,
            data: game,
            success: function () {
            },
            error: function (jqXHR, ajaxOptions, thrownError) {
                // not authenticated with twitter, will have to go thru page refresh
                if (jqXHR && jqXHR.status && jqXHR.status == 417) {
                    window.location.href = window.config.rootUri + '/Baseball/LeagueSchedule/GameResultTwitter/' + self.accountId + '/' + game.Id + '?referer=' + window.location.href;
                }
                else {
                    reportAjaxError(jqXHR.url, jqXHR, ajaxOptions, thrownError);
                }
            }
        });

    }

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
        self.GameDate.TimeText(moment(self.GameDate()).format("h:mm a"));
        self.GameDate.DateText(moment(self.GameDate()).format("MM/DD/YYYY"));

        //self.HomeTeamId.roster([]);
        //self.AwayTeamId.roster([]);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

