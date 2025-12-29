'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs, Link, Typography, useTheme } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

interface AdminBreadcrumbsProps {
  accountId: string;
  category?: {
    name: string;
    href: string;
  };
  currentPage?: string;
}

const AdminBreadcrumbs: React.FC<AdminBreadcrumbsProps> = ({
  accountId,
  category,
  currentPage,
}) => {
  const router = useRouter();
  const theme = useTheme();

  const handleNavigation = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="Admin navigation"
      sx={{ mb: 2 }}
    >
      <Link
        href={`/account/${accountId}/admin`}
        onClick={handleNavigation(`/account/${accountId}/admin`)}
        underline="hover"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          color: theme.palette.text.secondary,
          '&:hover': {
            color: theme.palette.primary.main,
          },
        }}
      >
        <AdminPanelSettingsIcon fontSize="small" />
        Admin
      </Link>

      {category && (
        <Link
          href={category.href}
          onClick={handleNavigation(category.href)}
          underline="hover"
          sx={{
            color: currentPage ? theme.palette.text.secondary : theme.palette.text.primary,
            '&:hover': {
              color: theme.palette.primary.main,
            },
          }}
        >
          {category.name}
        </Link>
      )}

      {currentPage && (
        <Typography color="text.primary" aria-current="page">
          {currentPage}
        </Typography>
      )}
    </Breadcrumbs>
  );
};

export default AdminBreadcrumbs;
