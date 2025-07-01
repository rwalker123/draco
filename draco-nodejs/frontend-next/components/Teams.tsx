import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Link,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../context/RoleContext";
import { getLogoSize, validateLogoFile, getLogoUrl } from "../config/teams";
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import Image from "next/image";

interface Team {
  id: string;
  teamId: string;
  name: string;
  webAddress?: string;
  youtubeUserId?: string;
  defaultVideo?: string;
  autoPlayVideo?: boolean;
  logoUrl?: string;
}

interface Division {
  id: string;
  divisionId: string;
  divisionName: string;
  priority: number;
  teams: Team[];
}

interface LeagueSeason {
  id: string;
  leagueId: string;
  leagueName: string;
  accountId: string;
  divisions: Division[];
  unassignedTeams: Team[];
}

interface TeamsData {
  season: {
    id: string;
    name: string;
    accountId: string;
  };
  leagueSeasons: LeagueSeason[];
}

interface TeamsProps {
  accountId: string;
  seasonId: string;
  router?: AppRouterInstance;
}

const Teams: React.FC<TeamsProps> = ({ accountId, seasonId, router }) => {
  const { user } = useAuth();
  const { hasRole, hasPermission } = useRole();

  // Check if user has edit permissions for teams
  const canEditTeams =
    user &&
    (hasRole("Administrator") ||
      hasRole("AccountAdmin", { accountId }) ||
      hasRole("LeagueAdmin", { accountId }) ||
      hasPermission("team.manage", { accountId }));

  const [teamsData, setTeamsData] = useState<TeamsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [editingTeamName, setEditingTeamName] = useState<string>("");
  const [editingLogoFile, setEditingLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editDialogError, setEditDialogError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Export menu states
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [selectedLeagueForExport, setSelectedLeagueForExport] =
    useState<LeagueSeason | null>(null);
  const [seasonExportMenuAnchor, setSeasonExportMenuAnchor] =
    useState<null | HTMLElement>(null);

  // Logo configuration
  const LOGO_SIZE = getLogoSize();

  // Track image load errors for team cards
  const [logoLoadError, setLogoLoadError] = useState<{ [teamId: string]: boolean }>({});
  // Track image load error for edit dialog preview
  const [logoPreviewError, setLogoPreviewError] = useState(false);

  // Export roster to CSV function (placeholder)
  const handleExportRoster = async (leagueSeason: LeagueSeason) => {
    try {
      // TODO: Implement backend endpoint for CSV export
      console.log("Exporting roster for league:", leagueSeason.leagueName);

      // Placeholder implementation
      alert(
        `Export roster for ${leagueSeason.leagueName} - Backend implementation pending`,
      );

      // Future implementation would be:
      // const response = await fetch(`/api/accounts/${accountId}/seasons/${currentSeasonId}/leagues/${leagueSeason.id}/roster/export`, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      //   }
      // });
      //
      // if (response.ok) {
      //   const blob = await response.blob();
      //   const url = window.URL.createObjectURL(blob);
      //   const a = document.createElement('a');
      //   a.href = url;
      //   a.download = `${leagueSeason.leagueName}-roster.csv`;
      //   document.body.appendChild(a);
      //   a.click();
      //   window.URL.revokeObjectURL(url);
      //   document.body.removeChild(a);
      // }
    } catch (error) {
      console.error("Error exporting roster:", error);
      alert("Failed to export roster");
    }
  };

  // Export managers to CSV function (placeholder)
  const handleExportManagers = async (leagueSeason: LeagueSeason) => {
    try {
      // TODO: Implement backend endpoint for CSV export
      console.log("Exporting managers for league:", leagueSeason.leagueName);

      // Placeholder implementation
      alert(
        `Export managers for ${leagueSeason.leagueName} - Backend implementation pending`,
      );

      // Future implementation would be:
      // const response = await fetch(`/api/accounts/${accountId}/seasons/${currentSeasonId}/leagues/${leagueSeason.id}/managers/export`, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      //   }
      // });
      //
      // if (response.ok) {
      //   const blob = await response.blob();
      //   const url = window.URL.createObjectURL(blob);
      //   const a = document.createElement('a');
      //   a.href = url;
      //   a.download = `${leagueSeason.leagueName}-managers.csv`;
      //   document.body.appendChild(a);
      //   a.click();
      //   window.URL.revokeObjectURL(url);
      //   document.body.removeChild(a);
      // }
    } catch (error) {
      console.error("Error exporting managers:", error);
      alert("Failed to export managers");
    }
  };

  // Export menu handlers
  const handleExportMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    leagueSeason: LeagueSeason,
  ) => {
    setExportMenuAnchor(event.currentTarget);
    setSelectedLeagueForExport(leagueSeason);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
    setSelectedLeagueForExport(null);
  };

  const handleExportSelection = (type: "roster" | "managers") => {
    if (selectedLeagueForExport) {
      if (type === "roster") {
        handleExportRoster(selectedLeagueForExport);
      } else {
        handleExportManagers(selectedLeagueForExport);
      }
    }
    handleExportMenuClose();
  };

  // Season-level export functions
  const handleExportSeasonRoster = async () => {
    try {
      // TODO: Implement backend endpoint for season roster export
      console.log("Exporting season roster");

      // Placeholder implementation
      alert(`Export season roster - Backend implementation pending`);

      // Future implementation would be:
      // const response = await fetch(`/api/accounts/${accountId}/seasons/${currentSeasonId}/roster/export`, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      //   }
      // });
      //
      // if (response.ok) {
      //   const blob = await response.blob();
      //   const url = window.URL.createObjectURL(blob);
      //   const a = document.createElement('a');
      //   a.href = url;
      //   a.download = `${teamsData?.season.name}-roster.csv`;
      //   document.body.appendChild(a);
      //   a.click();
      //   window.URL.revokeObjectURL(url);
      //   document.body.removeChild(a);
      // }
    } catch (error) {
      console.error("Error exporting season roster:", error);
      alert("Failed to export season roster");
    }
  };

  const handleExportSeasonManagers = async () => {
    try {
      // TODO: Implement backend endpoint for season managers export
      console.log("Exporting season managers");

      // Placeholder implementation
      alert(`Export season managers - Backend implementation pending`);

      // Future implementation would be:
      // const response = await fetch(`/api/accounts/${accountId}/seasons/${currentSeasonId}/managers/export`, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      //   }
      // });
      //
      // if (response.ok) {
      //   const blob = await response.blob();
      //   const url = window.URL.createObjectURL(blob);
      //   const a = document.createElement('a');
      //   a.href = url;
      //   a.download = `${teamsData?.season.name}-managers.csv`;
      //   document.body.appendChild(a);
      //   a.click();
      //   window.URL.revokeObjectURL(url);
      //   document.body.removeChild(a);
      // }
    } catch (error) {
      console.error("Error exporting season managers:", error);
      alert("Failed to export season managers");
    }
  };

  // Season export menu handlers
  const handleSeasonExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSeasonExportMenuAnchor(event.currentTarget);
  };

  const handleSeasonExportMenuClose = () => {
    setSeasonExportMenuAnchor(null);
  };

  const handleSeasonExportSelection = (type: "roster" | "managers") => {
    if (type === "roster") {
      handleExportSeasonRoster();
    } else {
      handleExportSeasonManagers();
    }
    handleSeasonExportMenuClose();
  };

  // Load teams data
  const loadTeamsData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Load league seasons with divisions and teams for the given season
      const leagueSeasonsResponse = await fetch(
        `/api/accounts/${accountId}/seasons/${seasonId}/leagues?unassignedTeams=false`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!leagueSeasonsResponse.ok) {
        throw new Error("Failed to load teams data");
      }

      const leagueSeasonsData = await leagueSeasonsResponse.json();
      setTeamsData(leagueSeasonsData.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load teams data",
      );
    } finally {
      setLoading(false);
    }
  }, [accountId, seasonId]);

  useEffect(() => {
    loadTeamsData();
  }, [loadTeamsData]);

  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    setEditingTeamName(team.name);
    setEditingLogoFile(null);
    setLogoPreview(team.logoUrl || null);
    setEditDialogError(null);
    setEditDialogOpen(true);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file using the config function
      const validationError = validateLogoFile(file);
      if (validationError) {
        setEditDialogError(validationError);
        return;
      }

      setEditingLogoFile(file);
      setEditDialogError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTeam = async () => {
    if (!selectedTeam) return;

    try {
      setSaving(true);
      setEditDialogError(null);

      // Validate team name
      if (!editingTeamName.trim()) {
        setEditDialogError("Team name is required");
        return;
      }

      // Check if user is authenticated
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        setEditDialogError("Authentication required. Please log in again.");
        return;
      }

      // Prepare form data for file upload
      const formData = new FormData();
      formData.append("name", editingTeamName.trim());

      if (editingLogoFile) {
        formData.append("logo", editingLogoFile);
      }

      // Update team information
      const updateResponse = await fetch(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${selectedTeam.id}`,
        {
          method: "PUT",
          body: formData,
          headers: {
            // Don't set Content-Type for FormData, let the browser set it with boundary
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!updateResponse.ok) {
        if (updateResponse.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update team");
      }

      const updateData = await updateResponse.json();
      setSuccess(updateData.message || "Team updated successfully");
      setEditDialogOpen(false);

      // Update local state directly instead of reloading all data
      if (teamsData) {
        const cacheBuster = Date.now();
        setTeamsData((prevData) => {
          if (!prevData) return prevData;

          const updatedLeagueSeasons = prevData.leagueSeasons.map(
            (leagueSeason) => ({
              ...leagueSeason,
              divisions: leagueSeason.divisions.map((division) => ({
                ...division,
                teams: division.teams.map((team) =>
                  team.id === selectedTeam.id
                    ? {
                        ...team,
                        name: editingTeamName.trim(),
                        logoUrl: getLogoUrl(accountId, team.teamId, seasonId, team.id, cacheBuster),
                      }
                    : team,
                ),
              })),
              unassignedTeams: leagueSeason.unassignedTeams.map((team) =>
                team.id === selectedTeam.id
                  ? {
                      ...team,
                      name: editingTeamName.trim(),
                      logoUrl: getLogoUrl(accountId, team.teamId, seasonId, team.id, cacheBuster),
                    }
                  : team,
              ),
            }),
          );

          return {
            ...prevData,
            leagueSeasons: updatedLeagueSeasons,
          };
        });
        // Reset logo load error for this team so the new image is shown
        setLogoLoadError((prev) => {
          const updated = { ...prev };
          if (selectedTeam) delete updated[selectedTeam.id];
          return updated;
        });
      }

      // Clear form state
      setSelectedTeam(null);
      setEditingTeamName("");
      setEditingLogoFile(null);
      setLogoPreview(null);
      setEditDialogError(null);
    } catch (err) {
      console.error("Error in handleSaveTeam:", err);
      setEditDialogError(
        err instanceof Error ? err.message : "Failed to update team",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setSelectedTeam(null);
    setEditingTeamName("");
    setEditingLogoFile(null);
    setLogoPreview(null);
    setEditDialogError(null);
    setSaving(false);
  };

  const renderTeamCard = (team: Team) => (
    <Box
      key={team.id}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 1,
        p: 1,
        borderRadius: 1,
        "&:hover": {
          backgroundColor: "action.hover",
        },
      }}
    >
      <Box
        sx={{
          width: LOGO_SIZE,
          height: LOGO_SIZE,
          bgcolor: "grey.300",
          flexShrink: 0,
          borderRadius: 1,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {team.logoUrl && !logoLoadError[team.id] ? (
          <Image
            src={team.logoUrl}
            alt={team.name + " logo"}
            fill
            style={{ objectFit: "cover" }}
            unoptimized
            onError={() => setLogoLoadError((prev) => ({ ...prev, [team.id]: true }))}
          />
        ) : (
          <Typography variant="h6" sx={{ fontSize: "1.2rem" }}>
            {team.name.charAt(0).toUpperCase()}
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => router?.push(`/account/${accountId}/seasons/${seasonId}/teams/${team.id}`)}
          sx={{
            fontWeight: "bold",
            textDecoration: "none",
            color: "primary.main",
            "&:hover": {
              textDecoration: "underline",
              color: "primary.dark",
            },
            textAlign: "left",
            border: "none",
            background: "none",
            cursor: "pointer",
            p: 0,
            m: 0,
            fontFamily: "inherit",
            fontSize: "inherit",
          }}
        >
          {team.name}
        </Link>
      </Box>

      {canEditTeams && (
        <IconButton
          onClick={() => openEditDialog(team)}
          color="primary"
          size="small"
          title="Edit team"
          sx={{ flexShrink: 0 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );

  const renderDivision = (division: Division) => (
    <Box key={division.id} sx={{ mb: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: "bold",
          color: "primary.main",
          mb: 1,
          textTransform: "uppercase",
          fontSize: "0.8rem",
        }}
      >
        {division.divisionName}
      </Typography>
      <Box sx={{ pl: 1 }}>
        {division.teams
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((team) => renderTeamCard(team))}
      </Box>
    </Box>
  );

  const renderLeagueSeason = (leagueSeason: LeagueSeason) => (
    <Box
      key={leagueSeason.id}
      sx={{
        mb: 3,
        minWidth: 300,
        maxWidth: 400,
        flex: "1 1 auto",
      }}
    >
      <Paper sx={{ p: 2, height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            borderBottom: "2px solid",
            borderColor: "secondary.main",
            pb: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              color: "secondary.main",
            }}
          >
            {leagueSeason.leagueName}
          </Typography>

          {canEditTeams && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={(event) => handleExportMenuOpen(event, leagueSeason)}
              sx={{
                minWidth: "auto",
                px: 1,
                py: 0.5,
                fontSize: "0.75rem",
              }}
            >
              Export
            </Button>
          )}
        </Box>

        {leagueSeason.divisions.map(renderDivision)}
      </Paper>
    </Box>
  );

  // Reset logoPreviewError when logoPreview changes
  useEffect(() => {
    setLogoPreviewError(false);
  }, [logoPreview]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!teamsData) {
    return <Alert severity="info">No teams data available</Alert>;
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4">Teams</Typography>
          {!user && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              Public view - Sign in to edit teams
            </Typography>
          )}
          {user && !canEditTeams && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              Read-only mode - Contact an administrator for editing permissions
            </Typography>
          )}
        </Box>
      </Box>

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {teamsData.season.name} Season
          </Typography>

          {canEditTeams && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              endIcon={<ExpandMoreIcon />}
              onClick={handleSeasonExportMenuOpen}
              sx={{
                minWidth: "auto",
                px: 2,
                py: 1,
              }}
            >
              Export Season
            </Button>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            justifyContent: "flex-start",
          }}
        >
          {teamsData.leagueSeasons.map(renderLeagueSeason)}
        </Box>
      </Paper>

      {/* Edit Team Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCancelEdit}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Team</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
            {editDialogError && (
              <Alert severity="error" onClose={() => setEditDialogError(null)}>
                {editDialogError}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Team Name"
              value={editingTeamName}
              onChange={(e) => setEditingTeamName(e.target.value)}
              disabled={saving}
            />

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Team Logo
              </Typography>

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Box
                  sx={{
                    width: LOGO_SIZE,
                    height: LOGO_SIZE,
                    bgcolor: "grey.300",
                    borderRadius: 1,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  {logoPreview && !logoPreviewError ? (
                    <Image
                      src={logoPreview}
                      alt={editingTeamName + " logo preview"}
                      fill
                      style={{ objectFit: "cover" }}
                      unoptimized
                      onError={() => setLogoPreviewError(true)}
                    />
                  ) : (
                    <Typography variant="h6" sx={{ fontSize: "1.2rem" }}>
                      {editingTeamName.charAt(0).toUpperCase()}
                    </Typography>
                  )}
                </Box>

                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCameraIcon />}
                  disabled={saving}
                >
                  Upload Logo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </Button>
              </Box>

              <Typography variant="caption" color="textSecondary">
                Recommended size: {LOGO_SIZE}x{LOGO_SIZE} pixels. Max file size:
                10MB.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveTeam}
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleExportMenuClose}
      >
        <MenuItem onClick={() => handleExportSelection("roster")}>
          Export Roster
        </MenuItem>
        <MenuItem onClick={() => handleExportSelection("managers")}>
          Export Managers
        </MenuItem>
      </Menu>

      {/* Season Export Menu */}
      <Menu
        anchorEl={seasonExportMenuAnchor}
        open={Boolean(seasonExportMenuAnchor)}
        onClose={handleSeasonExportMenuClose}
      >
        <MenuItem onClick={() => handleSeasonExportSelection("roster")}>
          Export All Rosters
        </MenuItem>
        <MenuItem onClick={() => handleSeasonExportSelection("managers")}>
          Export All Managers
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Teams;
