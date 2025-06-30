import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Modal,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  SportsBaseball as SportsBaseballIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import EnterGameResultsDialog, { GameResultData } from "./EnterGameResultsDialog";

interface GameRecap {
  teamId: string;
  recap: string;
}

interface Game {
  id: string;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  gameStatus: number;
  gameStatusText: string;
  leagueName: string;
  fieldId: string | null;
  fieldName: string | null;
  fieldShortName: string | null;
  hasGameRecap: boolean;
  gameRecaps: GameRecap[];
}

interface ScoreboardData {
  today: Game[];
  yesterday: Game[];
  recaps: Game[];
}

interface BaseballScoreboardProps {
  accountId: string;
  teamId?: string;
}

const groupLabels: Record<keyof ScoreboardData, string> = {
  today: "Today",
  yesterday: "Yesterday",
  recaps: "Recent Recaps (2-5 days ago)",
};

const statusColor = (status: number) => {
  switch (status) {
    case 0:
      return "default"; // Incomplete
    case 1:
      return "success"; // Final
    case 2:
      return "warning"; // Rainout
    case 3:
      return "warning"; // Postponed
    case 4:
      return "error"; // Forfeit
    case 5:
      return "error"; // Did Not Report
    default:
      return "default";
  }
};

const getStatusAbbreviation = (statusText: string): string => {
  switch (statusText) {
    case "Incomplete":
      return "I";
    case "Final":
      return "FIN";
    case "Rainout":
      return "R";
    case "Postponed":
      return "PPD";
    case "Forfeit":
      return "Forfeit"; // Don't abbreviate Forfeit
    case "Did Not Report":
      return "DNR";
    default:
      return statusText;
  }
};

const getGameStatusText = (status: number): string => {
  switch (status) {
    case 0:
      return "Incomplete";
    case 1:
      return "Final";
    case 2:
      return "Rainout";
    case 3:
      return "Postponed";
    case 4:
      return "Forfeit";
    case 5:
      return "Did Not Report";
    default:
      return "Unknown";
  }
};

const getStatusDisplayInfo = (
  game: Game,
): { showOnVisitor: boolean; showOnHome: boolean; statusText: string } => {
  if (game.gameStatus === 0 || game.gameStatus === 1) {
    // Incomplete or Final - no status display
    return { showOnVisitor: false, showOnHome: false, statusText: "" };
  }

  if (game.gameStatus === 4) {
    // Forfeit - show "Forfeit" next to the team with lower score
    const visitorScore = game.awayScore || 0;
    const homeScore = game.homeScore || 0;

    if (visitorScore < homeScore) {
      return { showOnVisitor: true, showOnHome: false, statusText: "Forfeit" };
    } else if (homeScore < visitorScore) {
      return { showOnVisitor: false, showOnHome: true, statusText: "Forfeit" };
    } else {
      // Equal scores (shouldn't happen for forfeit, but just in case)
      return { showOnVisitor: true, showOnHome: false, statusText: "Forfeit" };
    }
  }

  // For Rainout (status 2), Postponed (status 3), and Did Not Report (status 5) - don't show next to team names
  // These will be shown in the score column instead
  return {
    showOnVisitor: false,
    showOnHome: false,
    statusText: getStatusAbbreviation(getGameStatusText(game.gameStatus)),
  };
};

const BaseballScoreboard: React.FC<BaseballScoreboardProps> = ({
  accountId,
  teamId,
}) => {
  const [data, setData] = useState<ScoreboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSeasonId, setCurrentSeasonId] = useState<string | null>(null);
  const [recapModal, setRecapModal] = useState<null | {
    game: Game;
    recap: GameRecap;
  }>(null);
  const [editGameDialog, setEditGameDialog] = useState<{
    open: boolean;
    game: Game | null;
  }>({
    open: false,
    game: null,
  });
  const [userPermissions, setUserPermissions] = useState<{
    isAccountAdmin: boolean;
    isGlobalAdmin: boolean;
  }>({
    isAccountAdmin: false,
    isGlobalAdmin: false,
  });
  const { user, token } = useAuth();

  // Check user permissions
  useEffect(() => {
    const checkPermissions = async () => {
      if (!user || !token) {
        setUserPermissions({ isAccountAdmin: false, isGlobalAdmin: false });
        return;
      }

      try {
        // Check if user is global administrator
        const globalAdminResponse = await fetch(
          `/api/auth/check-role/Administrator`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (globalAdminResponse.ok) {
          const globalAdminData = await globalAdminResponse.json();
          if (globalAdminData.hasRole) {
            setUserPermissions({ isAccountAdmin: true, isGlobalAdmin: true });
            return;
          }
        }

        // Check if user is account administrator for this account
        const accountAdminResponse = await fetch(
          `/api/auth/check-role/AccountAdmin?accountId=${accountId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (accountAdminResponse.ok) {
          const accountAdminData = await accountAdminResponse.json();
          setUserPermissions({
            isAccountAdmin: accountAdminData.hasRole,
            isGlobalAdmin: false,
          });
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        setUserPermissions({ isAccountAdmin: false, isGlobalAdmin: false });
      }
    };

    checkPermissions();
  }, [user, token, accountId]);

  const canEditGames =
    userPermissions.isAccountAdmin || userPermissions.isGlobalAdmin;

  // Common function to load scoreboard data
  const loadScoreboardData = useCallback(async () => {
    // Get current season first
    const seasonResponse = await fetch(
      `/api/accounts/${accountId}/seasons/current`,
    );
    const seasonData = await seasonResponse.json();

    if (!seasonData.success) {
      throw new Error("Failed to load current season");
    }

    const currentSeasonId = seasonData.data.season.id;
    setCurrentSeasonId(currentSeasonId); // Store the season ID in state

    // Calculate date ranges for today, yesterday, and recaps
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Load today's games
    const todayPromise = fetch(
      `/api/accounts/${accountId}/seasons/${currentSeasonId}/games?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}${teamId ? `&teamId=${teamId}` : ""}`,
    ).then((response) => response.json());

    // Load yesterday's games
    const yesterdayPromise = fetch(
      `/api/accounts/${accountId}/seasons/${currentSeasonId}/games?startDate=${yesterday.toISOString()}&endDate=${today.toISOString()}${teamId ? `&teamId=${teamId}` : ""}`,
    ).then((response) => response.json());

    // Load recap games (2-5 days ago with recaps)
    const recapsPromise = fetch(
      `/api/accounts/${accountId}/seasons/${currentSeasonId}/games?startDate=${fiveDaysAgo.toISOString()}&endDate=${twoDaysAgo.toISOString()}${teamId ? `&teamId=${teamId}` : ""}`,
    ).then((response) => response.json());

    const [todayData, yesterdayData, recapsData] = await Promise.all([
      todayPromise,
      yesterdayPromise,
      recapsPromise,
    ]);

    if (!todayData.success || !yesterdayData.success || !recapsData.success) {
      throw new Error("Failed to load games data");
    }

    // Transform the data to match the expected format
    const transformGames = (games: unknown[]): Game[] =>
      games
        .filter((game): game is Record<string, unknown> => typeof game === 'object' && game !== null)
        .map((game) => {
          let leagueName = 'Unknown';
          if (typeof game.league === 'object' && game.league && 'name' in game.league && typeof (game.league as { name?: unknown }).name === 'string') {
            leagueName = (game.league as { name: string }).name;
          }
          let fieldName: string | null = null;
          let fieldShortName: string | null = null;
          if (typeof game.field === 'object' && game.field) {
            if ('name' in game.field && typeof (game.field as { name?: unknown }).name === 'string') {
              fieldName = (game.field as { name: string }).name;
            }
            if ('shortName' in game.field && typeof (game.field as { shortName?: unknown }).shortName === 'string') {
              fieldShortName = (game.field as { shortName: string }).shortName;
            }
          }
          return {
            id: String(game.id ?? ''),
            date: String(game.gameDate ?? ''),
            homeTeamId: String(game.homeTeamId ?? ''),
            awayTeamId: String(game.visitorTeamId ?? ''),
            homeTeamName: typeof game.homeTeamName === 'string' ? game.homeTeamName : 'Unknown',
            awayTeamName: typeof game.visitorTeamName === 'string' ? game.visitorTeamName : 'Unknown',
            homeScore: typeof game.homeScore === 'number' ? game.homeScore : 0,
            awayScore: typeof game.visitorScore === 'number' ? game.visitorScore : 0,
            gameStatus: typeof game.gameStatus === 'number' ? game.gameStatus : 0,
            gameStatusText: getGameStatusText(typeof game.gameStatus === 'number' ? game.gameStatus : 0),
            leagueName,
            fieldId: 'fieldId' in game ? (game.fieldId === null ? null : String(game.fieldId)) : null,
            fieldName,
            fieldShortName,
            hasGameRecap: false, // We'll need to check for recaps separately
            gameRecaps: [], // We'll need to load recaps separately
          };
        });

    return {
      today: transformGames(todayData.data.games),
      yesterday: transformGames(yesterdayData.data.games),
      recaps: transformGames(recapsData.data.games),
    };
  }, [accountId, teamId]);

  const handleEditGame = (game: Game) => {
    setEditGameDialog({ open: true, game });
  };

  const handleSaveGameResults = async (gameData: GameResultData) => {
    if (!token) {
      throw new Error("Authentication required");
    }

    // Get current season ID if not available in state
    let seasonId = currentSeasonId;
    if (!seasonId) {
      const seasonResponse = await fetch(
        `/api/accounts/${accountId}/seasons/current`,
      );
      const seasonData = await seasonResponse.json();

      if (!seasonData.success) {
        throw new Error("Failed to get current season");
      }

      seasonId = seasonData.data.season.id;
    }

    const response = await fetch(
      `/api/accounts/${accountId}/seasons/${seasonId}/games/${gameData.gameId}/results`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          homeScore: gameData.homeScore,
          awayScore: gameData.awayScore,
          gameStatus: gameData.gameStatus,
          emailPlayers: gameData.emailPlayers,
          postToTwitter: gameData.postToTwitter,
          postToBluesky: gameData.postToBluesky,
          postToFacebook: gameData.postToFacebook,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to save game results");
    }

    // Refresh the scoreboard data using the common function
    try {
      const newData = await loadScoreboardData();
      setData(newData);
    } catch (error) {
      console.error("Error refreshing scoreboard data:", error);
      // Don't throw here, just log the error as the save was successful
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    loadScoreboardData()
      .then((newData) => {
        setData(newData);
      })
      .catch((error: unknown) => {
        console.error("Error loading scoreboard data:", error);
        setError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [accountId, teamId, loadScoreboardData]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box color="error.main" p={2}>
        {error}
      </Box>
    );
  }
  if (!data) {
    return null;
  }

  const renderGame = (game: Game) => {
    let localTime = "";
    try {
      if (game.date) {
        // Remove the "Z" to treat as local time instead of UTC
        const localDateString = game.date.replace("Z", "");
        const dateObj = new Date(localDateString);

        // Now format as local time
        localTime = dateObj.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      } else {
        localTime = "TBD";
      }
    } catch (error: unknown) {
      console.error("Error formatting time:", error);
      localTime = "TBD";
    }

    return (
      <Card
        key={game.id}
        variant="outlined"
        sx={{
          mb: 2,
          boxShadow: 2,
          borderRadius: 2,
          background: "linear-gradient(90deg, #0a2342 80%, #1e3a5c 100%)",
          color: "white",
          border: "none",
          position: "relative",
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                game.gameStatusText !== "Incomplete"
                  ? "auto 1fr auto auto"
                  : "auto 1fr auto",
              gap: 1.5,
              alignItems: "start",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
              }}
            >
              <Typography
                variant="subtitle2"
                color="#b0c4de"
                fontWeight={500}
                sx={{ pt: 0.5 }}
              >
                {game.leagueName}
              </Typography>
              {canEditGames && (
                <Tooltip title="Enter Game Results">
                  <IconButton
                    size="small"
                    onClick={() => handleEditGame(game)}
                    sx={{
                      color: "#b0c4de",
                      "&:hover": {
                        color: "white",
                        bgcolor: "rgba(255,255,255,0.1)",
                      },
                      alignSelf: "flex-end",
                      mt: 1,
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Button
                href={`/baseball/team/${game.awayTeamId}`}
                sx={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: "1rem",
                  textTransform: "none",
                  p: 0,
                  minWidth: "auto",
                  textAlign: "left",
                  display: "block",
                  mb: 0.5,
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                size="small"
                title={game.awayTeamName}
              >
                {game.awayTeamName}
                {getStatusDisplayInfo(game).showOnVisitor && (
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{
                      ml: 1,
                      color: "white",
                      backgroundColor:
                        statusColor(game.gameStatus) === "error"
                          ? "error.main"
                          : statusColor(game.gameStatus) === "warning"
                            ? "warning.main"
                            : "primary.main",
                      px: 1,
                      py: 0.25,
                      borderRadius: 0.5,
                      fontWeight: "bold",
                    }}
                  >
                    {getStatusDisplayInfo(game).statusText}
                  </Typography>
                )}
              </Button>
              <Button
                href={`/baseball/team/${game.homeTeamId}`}
                sx={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: "1rem",
                  textTransform: "none",
                  p: 0,
                  minWidth: "auto",
                  textAlign: "left",
                  display: "block",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                size="small"
                title={game.homeTeamName}
              >
                {game.homeTeamName}
                {getStatusDisplayInfo(game).showOnHome && (
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{
                      ml: 1,
                      color: "white",
                      backgroundColor:
                        statusColor(game.gameStatus) === "error"
                          ? "error.main"
                          : statusColor(game.gameStatus) === "warning"
                            ? "warning.main"
                            : "primary.main",
                      px: 1,
                      py: 0.25,
                      borderRadius: 0.5,
                      fontWeight: "bold",
                    }}
                  >
                    {getStatusDisplayInfo(game).statusText}
                  </Typography>
                )}
              </Button>
            </Box>
            {game.gameStatusText !== "Incomplete" &&
              game.gameStatus !== 2 &&
              game.gameStatus !== 3 &&
              game.gameStatus !== 5 && (
                <Box
                  textAlign="center"
                  sx={{ minWidth: "auto", width: "auto" }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color={
                      game.awayScore > game.homeScore ? "success.main" : "white"
                    }
                    sx={{ mb: 0.5 }}
                  >
                    {game.awayScore}
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color={
                      game.homeScore > game.awayScore ? "success.main" : "white"
                    }
                  >
                    {game.homeScore}
                  </Typography>
                </Box>
              )}
            {game.gameStatus === 2 && (
              <Box textAlign="center" sx={{ minWidth: "auto", width: "auto" }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{
                    color: "white",
                    backgroundColor:
                      statusColor(game.gameStatus) === "error"
                        ? "error.main"
                        : statusColor(game.gameStatus) === "warning"
                          ? "warning.main"
                          : "primary.main",
                    px: 1,
                    py: 0.5,
                    borderRadius: 0.5,
                    display: "inline-block",
                  }}
                >
                  {getStatusAbbreviation(getGameStatusText(game.gameStatus))}
                </Typography>
              </Box>
            )}
            {game.gameStatus === 3 && (
              <Box textAlign="center" sx={{ minWidth: "auto", width: "auto" }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{
                    color: "white",
                    backgroundColor:
                      statusColor(game.gameStatus) === "error"
                        ? "error.main"
                        : statusColor(game.gameStatus) === "warning"
                          ? "warning.main"
                          : "primary.main",
                    px: 1,
                    py: 0.5,
                    borderRadius: 0.5,
                    display: "inline-block",
                  }}
                >
                  {getStatusAbbreviation(getGameStatusText(game.gameStatus))}
                </Typography>
              </Box>
            )}
            {game.gameStatus === 5 && (
              <Box textAlign="center" sx={{ minWidth: "auto", width: "auto" }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{
                    color: "white",
                    backgroundColor:
                      statusColor(game.gameStatus) === "error"
                        ? "error.main"
                        : statusColor(game.gameStatus) === "warning"
                          ? "warning.main"
                          : "primary.main",
                    px: 1,
                    py: 0.5,
                    borderRadius: 0.5,
                    display: "inline-block",
                  }}
                >
                  {getStatusAbbreviation(getGameStatusText(game.gameStatus))}
                </Typography>
              </Box>
            )}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
                minWidth: "auto",
                width: "auto",
              }}
            >
              <Box>
                {game.gameStatus === 0 && (
                  <Typography variant="body2" color="#b0c4de" sx={{ pt: 0.5 }}>
                    {localTime}
                  </Typography>
                )}
              </Box>
              <Box>
                {game.gameStatus === 0 &&
                  (game.fieldName || game.fieldShortName) && (
                    <Tooltip
                      title={game.fieldName || game.fieldShortName || ""}
                    >
                      <Button
                        href={`/baseball/field/${game.fieldId}`}
                        sx={{
                          color: "#b0c4de",
                          textTransform: "none",
                          p: 0,
                          minWidth: "auto",
                          fontSize: "0.75rem",
                          "&:hover": {
                            color: "white",
                          },
                        }}
                        size="small"
                      >
                        {(() => {
                          const displayName =
                            game.fieldName &&
                            game.fieldName.length > 5 &&
                            game.fieldShortName
                              ? game.fieldShortName
                              : game.fieldName;
                          return displayName && displayName.length > 5
                            ? `${displayName.substring(0, 5)}...`
                            : displayName;
                        })()}
                      </Button>
                    </Tooltip>
                  )}
                {game.hasGameRecap && (
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1, color: "white", borderColor: "#b0c4de" }}
                    onClick={() =>
                      setRecapModal({ game, recap: game.gameRecaps[0] })
                    }
                  >
                    Recap
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box
      sx={{
        background: "linear-gradient(180deg, #0a2342 60%, #1e3a5c 100%)",
        borderRadius: 3,
        boxShadow: 4,
        p: 3,
        mb: 4,
        color: "white",
        minWidth: 0,
      }}
    >
      <Box display="flex" alignItems="center" mb={2}>
        <SportsBaseballIcon sx={{ color: "#b0c4de", mr: 1 }} />
        <Typography variant="h5" fontWeight={700} color="white">
          Scoreboard
        </Typography>
      </Box>
      {(["today", "yesterday", "recaps"] as (keyof ScoreboardData)[]).map(
        (group) =>
          data[group].length > 0 && (
            <Box key={group} mb={3}>
              <Typography variant="h6" fontWeight={600} color="#b0c4de" mb={1}>
                {groupLabels[group]}
              </Typography>
              {data[group].map(renderGame)}
            </Box>
          ),
      )}
      {data.today.length === 0 && data.yesterday.length === 0 && (
        <Typography color="#b0c4de" textAlign="center" mt={4}>
          No games to display.
        </Typography>
      )}
      <Modal
        open={!!recapModal}
        onClose={() => setRecapModal(null)}
        aria-labelledby="recap-modal-title"
        aria-describedby="recap-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "#0a2342",
            color: "white",
            boxShadow: 24,
            borderRadius: 2,
            p: 4,
            minWidth: 320,
            maxWidth: 500,
            outline: "none",
          }}
        >
          <Typography
            id="recap-modal-title"
            variant="h6"
            fontWeight={700}
            mb={2}
          >
            Game Recap
          </Typography>
          <Typography
            id="recap-modal-description"
            sx={{ whiteSpace: "pre-line" }}
          >
            {recapModal?.recap.recap}
          </Typography>
          <Box mt={3} textAlign="right">
            <Button
              variant="contained"
              color="primary"
              onClick={() => setRecapModal(null)}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
      <EnterGameResultsDialog
        open={editGameDialog.open}
        onClose={() => setEditGameDialog({ open: false, game: null })}
        game={editGameDialog.game}
        onSave={handleSaveGameResults}
      />
    </Box>
  );
};

export default BaseballScoreboard;
