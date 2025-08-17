import React from 'react';
import { Box, Typography, Button, Card, CardContent, Divider } from '@mui/material';
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

  const handleInsertVariable = (variableKey: string) => {
    onInsert(variableKey);
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click any variable below to insert it into your template. Variables will be replaced with
        actual data when emails are sent.
      </Typography>

      {/* Variable Categories */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
        {variableCategories.map((category) => (
          <Card key={category.name} variant="outlined" sx={{ width: 'fit-content', minWidth: 300 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ color: 'primary.main' }}>{category.icon}</Box>
                <Typography variant="h6" component="h3">
                  {category.name}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {category.variables.map((variable) => (
                  <Button
                    key={variable.key}
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleInsertVariable(variable.key)}
                    sx={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      height: 'auto',
                      py: 1,
                      px: 1.5,
                      minWidth: 'auto',
                      width: 'fit-content',
                    }}
                  >
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography variant="body2" component="div">
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
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

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
