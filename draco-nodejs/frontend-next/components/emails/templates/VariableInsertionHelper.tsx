import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  TextField,
  Autocomplete,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Sports as SportsIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

interface VariableInsertionHelperProps {
  onInsert: (variable: string) => void;
}

interface VariableCategory {
  name: string;
  icon: React.ReactNode;
  variables: Array<{
    key: string;
    label: string;
    description: string;
    example: string;
  }>;
}

export default function VariableInsertionHelper({ onInsert }: VariableInsertionHelperProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Common template variables organized by category
  const variableCategories: VariableCategory[] = [
    {
      name: 'Contact Information',
      icon: <PersonIcon />,
      variables: [
        {
          key: 'firstName',
          label: 'First Name',
          description: "Contact's first name",
          example: 'John',
        },
        {
          key: 'lastName',
          label: 'Last Name',
          description: "Contact's last name",
          example: 'Smith',
        },
        {
          key: 'parentName',
          label: 'Parent Name',
          description: 'Parent or guardian name',
          example: 'Jane Smith',
        },
        {
          key: 'playerName',
          label: 'Player Name',
          description: "Player's full name",
          example: 'John Smith',
        },
      ],
    },
    {
      name: 'Team & League',
      icon: <GroupIcon />,
      variables: [
        {
          key: 'teamName',
          label: 'Team Name',
          description: 'Name of the team',
          example: 'Eagles',
        },
        {
          key: 'leagueName',
          label: 'League Name',
          description: 'Name of the league',
          example: 'Youth Baseball League',
        },
        {
          key: 'seasonName',
          label: 'Season Name',
          description: 'Current season name',
          example: '2024 Spring Season',
        },
        {
          key: 'managerName',
          label: 'Manager Name',
          description: "Team manager's name",
          example: 'Coach Johnson',
        },
        {
          key: 'coachName',
          label: 'Coach Name',
          description: "Team coach's name",
          example: 'Coach Wilson',
        },
      ],
    },
    {
      name: 'Games & Events',
      icon: <SportsIcon />,
      variables: [
        {
          key: 'gameDate',
          label: 'Game Date',
          description: 'Date of the game',
          example: 'Saturday, March 15, 2024',
        },
        {
          key: 'gameTime',
          label: 'Game Time',
          description: 'Time of the game',
          example: '10:00 AM',
        },
        {
          key: 'fieldName',
          label: 'Field Name',
          description: 'Name of the playing field',
          example: 'Central Park Field 1',
        },
      ],
    },
    {
      name: 'Organization',
      icon: <BusinessIcon />,
      variables: [
        {
          key: 'accountName',
          label: 'Organization Name',
          description: 'Name of the organization',
          example: 'City Sports Association',
        },
      ],
    },
  ];

  // Flatten all variables for search
  const allVariables = variableCategories.flatMap((category) =>
    category.variables.map((variable) => ({
      ...variable,
      category: category.name,
      categoryIcon: category.icon,
    })),
  );

  // Filter variables based on search term
  const filteredCategories = variableCategories
    .map((category) => ({
      ...category,
      variables: category.variables.filter(
        (variable) =>
          variable.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          variable.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          variable.description.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((category) => category.variables.length > 0);

  const handleInsertVariable = (variableKey: string) => {
    onInsert(variableKey);
  };

  const handleQuickInsert = (variable: { key: string; label: string }) => {
    handleInsertVariable(variable.key);
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" paragraph>
        Click any variable below to insert it into your template. Variables will be replaced with
        actual data when emails are sent.
      </Typography>

      {/* Search */}
      <Autocomplete
        options={allVariables}
        getOptionLabel={(option) => option.label}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          return (
            <Box component="li" key={key} {...otherProps}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Box sx={{ color: 'text.secondary' }}>{option.categoryIcon}</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">{option.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.description}
                  </Typography>
                </Box>
                <Chip
                  label={`{${option.key}}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              </Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search variables..."
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        )}
        onChange={(_, value) => {
          if (value) {
            handleQuickInsert(value);
            setSearchTerm(''); // Clear search after insertion
          }
        }}
        sx={{ mb: 3 }}
      />

      {/* Variable Categories */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredCategories.map((category) => (
          <Card key={category.name} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ color: 'primary.main' }}>{category.icon}</Box>
                <Typography variant="h6" component="h3">
                  {category.name}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {category.variables.map((variable) => (
                  <Box
                    key={variable.key}
                    sx={{
                      flex: {
                        xs: '1 1 100%',
                        sm: '1 1 calc(50% - 4px)',
                        md: '1 1 calc(33.333% - 6px)',
                      },
                      minWidth: 200,
                    }}
                  >
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<AddIcon />}
                      onClick={() => handleInsertVariable(variable.key)}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        height: 'auto',
                        py: 1,
                        px: 1.5,
                      }}
                    >
                      <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        <Typography variant="body2" component="div" noWrap>
                          {variable.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="div"
                          sx={{
                            fontSize: '0.7rem',
                            lineHeight: 1.2,
                            mt: 0.5,
                          }}
                        >
                          {'{'}
                          {variable.key}
                          {'}'}
                        </Typography>
                      </Box>
                    </Button>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {filteredCategories.length === 0 && searchTerm && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No variables found matching &quot;{searchTerm}&quot;
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Usage Examples */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Usage Examples
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box>
            <Typography variant="body2" component="span" fontWeight="medium">
              Subject:
            </Typography>
            <Typography variant="body2" component="span" sx={{ ml: 1, fontStyle: 'italic' }}>
              &quot;Game Reminder for {'{'}teamName{'}'} - {'{'}gameDate{'}'}&quot;
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" component="span" fontWeight="medium">
              Content:
            </Typography>
            <Typography variant="body2" component="span" sx={{ ml: 1, fontStyle: 'italic' }}>
              &quot;Hi {'{'}firstName{'}'}, your team {'{'}teamName{'}'} has a game on {'{'}gameDate
              {'}'} at {'{'}gameTime{'}'}.&quot;
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
