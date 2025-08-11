'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Divider,
  IconButton,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { UserDisplayCardProps } from '../../../../types/userTable';
import { User, UserRole } from '../../../../types/users';
import RoleIconGrid from '../../RoleIconGrid';
import UserAvatar from '../../UserAvatar';
import { EmailButton } from '../../../emails/common/EmailButton';
import RegistrationStatusChip from '../../RegistrationStatusChip';

const UserDisplayCard: React.FC<UserDisplayCardProps> = ({
  user,
  cardSize,
  onAssignRole,
  onRemoveRole,
  onEditContact,
  onDeleteContact,
  onDeleteContactPhoto,
  onRevokeRegistration,
  canManageUsers,
  getRoleDisplayName: _getRoleDisplayName,
  showActions = true,
}) => {
  // Card size configurations
  const cardConfig = {
    compact: {
      height: 280,
      width: 280,
      avatarSize: 40,
      titleVariant: 'subtitle1' as const,
      subtitleVariant: 'body2' as const,
      maxRoles: 2,
      showDetails: false,
    },
    comfortable: {
      height: 360,
      width: 320,
      avatarSize: 56,
      titleVariant: 'h6' as const,
      subtitleVariant: 'body2' as const,
      maxRoles: 3,
      showDetails: true,
    },
    spacious: {
      height: 420,
      width: 360,
      avatarSize: 72,
      titleVariant: 'h5' as const,
      subtitleVariant: 'body1' as const,
      maxRoles: 5,
      showDetails: true,
    },
  };

  const config = cardConfig[cardSize];

  const handleAssignRole = async () => {
    // Convert EnhancedUser to User for the callback
    const baseUser: User = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userId: user.userId,
      contactDetails: user.contactDetails,
      roles: user.roles,
    };
    await onAssignRole(baseUser);
  };

  const handleRemoveRole = (role: UserRole) => {
    if (onRemoveRole) {
      // Convert EnhancedUser to User for the callback
      const baseUser: User = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userId: user.userId,
        contactDetails: user.contactDetails,
        roles: user.roles,
      };
      onRemoveRole(baseUser, role);
    }
  };

  // Convert activeRoleNames to UserRole objects for RoleIconGrid
  const userRoles: UserRole[] = user.roles || [];

  return (
    <Card
      sx={{
        height: config.height,
        width: config.width,
        cursor: 'default',
        transition: 'all 0.2s ease-in-out',
        border: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
          borderColor: 'primary.light',
        },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Role Icons in upper left corner */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <RoleIconGrid
          roles={userRoles}
          maxVisible={config.maxRoles}
          size={cardSize === 'compact' ? 'small' : 'medium'}
          compact={true}
          canManageUsers={canManageUsers}
          onRemoveRole={handleRemoveRole}
        />
        {canManageUsers && (
          <Tooltip title="Assign Role">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleAssignRole();
              }}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  color: 'primary.main',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Badge
                badgeContent={user.roleCount}
                color="primary"
                max={99}
                showZero={false}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.6rem',
                    minWidth: '16px',
                    height: '16px',
                  },
                }}
              >
                <PersonAddIcon fontSize={cardSize === 'compact' ? 'small' : 'medium'} />
              </Badge>
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Direct Action Icons */}
      {showActions && canManageUsers && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            display: 'flex',
            gap: 0.5,
          }}
        >
          <Tooltip title="Edit User">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                // Convert EnhancedUser to Contact for the edit dialog
                const contact = {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                  userId: user.userId,
                  photoUrl: user.photoUrl,
                  contactDetails: user.contactDetails,
                  contactroles: user.roles?.map((role) => ({
                    id: role.id,
                    roleId: role.roleId,
                    roleName: role.roleName,
                    roleData: role.roleData,
                    contextName: role.contextName,
                  })),
                };

                // This will be passed down from the parent component that uses useUserManagement
                if (typeof onEditContact === 'function') {
                  onEditContact(contact);
                }
              }}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  color: 'primary.main',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <EditIcon fontSize={cardSize === 'compact' ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>

          {onDeleteContact && (
            <Tooltip title="Delete Contact">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteContact({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    userId: user.userId,
                    contactDetails: user.contactDetails,
                  });
                }}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    color: 'error.main',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <DeleteIcon fontSize={cardSize === 'compact' ? 'small' : 'medium'} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      <CardContent
        sx={{ pb: 1, pt: 3, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* User Avatar and Basic Info */}
        <Stack direction="column" alignItems="center" spacing={2} mb={2}>
          <UserAvatar
            user={user}
            size={config.avatarSize}
            onClick={
              canManageUsers && onEditContact
                ? (e) => {
                    e.stopPropagation();
                    // Convert EnhancedUser to Contact for the edit dialog
                    const contact = {
                      id: user.id,
                      firstName: user.firstName,
                      lastName: user.lastName,
                      email: user.email,
                      userId: user.userId,
                      photoUrl: user.photoUrl,
                      contactDetails: user.contactDetails,
                      contactroles: user.roles?.map((role) => ({
                        id: role.id,
                        roleId: role.roleId,
                        roleName: role.roleName,
                        roleData: role.roleData,
                        contextName: role.contextName,
                      })),
                    };
                    onEditContact(contact);
                  }
                : undefined
            }
            showHoverEffects={canManageUsers}
            enablePhotoActions={canManageUsers}
            onPhotoDelete={onDeleteContactPhoto}
          />

          <Box textAlign="center" sx={{ minWidth: 0, width: '100%' }}>
            <Typography
              variant={config.titleVariant}
              component="h3"
              fontWeight={600}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {user.displayName}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
              <RegistrationStatusChip
                userId={user.userId}
                contactId={user.id}
                size={cardSize === 'compact' ? 'small' : 'medium'}
                canManage={canManageUsers}
                onRevoke={onRevokeRegistration}
              />
            </Box>
            {user.email && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mt: 0.5,
                  gap: 1,
                }}
              >
                <Typography
                  variant={config.subtitleVariant}
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.email}
                </Typography>
                <EmailButton
                  contact={{
                    id: user.id,
                    firstname: user.firstName,
                    lastname: user.lastName,
                    email: user.email,
                  }}
                  variant="icon"
                  size={cardSize === 'compact' ? 'small' : 'medium'}
                />
              </Box>
            )}
          </Box>
        </Stack>

        {/* Contact Information */}
        {config.showDetails &&
          (user.contactDetails?.phone1 ||
            user.contactDetails?.phone2 ||
            user.contactDetails?.phone3 ||
            user.fullAddress) && (
            <Box mb={2} sx={{ minWidth: 0 }}>
              {user.contactDetails?.phone1 && (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  mb={0.5}
                  sx={{
                    minWidth: 0,
                    cursor: 'pointer',
                    '&:hover': {
                      '& .MuiSvgIcon-root': {
                        color: 'primary.main',
                      },
                      '& .MuiTypography-root': {
                        color: 'primary.main',
                        textDecoration: 'underline',
                      },
                    },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${user.contactDetails?.phone1?.replace(/\D/g, '')}`, '_blank');
                  }}
                >
                  <PhoneIcon fontSize="small" color="action" sx={{ flexShrink: 0 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {user.contactDetails.phone1} (Home)
                  </Typography>
                </Stack>
              )}

              {user.contactDetails?.phone2 && (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  mb={0.5}
                  sx={{
                    minWidth: 0,
                    cursor: 'pointer',
                    '&:hover': {
                      '& .MuiSvgIcon-root': {
                        color: 'primary.main',
                      },
                      '& .MuiTypography-root': {
                        color: 'primary.main',
                        textDecoration: 'underline',
                      },
                    },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${user.contactDetails?.phone2?.replace(/\D/g, '')}`, '_blank');
                  }}
                >
                  <PhoneIcon fontSize="small" color="action" sx={{ flexShrink: 0 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {user.contactDetails.phone2} (Cell)
                  </Typography>
                </Stack>
              )}

              {user.contactDetails?.phone3 && (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  mb={0.5}
                  sx={{
                    minWidth: 0,
                    cursor: 'pointer',
                    '&:hover': {
                      '& .MuiSvgIcon-root': {
                        color: 'primary.main',
                      },
                      '& .MuiTypography-root': {
                        color: 'primary.main',
                        textDecoration: 'underline',
                      },
                    },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${user.contactDetails?.phone3?.replace(/\D/g, '')}`, '_blank');
                  }}
                >
                  <PhoneIcon fontSize="small" color="action" sx={{ flexShrink: 0 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {user.contactDetails.phone3} (Work)
                  </Typography>
                </Stack>
              )}

              {user.fullAddress && (
                <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ minWidth: 0 }}>
                  <LocationIcon fontSize="small" color="action" sx={{ flexShrink: 0, mt: 0.1 }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.4,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {user.fullAddress}
                  </Typography>
                </Stack>
              )}
            </Box>
          )}

        {/* User Stats */}
        {user.lastActivity && (
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Active {new Date(user.lastActivity).toLocaleDateString()}
            </Typography>
          </Box>
        )}

        {/* Additional Contact Details */}
        {config.showDetails && (user.contactDetails?.dateofbirth || user.middleName) && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ minWidth: 0 }}>
              {user.contactDetails?.dateofbirth && (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  mb={0.5}
                  sx={{ minWidth: 0 }}
                >
                  <CalendarIcon fontSize="small" color="action" sx={{ flexShrink: 0 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    Born: {new Date(user.contactDetails.dateofbirth).toLocaleDateString()}
                  </Typography>
                </Stack>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UserDisplayCard;
