'use client';

import React, { useMemo, useState } from 'react';
import { Tooltip } from '@mui/material';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import { getRoleColors, getRoleIcon, getRoleTooltipText } from '../../utils/roleIcons';
import { ContactRoleType } from '@draco/shared-schemas';

const renderRoleIconElement = (
  roleId: string | undefined,
  iconProps: SvgIconProps,
): React.ReactElement | null => {
  if (!roleId) {
    return null;
  }

  const IconComponent = getRoleIcon(roleId);
  if (!IconComponent) {
    return null;
  }

  return <IconComponent {...iconProps} />;
};

interface RoleIconProps {
  role: ContactRoleType;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  onClick?: (role: ContactRoleType) => void;
  disabled?: boolean;
}

/**
 * RoleIcon Component
 * Displays a role as an icon with optional tooltip and click handler
 */
const RoleIcon: React.FC<RoleIconProps> = ({
  role,
  size = 'small',
  showTooltip: _showTooltip = true,
  onClick,
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const colors = getRoleColors(role.roleId);
  const baseTooltipText = getRoleTooltipText(role);
  const tooltipText =
    onClick && !disabled ? `${baseTooltipText} (click to remove)` : baseTooltipText;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick && !disabled) {
      onClick(role);
    }
  };

  // If colors are not found, provide fallback based on role name
  const fallbackColors = !colors
    ? {
        primary: role.roleName?.toLowerCase().includes('admin') ? '#1976d2' : '#666',
        background: role.roleName?.toLowerCase().includes('admin') ? '#e3f2fd' : '#f5f5f5',
        hover: role.roleName?.toLowerCase().includes('admin') ? '#1565c0' : '#999',
      }
    : undefined;

  const finalColors = colors || fallbackColors;
  const iconSize = size === 'small' ? 20 : size === 'medium' ? 24 : 32;

  const iconColor = finalColors?.primary || '#1976d2';
  const iconElement = useMemo(
    () =>
      renderRoleIconElement(role.roleId, {
        fontSize: size,
        style: {
          color: iconColor,
          fill: iconColor,
        },
      }),
    [role.roleId, size, iconColor],
  );

  if (!iconElement) {
    return (
      <Tooltip title={tooltipText} arrow placement="top" enterDelay={300} leaveDelay={200}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            borderRadius: '50%',
          }}
        >
          ?
        </span>
      </Tooltip>
    );
  }

  // Use the working simple span approach
  return (
    <Tooltip title={tooltipText} arrow placement="top" enterDelay={300} leaveDelay={200}>
      <span
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: iconSize,
          height: iconSize,
          backgroundColor:
            isHovered && onClick && !disabled
              ? finalColors?.hover || 'rgba(255, 0, 0, 0.1)'
              : finalColors?.background || 'transparent',
          borderRadius: '50%',
          cursor: onClick && !disabled ? 'pointer' : 'default',
          transition: 'all 0.2s ease-in-out',
          opacity: disabled ? 0.5 : 1,
          transform: isHovered && onClick && !disabled ? 'scale(1.1)' : 'scale(1)',
          boxShadow: isHovered && onClick && !disabled ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
          position: 'relative',
        }}
      >
        {iconElement}

        {/* Delete marker on hover */}
        {isHovered && onClick && !disabled && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 12,
              height: 12,
              backgroundColor: '#d32f2f',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              lineHeight: 1,
              border: '1px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          >
            −
          </span>
        )}
      </span>
    </Tooltip>
  );
};

export default RoleIcon;
