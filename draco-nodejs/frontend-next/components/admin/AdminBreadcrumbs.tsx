'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs, Link, Typography, useTheme } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

interface BreadcrumbLink {
  name: string;
  href: string;
}

interface AdminBreadcrumbsProps {
  accountId: string;
  category?: BreadcrumbLink;
  subcategory?: BreadcrumbLink;
  links?: BreadcrumbLink[];
  currentPage?: string;
}

const AdminBreadcrumbs: React.FC<AdminBreadcrumbsProps> = ({
  accountId,
  category,
  subcategory,
  links,
  currentPage,
}) => {
  const router = useRouter();
  const theme = useTheme();

  const handleNavigation = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
  };

  const intermediateLinks: BreadcrumbLink[] = links ?? [
    ...(category ? [category] : []),
    ...(subcategory ? [subcategory] : []),
  ];

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

      {intermediateLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={handleNavigation(link.href)}
          underline="hover"
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.primary.main,
            },
          }}
        >
          {link.name}
        </Link>
      ))}

      {currentPage && (
        <Typography color="text.primary" aria-current="page">
          {currentPage}
        </Typography>
      )}
    </Breadcrumbs>
  );
};

export default AdminBreadcrumbs;
