var WorkoutsViewModel = function (accountId, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.newWorkoutTitle = ko.observable('');
    self.newWorkoutDate = ko.observable('');
    self.newWorkoutTime = ko.observable('');
    self.newWorkoutField = ko.observable('');
    self.newWorkoutDescription = ko.observable('');
    self.workoutAvailableFields = ko.observableArray();
    self.workouts = ko.observableArray();
    self.whereHeardOptions = ko.observableArray();
    self.editWhereHeard = ko.observable(false);
    
    self.moveWhereHeardDown = function () {
        alert('');
    }

    self.removeWhereHeard = function () {

    }

    self.viewMode = ko.observable(true);

    self.titleMissingError = ko.computed(function () {
        return self.newWorkoutTitle().length == 0;
    }, self);

    self.startWorkoutWhereHeardEdit = function () {
        self.editWhereHeard(true);
    }

    self.startWorkoutAdd = function () {
        self.viewMode(false);
    }

    self.stopWorkoutAdd = function () {
        self.viewMode(true);
    }

    self.clearNewData = function () {
        self.newWorkoutTitle('');
        self.newWorkoutDate('');
        self.newWorkoutTime('');
        self.newWorkoutField('');
        self.newWorkoutDescription('');
    }

    self.getAvailableFields = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/FieldsAPI/' + self.accountId,
            success: function (fields) {
                var mappedFields = $.map(fields, function (field) {
                    return {
                        Id: field.Id,
                        Name: field.Name
                    };
                });

                self.workoutAvailableFields(mappedFields);

                $('#newWorkoutField').selectpicker();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
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
                var mappedOptions = $.map(options, function (option) {
                    return {
                        Id: option,
                        Name: option
                    };
                });

                self.whereHeardOptions(mappedOptions);

                $('.registerworkoutselectpicker').selectpicker();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
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

    self.addNewWorkout = function () {
        if (self.titleMissingError()) {
            return;
        }

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/workouts',
            data: {
                Description: self.newWorkoutTitle(),
                WorkoutDate: self.newWorkoutDate(),
                WorkoutTime: self.newWorkoutTime(),
                WorkoutLocation: self.newWorkoutField(),
                Comments: self.newWorkoutDescription()
            },
            success: function (workoutId) {
                self.workouts.push({
                    Id: ko.observable(workoutId),
                    Comments: ko.protectedObservable(self.newWorkoutDescription()),
                    Description: ko.protectedObservable(self.newWorkoutTitle()),
                    WorkoutLocation: ko.protectedObservable(self.newWorkoutField()),
                    WorkoutDate: ko.protectedObservable(moment(self.newWorkoutDate()).format("dddd, MMMM Do YYYY")),
                    WorkoutTime: ko.protectedObservable(moment(self.newWorkoutTime()).format("h:mm a")),
                    NumRegistered: 0,
                    registerForWorkout: ko.observable(false),
                    startRegisterForWorkout: function () {
                        registerForWorkout(true);
                    },
                    endRegisterForWorkout: function () {
                        this.registerForWorkout(false);
                    },
                    viewMode: ko.observable(true)
                });

                self.clearNewData();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }

    self.loadWorkoutAnnouncements = function () {
        var url = window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/';
        if (self.isAdmin)
            url += 'workouts';
        else
            url += 'activeworkouts';

        $.ajax({
            type: "GET",
            url: url,
            success: function (workouts) {
                var mappedFields = $.map(workouts, function (workout) {
                    return {
                        Id: ko.observable(workout.Id),
                        Comments: ko.protectedObservable(workout.Comments),
                        Description: ko.protectedObservable(workout.Description),
                        WorkoutLocation: ko.protectedObservable(workout.WorkoutLocation),
                        WorkoutDate: ko.protectedObservable(moment(workout.WorkoutDate).format("dddd, MMMM Do YYYY")),
                        WorkoutTime: ko.protectedObservable(moment(workout.WorkoutTime).format("h:mm a")),
                        WorkoutFieldName: self.getFieldName(workout.WorkoutLocation),
                        NumRegistered: workout.NumRegistered,
                        registerForWorkout: ko.observable(false),
                        startRegisterForWorkout: function () {
                            this.registerForWorkout(true);
                        },
                        endRegisterForWorkout: function (parent) {
                            parent.registerForWorkout(false);
                        },
                        viewMode: ko.observable(true),
                        registerData: {
                            Id: ko.observable(workout.Id),
                            Phone: ko.observable(''),
                            Name: ko.observable(''),
                            Age: ko.observable(''),
                            Positions: ko.observable(''),
                            Email: ko.observable(''),
                            whereHeardOption: ko.observable('')
                        }
                    }
                });

                self.workouts(mappedFields);
                self.getWhereHeardOptions();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });

    }

    self.getAvailableFields();

    $('#newWorkoutEditControl').wysiwyg({ toolbarSelector: '[data-role=newWorkoutEditControl-toolbar]' });
    $('#newWorkoutTime').timepicker({
        minuteStep: 5,
        showInputs: false,
        disableFocus: true
    });
};
