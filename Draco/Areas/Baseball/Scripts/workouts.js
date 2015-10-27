var WorkoutRegistrantViewModel = function (data, workoutId) {
    var self = this;

    var workoutId = workoutId;

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
        js.DateRegistered = moment(new Date()).format("MM/DD/YYYY");
        return js;
    }

}

var WorkoutViewModel = function (data, parent) {
    var self = this;

    self.accountId = parent.accountId;
    self.isAdmin = parent.isAdmin;
    
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

    self.WorkoutDate.DisplayDate = ko.computed(function () {
        return moment(self.WorkoutDate()).format("dddd, MMMM Do YYYY, h:mm a");
    });

    self.WorkoutDate.TimeText = ko.observable(moment(self.WorkoutDate() || new Date()).format("h:mm a"));
    self.WorkoutDate.DateText = ko.observable(moment(self.WorkoutDate() || new Date()).format("MM/DD/YYYY"));


    self.WorkoutLocation.WorkoutField = ko.computed(function () {
        return parent.getFieldName(self.WorkoutLocation());
    });

    self.fieldUrl = ko.computed(function () {
        return window.config.rootUri + '/baseball/fields/index/' + self.accountId + '/' + self.WorkoutLocation();
    });

    self.sendEmail = ko.observable(false);
    self.emailText = ko.observable();
    self.emailSubject = ko.observable();

    self.registerForWorkout = ko.observable(false);
    self.viewMode = ko.observable(true);
    self.editRegistrantsMode = ko.observable(false);

    self.emptyWorkoutRegistrant = {
        Id: 0,
        Name: '',
        Email: '',
        Age: 0,
        Phone1: '',
        Phone2: '',
        Phone3: '',
        Phone4: '',
        Positions: '',
        WantToManage: false,
        WorkoutId: self.Id(),
        DateRegistered: new Date(),
        WhereHeard: ''
    }

    self.registerData = new WorkoutRegistrantViewModel(self.emptyWorkoutRegistrant);
    self.workoutRegistrants = ko.observableArray();

    self.sendEmailMode = function () {
        self.viewMode(false); 
        self.editRegistrantsMode(false); 
        self.sendEmail(true); 
    }

    self.stopRegistrantEdit = function () {
        self.editRegistrantsMode(false);
        self.viewMode(true);
    }

    self.exportRegistrants = function (workout) {
        window.location.href = window.config.rootUri + '/baseball/workouts/ExportRegistrants/' + self.accountId + '/' + workout.Id();
    }

    self.editRegistrants = function () {
        if (self.editRegistrantsMode())
            return;

        if (self.NumRegistered() == 0)
            return;

        self.editRegistrantsMode(true);
        self.viewMode(false);
        self.sendEmail(false);

        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/registrants/' + self.Id(),
            success: function (regs) {
                var mappedRegs = $.map(regs, function (reg) {
                    return new WorkoutRegistrantViewModel(reg);
                });

                self.workoutRegistrants(mappedRegs);
 
            }
        });

    }

    self.removeRegistrant = function (workoutReg) {

        $("#deleteWorkoutRegModal").modal("show");

        $("#confirmWorkoutRegDeleteBtn").one("click", function () {
            self.makeWorkoutRegistrantDeleteCall(workoutReg)
        });
    }

    self.editRegistrant = function (workoutReg) {

        var data = workoutReg.toJS();
        self.registerData.update(data);
        self.registerForWorkout(true);
    }

    self.makeWorkoutRegistrantDeleteCall = function (workoutReg) {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/registrants/' + workoutReg.Id(),
            success: function () {
                self.workoutRegistrants.remove(workoutReg);
                self.NumRegistered(self.NumRegistered() - 1);
            }
        });

    }


    self.cancelSendEmail = function () {
        self.sendEmail(false);
        self.viewMode(true);

        self.emailSubject('');
        self.emailText('');

        // tinyMCE editor will not bind two-ways, have to manually set the control
        // when changing the data model.
        tinymce.get(self.Id() + '_workoutEmailEditor').setContent('');
    }

    self.sendEmailToRegistrants = function () {
        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/email/' + self.Id(),
            data: {
                Subject: self.emailSubject(),
                Message: self.emailText(),
            },
            success: function (result) {
                if (result)
                    alert("Could not send to the following: " + result);
                else
                    alert('email sent.');

                self.cancelSendEmail();
            }
        });
    }

    self.startRegisterForWorkout = function () {
        self.registerForWorkout(true);
    }

    self.registerWorkoutData = function (w) {

        if (!w.Name()) {
            alert("Please enter your name.");
            return;
        }

        if (!w.Age()) {
            alert("Please enter your age.");
            return;
        }

        if (!w.Email()) {
            alert("Please enter an email address.");
            return;
        }

        var data = w.toJS();

        var type = (w.Id() > 0) ? "PUT" : "POST";

        $.ajax({
            type: type,
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/register/' + w.WorkoutId(),
            data: data,
            success: function (workoutId) {
                self.registerForWorkout(false);
                if (w.Id() == 0)
                    alert('You are now registered for the workout.');
                else {
                    var theWorkoutReg = ko.utils.arrayFirst(self.workoutRegistrants(), function (workout) {
                        return (workout.Id() == w.Id())
                    });

                    if (theWorkoutReg) {
                        theWorkoutReg.update(w.toJS());
                    }
                }
            }
        });

    }

    self.endRegisterForWorkout = function () {
        self.registerForWorkout(false);
    }

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
        self.WorkoutDate.TimeText(moment(self.WorkoutDate()).format("h:mm a"));
        self.WorkoutDate.DateText(moment(self.WorkoutDate()).format("MM/DD/YYYY"));
    }

    self.toJS = function () {
        var gameTime = new Date("1/1/1980 " + self.WorkoutDate.TimeText());
        var gameDate = new Date(self.WorkoutDate.DateText());
        gameDate.setHours(gameTime.getHours());
        gameDate.setMinutes(gameTime.getMinutes());

        var js = ko.mapping.toJS(self);

        js.WorkoutDate = moment(gameDate).format("MM/DD/YYYY h:mm a");

        return js;
    }
}

var WorkoutsViewModel = function (accountId, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.workoutAvailableFields = ko.observableArray();
    self.workouts = ko.observableArray();
    self.whereHeardOptions = ko.observableArray();
    self.newWhereHeardName = ko.observable();
    
    self.viewMode = ko.observable(true);
    self.editWorkoutMode = ko.observable(false);
    self.editWhereHeard = ko.observable(false);

    self.emptyWorkout = {
        Id: 0,
        AccountId: self.accountId,
        Description: '',
        WorkoutDate: new Date(),
        WorkoutLocation: 0,
        Comments: '',
        NumRegistered: 0
    }

    self.startWorkoutWhereHeardEdit = function () {
        if (self.editWhereHeard()) {
            self.stopWorkoutWhereHeardAdd();
        }
        else {
            self.stopWorkoutAdd();
            self.editWhereHeard(true);
        }
    }

    self.startWorkoutAdd = function () {
        if (self.viewMode()) {
            self.stopWorkoutWhereHeardAdd();
            self.currentEditWorkout().update(self.emptyWorkout);
            // tinyMCE editor will not bind two-ways, have to manually set the control
            // when changing the data model.
            tinymce.get('workoutEditor').setContent('');

            self.viewMode(false);
        }
        else
            self.stopWorkoutAdd();
    }

    self.stopWorkoutAdd = function () {
        self.viewMode(true);
    }

    self.stopWorkoutWhereHeardAdd = function () {
        self.editWhereHeard(false);
    }

    var showingPastWorkouts = false;

    self.showPreviousWorkouts = function () {
        if (showingPastWorkouts) {
            self.loadWorkoutAnnouncements();
            showingPastWorkouts = false;
        }
        else {
            self.loadWorkoutAnnouncements(true);
            showingPastWorkouts = true;
        }
    }

    self.getAvailableFields = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/FieldsAPI/' + self.accountId + '/fields',
            success: function (fields) {
                var mappedFields = $.map(fields, function (field) {
                    return {
                        Id: field.Id,
                        Name: field.Name
                    };
                });

                self.workoutAvailableFields(mappedFields);
            },
            complete: function () {
                // load workouts after fields so field name can be used.
                self.loadWorkoutAnnouncements();
            }
        });

    }

    self.getWhereHeardOptions = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/whereheard',
            success: function (options) {
                self.whereHeardOptions(options);
            }
        });
    }

    self.addNewWhereHeard = function () {
        var stringList = $.map(self.whereHeardOptions(), function (option) {
            return option;
        });

        stringList.push(self.newWhereHeardName())

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/whereheard',
            data: {
                WhereHeardList: stringList
            },
            success: function (whereHeard) {
                self.whereHeardOptions.push(self.newWhereHeardName());

                self.whereHeardOptions.sort();
                self.newWhereHeardName('');
            }
        });
    }

    self.removeWhereHeard = function (o) {
        var stringList = $.map(self.whereHeardOptions(), function (option) {
            return option;
        });

        var index = stringList.indexOf(o);
        if (index == -1)
            return;

        stringList.splice(index, 1);

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/whereheard',
            data: {
                WhereHeardList: stringList
            },
            success: function (whereHeard) {
                self.whereHeardOptions.remove(o);
            }
        });
    }

    self.getFieldName = function (fieldId) {
        var result = $.grep(self.workoutAvailableFields(), function (e) { return e.Id == fieldId });
        if (result.length == 0)
            return '';
        else
            return result[0].Name;
    }

    self.addNewWorkout = function (w) {
        var type;

        if (self.editWorkoutMode())
            type = "PUT";
        else
            type = "POST";

        if (w.Description().length <= 0) {
            alert("enter a title");
            return;
        }

        if (!w.WorkoutDate.DateText()) {
            alert("enter a workout date");
            return;
        }

        if (!w.WorkoutDate.TimeText()) {
            alert("enter a workout time");
            return;
        }

        var data = w.toJS();

        $.ajax({
            type: type,
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/workouts',
            data: data,
            success: function (workoutData) {

                if (!self.editWorkoutMode()) {
                    var workout = new WorkoutViewModel(workoutData, self);
                    self.workouts.push(workout);
                }
                else {
                    var theWorkout = ko.utils.arrayFirst(self.workouts(), function (workout) {
                        return (workout.Id() == data.Id)
                    });

                    if (theWorkout) {
                        theWorkout.update(workoutData);
                    }
                }

                // tinyMCE editor will not bind two-ways, have to manually set the control
                // when changing the data model.
                tinymce.get('workoutEditor').setContent('');

                self.cancelEditMode();
            }
        });
    }

    self.postTwitter = function (workout) {

        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/twitter/' + workout.Id(),
            success: function () {
                alert("Workout Tweet Successful.")
            },
            error: function (jqXHR, ajaxOptions, thrownError) {
                // not authenticated with twitter, will have to go thru page refresh
                if (jqXHR && jqXHR.status && jqXHR.status == 417) {
                    window.location.href = window.config.rootUri + '/Baseball/Workouts/Twitter/' + self.accountId + '/' + workout.Id() + '?referer=' + window.location.href;
                }
                else {
                    reportAjaxError(jqXHR.url, jqXHR, ajaxOptions, thrownError);
                }
            }
        });
    }

    self.editWorkout = function (workout) {
        self.currentEditWorkout().update(workout.toJS());
        // tinyMCE editor will not bind two-ways, have to manually set the control
        // when changing the data model.
        tinymce.get('workoutEditor').setContent(self.currentEditWorkout().Comments());
        self.editWorkoutMode(true);
        self.viewMode(false);
        $("#WorkoutField").selectpicker("refresh");
    }

    self.cancelEditMode = function () {
        self.editWorkoutMode(false);
        self.viewMode(true);
    }

    self.deleteWorkout = function (workout) {

        $("#deleteWorkoutModal").modal("show");

        $("#confirmWorkoutDeleteBtn").one("click", function () {
            self.makeWorkoutDeleteCall(workout)
        });
    }

    self.makeWorkoutDeleteCall = function (workout) {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/workouts/' + workout.Id(),
            success: function (workoutId) {
                self.workouts.remove(workout);
            }
        });

    }

    self.loadWorkoutAnnouncements = function (showOld) {
        var url = window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/';
        if (self.isAdmin && showOld == true)
            url += 'workouts';
        else
            url += 'activeworkouts';

        $.ajax({
            type: "GET",
            url: url,
            success: function (workouts) {
                var mappedFields = $.map(workouts, function (w) {
                    return new WorkoutViewModel(w, self);
                });

                self.workouts(mappedFields);

                if (showOld != true) {
                    self.getWhereHeardOptions();
                }
            }
        });

    }

    // track whether we are editing a "new" workout or an existing workout.
    self.currentEditWorkout = ko.observable(new WorkoutViewModel(self.emptyWorkout, self));


    self.getAvailableFields();
};
