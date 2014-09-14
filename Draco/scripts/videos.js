var ytViewModel;

function initVideosViewModel(accountId, isAdmin, youTubeId, teamId) {

    ytViewModel = new youTubeViewModel(accountId, isAdmin, youTubeId, teamId);
    ko.applyBindings(ytViewModel, document.getElementById("videos"));

    // 2. This code loads the IFrame Player API code asynchronously.
    var tag = document.createElement('script');

    // This is a protocol-relative URL as described here:
    //     http://paulirish.com/2010/the-protocol-relative-url/
    // If you're testing a local page accessed via a file:/// URL, please set tag.src to
    //     "https://www.youtube.com/iframe_api" instead.
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

    loadVideos(ytViewModel.userId());
}

function loadVideos(youTubeId) {

    ytViewModel.videoEntries(null);

    $.ajax({
        dataType: "json",
        url: 'http://gdata.youtube.com/feeds/users/' + youTubeId + '/uploads?alt=json-in-script&max-results=50&callback=?',
        success: function (data) {

            var feed = data.feed;
            var entries = feed.entry || [];

            var mappedEntries = $.map(entries, function (entry) {
                return new Object ({
                    title: entry.title.$t,
                    thumbnailUrl: entry.media$group.media$thumbnail[0].url,
                    playerUrl: entry.media$group.media$content[0].url // entries[i].id.$t.match('[^/]*$');
                });
            });

            ytViewModel.videoEntries(mappedEntries);

            if (!ytViewModel.isAdmin) {
                if (entries.length == 0) {
                    $('#videos').hide();
                    return;
                }
            }

            //var videoHeight = '';
            //if (isAdmin) {
            //    // set the height of the video list if admin.
            //    videoHeight = " style='height: 240px'";
            //}

            //$('#videos2').html('');
            //var html = ['<ul class="videos"' + videoHeight + '>'];
            //for (var i = 0; i < entries.length; i++) {
            //    var entry = entries[i];
            //    var title = entry.title.$t.substr(0, 20);
            //    var thumbnailUrl = entries[i].media$group.media$thumbnail[0].url;
            //    var playerUrl = entries[i].media$group.media$content[0].url; // entries[i].id.$t.match('[^/]*$');
            //    html.push('<li onclick="loadVideo(\'', playerUrl, '\', true)">',
            //              '<span class="titlec">', title, '...</span><br /><img src="',
            //              thumbnailUrl, '" style="width:130px;height:97px;cursor:pointer" />', '</span></li>');
            //}
            //html.push('</ul><br style="clear: left;"/>');
            //$('#videos2').html(html.join(''));
        }
    });
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
var youTubeViewModel = function (accountId, isAdmin, id, teamId) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.teamId = teamId;

    // declare ko stuff here, otherwise it is static to the class.
    self.userId = ko.observable(id);
    self.viewMode = ko.observable(true);
    self.videosVisible = ko.observable(true);
    self.videoEntries = ko.observableArray();

    self.selectedVideo = ko.observable();
    self.selectedVideo.subscribe(function () {
        loadVideo(self.selectedVideo());
    });

    self.editYouTube = function () {
        self.savedId = self.userId();
        self.viewMode(false);
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
                loadVideos(userId);
                self.viewMode(true);
            }
        });
    }

    self.resetUserId = function () {
        self.userId(self.savedId);
        self.viewMode(true);
    }
}

