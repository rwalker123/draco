'use client';

import React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import type { BaseContactType, RosterMemberType } from '@draco/shared-schemas';
import { parseISO, format } from 'date-fns';

export const formatRosterContactInfo = (contact: BaseContactType): React.ReactNode => {
  const info: React.ReactNode[] = [];

  const contactDetails = contact.contactDetails;

  if (
    contactDetails?.streetAddress ||
    contactDetails?.city ||
    contactDetails?.state ||
    contactDetails?.zip
  ) {
    const addressParts = [
      contactDetails?.streetAddress,
      contactDetails?.city,
      contactDetails?.state,
      contactDetails?.zip,
    ].filter(Boolean);

    if (addressParts.length > 0) {
      const fullAddress = addressParts.join(', ');
      const streetAddress = contactDetails?.streetAddress || '';
      const cityStateZip = [contactDetails?.city, contactDetails?.state, contactDetails?.zip]
        .filter(Boolean)
        .join(', ');

      info.push(
        <Link
          key="address"
          href={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
            display: 'block',
          }}
        >
          {streetAddress && <span style={{ display: 'block' }}>{streetAddress}</span>}
          {cityStateZip && <span style={{ display: 'block' }}>{cityStateZip}</span>}
        </Link>,
      );
    }
  }

  if (contact.email) {
    info.push(
      <Link
        key="email"
        href={`mailto:${contact.email}`}
        sx={{
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        {contact.email}
      </Link>,
    );
  }

  const addPhoneLink = (value: string | undefined | null, label: string, key: string) => {
    if (!value) {
      return;
    }
    const cleaned = value.replace(/\D/g, '');
    info.push(
      <Link
        key={key}
        href={`tel:${cleaned}`}
        sx={{
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        {label}: {value}
      </Link>,
    );
  };

  addPhoneLink(contactDetails?.phone1, 'home', 'phone1');
  addPhoneLink(contactDetails?.phone2, 'cell', 'phone2');
  addPhoneLink(contactDetails?.phone3, 'work', 'phone3');

  if (info.length === 0) {
    return '-';
  }

  return (
    <Table size="small" sx={{ minWidth: 0 }}>
      <TableBody>
        {info.map((item, index) => (
          <TableRow key={index} sx={{ '& td': { border: 0, py: 0.5 } }}>
            <TableCell sx={{ py: 0, px: 0 }}>
              <Typography variant="body2" fontSize="0.75rem">
                {item}
              </Typography>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export interface RosterVerificationOptions {
  showWaiverStatus?: boolean;
  showIdentificationStatus?: boolean;
}

export const formatRosterVerificationInfo = (
  member: RosterMemberType,
  options?: RosterVerificationOptions,
): React.ReactNode => {
  const info: React.ReactNode[] = [];
  const showWaiverStatus = options?.showWaiverStatus ?? false;
  const showIdentificationStatus = options?.showIdentificationStatus ?? false;

  const dateOfBirth = member.player.contact.contactDetails?.dateOfBirth;

  if (dateOfBirth && typeof dateOfBirth === 'string') {
    try {
      const birthDate = parseISO(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const adjustedAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

      const birthMonthYear = format(birthDate, 'MMM yyyy');

      info.push(
        <span key="age" style={{ display: 'block' }}>
          Age: {adjustedAge} ({birthMonthYear})
        </span>,
      );
    } catch {
      // ignore parse errors
    }
  }

  if (member.dateAdded && typeof member.dateAdded === 'string') {
    try {
      info.push(
        <span key="dateadded" style={{ display: 'block' }}>
          Date Added: {format(parseISO(member.dateAdded), 'MMM dd, yyyy')}
        </span>,
      );
    } catch {
      // ignore parse errors
    }
  }

  if (showWaiverStatus) {
    info.push(
      <span key="waiver" style={{ display: 'block' }}>
        Submitted Waiver: {member.submittedWaiver ? 'Yes' : 'No'}
      </span>,
    );
  }

  if (showIdentificationStatus) {
    info.push(
      <span key="license" style={{ display: 'block' }}>
        {"Submitted Driver's License: "}
        {member.player.submittedDriversLicense ? 'Yes' : 'No'}
      </span>,
    );
  }

  if (info.length === 0) {
    return 'No verification data';
  }

  return info;
};
