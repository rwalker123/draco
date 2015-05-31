var ytViewModel;

function initVideosViewModel(accountId, isAdmin, youTubeId, defaultVideo, autoPlay, teamId) {

    ytViewModel = new youTubeViewModel(accountId, isAdmin, youTubeId, defaultVideo, autoPlay, teamId);
    ko.applyBindings(ytViewModel, document.getElementById("videos"));

    // 2. This code loads the IFrame Player API code asynchronously.
    var tag = document.createElement('script');

    tag.src = "//www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function loadVideo(vm) {
    if (!vm)
        return;

    player.cueVideoByUrl(vm.playerUrl);
    player.playVideo();
}

function onYouTubeIframeAPIReady() {

    var height = '300';
    if (ytViewModel.isAdmin)
        height = '250';

    player = new YT.Player('player', {
        //width: '425',
        //height: height,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });

    ytViewModel.loadVideos(ytViewModel.userId());
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
function onPlayerStateChange(event) {
}

function stopVideo() {
}

// you tube view model
var youTubeViewModel = function (accountId, isAdmin, id, defaultVideo, autoPlay, teamId) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.teamId = teamId;

    // declare ko stuff here, otherwise it is static to the class.
    self.userId = ko.observable(id);
    self.viewMode = ko.observable(true);
    self.videosVisible = ko.observable(true);
    self.videoEntries = ko.observableArray();

    self.defaultVideo = ko.observable(defaultVideo);
    self.autoPlay = ko.observable(autoPlay);
    self.autoPlay.subscribe(function () {

        var url = window.config.rootUri + '/api/AccountAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/team/' + self.teamId;

        url = url + '/autoplayvideo';

        $.ajax({
            type: "PUT",
            url: url,
            data: {
                Id: self.autoPlay() ? "1": "0"
            },
            success: function () {
            }
        });
    });

    self.runVideoOnChange = true;

    self.selectedVideo = ko.observable();
    self.selectedVideo.subscribe(function () {
        if (self.runVideoOnChange)
            loadVideo(self.selectedVideo());
    });

    self.editYouTube = function () {
        self.savedId = self.userId();
        self.viewMode(false);
    }

    self.initializeDefaultVideo = function () {
        if (!self.videoEntries().length || !self.defaultVideo())
            return;

        var defaultVideo = ko.utils.arrayFirst(self.videoEntries(), function (v) {
            return v.title == self.defaultVideo();
        });

        self.runVideoOnChange = false;
        self.selectedVideo(defaultVideo);
        $(".videoPicker").selectpicker("refresh");
        self.runVideoOnChange = true;
    }

    self.makeDefaultSelection = function () {
        var selectedVideo = (self.selectedVideo() ? self.selectedVideo().title : '');

        var url = window.config.rootUri + '/api/AccountAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/team/' + self.teamId;

        url = url + '/defaultvideo';

        $.ajax({
            type: "PUT",
            url: url,
            data: {
                Id: selectedVideo
            },
            success: function () {
            }
        });
    }

    self.saveUserId = function () {
        var url = window.config.rootUri + '/api/AccountAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/team/' + self.teamId;

        url = url + '/YouTubeUserId';

        $.ajax({
            type: "PUT",
            url: url,
            data: {
                Id: self.userId()
            },
            success: function (userId) {
                self.loadVideos(userId);
                self.viewMode(true);
            }
        });
    }

    self.resetUserId = function () {
        self.userId(self.savedId);
        self.viewMode(true);
    }

    self.showHelp = ko.observable(false);

    self.toggleShowHelp = function () {
        self.showHelp(!self.showHelp());
    }

    self.loadVideos = function(youTubeId) {

        ytViewModel.videoEntries.removeAll();
        var url = window.config.rootUri + '/api/YouTubeAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/team/' + self.teamId;

        url = url + '/videos';


        $.ajax({
            type: "GET",
            url: url,
            success: function (videos) {
                ytViewModel.videoEntries(videos);

                if (!ytViewModel.isAdmin) {
                    if (entries.length == 0) {
                        $('#videos').hide();
                        return;
                    }
                }

                ytViewModel.initializeDefaultVideo();

                if (ytViewModel.autoPlay())
                    loadVideo(ytViewModel.selectedVideo());
                else if (ytViewModel.selectedVideo())
                    player.cueVideoByUrl(ytViewModel.selectedVideo().playerUrl);

            }
        });
    }
}

