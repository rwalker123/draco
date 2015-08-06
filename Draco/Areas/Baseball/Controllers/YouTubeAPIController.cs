using Google.Apis.Services;
using Google.Apis.YouTube.v3;
using ModelObjects;
using SportsManager.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class YouTubeAPIController : DBApiController
    {
        public YouTubeAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Videos")]
        public async Task<HttpResponseMessage> GetVideos(long accountId)
        {
            Account a = Db.Accounts.Find(accountId);
            if (a != null)
            {
                String youTubeId = a.YouTubeUserId;
                if (String.IsNullOrEmpty(youTubeId))
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                return await LoadVideos(youTubeId);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Videos")]
        public async Task<HttpResponseMessage> TeamGetVideos(long accountId, long teamSeasonId)
        {
            var a = Db.TeamsSeasons.Find(teamSeasonId);
            if (a != null)
            {
                String youTubeId = a.Team.YouTubeUserId;
                if (String.IsNullOrEmpty(youTubeId))
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                return await LoadVideos(youTubeId);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        private async Task<HttpResponseMessage> LoadVideos(String youTubeId)
        {
            var youtubeService = GetService();
            var channelsListRequest = youtubeService.Channels.List("contentDetails");
            channelsListRequest.Id = youTubeId;

            // Retrieve the contentDetails part of the channel resource for the authenticated user's channel.
            var channelsListResponse = await channelsListRequest.ExecuteAsync();

            if (!channelsListResponse.Items.Any())
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var videos = new List<Object>();

            var channel = channelsListResponse.Items[0];

            // From the API response, extract the playlist ID that identifies the list
            // of videos uploaded to the authenticated user's channel.
            var uploadsListId = channel.ContentDetails.RelatedPlaylists.Uploads;

            var playlistItemsListRequest = youtubeService.PlaylistItems.List("snippet");
            playlistItemsListRequest.PlaylistId = uploadsListId;
            playlistItemsListRequest.MaxResults = 50;

            // Retrieve the list of videos uploaded to the authenticated user's channel.
            var playlistItemsListResponse = await playlistItemsListRequest.ExecuteAsync();


            foreach (var playlistItem in playlistItemsListResponse.Items)
            {
                // Print information about each video.
                Console.WriteLine("{0} ({1})", playlistItem.Snippet.Title, playlistItem.Snippet.ResourceId.VideoId);
                videos.Add(new
                {
                    title = playlistItem.Snippet.Title,
                    thumbnailUrl = playlistItem.Snippet.Thumbnails.Default__.Url,
                    playerUrl = "http://www.youtube.com/embed/" + playlistItem.Snippet.ResourceId.VideoId
                });
            }

            return Request.CreateResponse<IEnumerable<Object>>(HttpStatusCode.OK, videos);
        }

        private YouTubeService GetService()
        {
            return new YouTubeService(new BaseClientService.Initializer()
            {
                ApiKey = "AIzaSyCkaw1sO8d0LLFdytoN2xph1jXv2UA9x1U",
                ApplicationName = "ezBaseballLeague"
            });
        }

    }
}
