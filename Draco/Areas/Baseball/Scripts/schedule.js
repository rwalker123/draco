function initScheduleViewModel(accountId, isAdmin) {
    var scheduleElem = document.getElementById("schedule");
    if (scheduleElem) {

        var scheduleVM = new ScheduleViewModel(accountId, isAdmin);
        ko.applyBindings(scheduleVM, scheduleElem);
    }
}

var GameDayViewModel = function (theDate) {
    var self = this;
    
    self.date = ko.observable(new Date(theDate));
    self.games = ko.observableArray();
    self.monthDayNumber = ko.computed(function () {
        return self.date().getDate();
    });
}

var GameViewModel = function () {

}

var ScheduleViewModel = function (accountId, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.leagueTeams = ko.observableArray([{ Name: 'ray', Id: '1' }]);
    self.selectedTeam = ko.observable();

    self.currentDate = ko.observable();

    self.currentMonth = ko.computed(function () {
        return moment(self.currentDate()).format("MMMM");
    });

    self.gameMonth = ko.observableArray();

    self.setupMonthData = function (theDate) {
        theDate.setDate(1);
        self.currentDate(new Date(theDate));

        var startMonth = theDate.getMonth();

        // get back to "Sunday"
        var dayOfWeek = theDate.getDay();
        theDate.setDate(theDate.getDate() - dayOfWeek);


        // now go for 4 weeks.
        while (theDate.getMonth() <= startMonth) {
            var gameWeek = ko.observableArray();
            
            var dayNo = 0;
            while (dayNo < 7) {
                gameWeek.push(new GameDayViewModel(theDate));
                theDate.setDate(theDate.getDate() + 1);
                dayNo++;
            }

            self.gameMonth.push(gameWeek);
        }
    }

    self.populateTeams = function () {

    }

    self.setupMonthData(new Date());

    $("#leagueSelect").selectpicker();
 
}