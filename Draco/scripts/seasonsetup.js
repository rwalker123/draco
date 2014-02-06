var SeasonSetupClass = function (accountId) {
    this.init(accountId);
};

$.extend(SeasonSetupClass.prototype, {
    // object variables
    accountId: 0,

    init: function (accountId) {
        this.accountId = accountId;
    },

    fillSeasons: function () {
        var target = this;
        $.getJSON('/api/SeasonsAPI/' + this.accountId + '/Seasons',
			function (data) {
			    if (data.length) {
			        window.location.hash = 'update';

			        target.createSeasonFromTemplate(target, data);
			    }

			    target.setCurrentSeasonDisplay();
			});
    },

    addSeason: function () {
        var name = $('#newSeasonName').val();
        if (name.length == 0)
            return;

        var target = this;
        $.ajax({
            type: "POST",
            url: '/api/SeasonsAPI/' + this.accountId + '/Season/',
            data: {
                AccountId: this.accountId,
                Name: name
            },
            success: function (seasonId) {
                window.location.hash = 'update';

                $('#newSeasonName').val('');

                var jsonObj = []; //declare array
                jsonObj.push({ Id: seasonId, Name: name, AccountId: target.accountId});
                target.createSeasonFromTemplate(target, jsonObj);
                target.setCurrentSeasonDisplay();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    },

    deleteSeason: function (seasonId) {
        var target = this;
        $("#myModal").modal("show");

        $("#confirmDeleteBtn").one("click", function () {
            target.makeDeleteCall(target, seasonId);
        });
    },

    makeDeleteCall: function (target, seasonId) {

        $.ajax({
            type: "DELETE",
            url: '/api/SeasonsAPI/' + this.accountId + '/Season/' + seasonId,
            success: function (deletedSeasonId) {
                window.location.hash = 'update';

                $('#seasonHeader_' + deletedSeasonId).remove();
                $('#seasonData_' + deletedSeasonId).remove();
                target.makeAccordion();
                target.setCurrentSeasonDisplay();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    },

    editSeason: function (seasonId) {
        var name = $('#newSeasonName_' + seasonId).val();
        if (name.length == 0)
            return;

        var target = this;
        $.ajax({
            type: "PUT",
            url: '/api/SeasonsAPI/' + this.accountId + '/Season/' + seasonId,
            data: {
                AccountId: this.accountId,
                Name: name
            },
            success: function (seasonId) {
                window.location.hash = 'update';

                $('#seasonHeaderLink_' + seasonId).html(name);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    },

    createSeasonFromTemplate: function (target, data) {

        if ($("#accordion").hasClass("ui-accordion"))
            $("#accordion").accordion("destroy");

        $('#accordion').append($("#seasonTemplate").render(data));
        target.makeAccordion();
    },

    makeAccordion: function () {
        var target = this;
        $("#accordion").accordion({
            heightStyle: 'content',
            autoHeight: false,
            collapsible: true,
            active: false,
            header: 'h3',
            changestart: function (event, ui) {
                var clicked = $(this).find('.ui-state-active').attr('id');
                $('#' + clicked).load('/widgets/' + clicked);
            }
        });
    },

    setCurrentSeason: function (seasonId) {
        var target = this;

        $.each($('.currentSeason'), function(index, item) {
            $(this).removeClass('currentSeason');
        });

        $.ajax({
            type: "PUT",
            url: '/api/SeasonsAPI/' + this.accountId + '/CurrentSeason/' + seasonId,
            success: function (currentSeasonId) {
                window.location.hash = 'update';
                target.setCurrentSeasonDisplay();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    },

    setCurrentSeasonDisplay: function () {

        $.getJSON('/api/SeasonsAPI/' + this.accountId + '/CurrentSeason',
            function (data) {
                if (data.HasSeasons)
                {
                    if (data.SeasonId != 0)
                    {
                        $('#currentSeasonDisplay').html('Current Season: ' + data.SeasonName);
                        $('#setCurrentSeasonBtn_' + data.SeasonId).addClass('currentSeason');
                    }
                    else
                    {
                        $('#currentSeasonDisplay').html('Select a current season.');
                    }
                }
                else
                { 
                    $('#currentSeasonDisplay').html('Create a season to continue.');
                }
            });
    },
});


