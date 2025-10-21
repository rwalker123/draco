import React from 'react';
import PhotoGalleryCard, { type PhotoGalleryCardProps } from '../PhotoGalleryCard';
import type { PhotoGalleryPhotoType } from '@draco/shared-schemas';

type BasePhotoGalleryAdminProps = Omit<PhotoGalleryCardProps, 'variant' | 'onEdit' | 'onDelete'>;

export interface PhotoGalleryAdminPhotoCardProps extends BasePhotoGalleryAdminProps {
  photo: PhotoGalleryPhotoType;
  onEdit: NonNullable<PhotoGalleryCardProps['onEdit']>;
  onDelete: NonNullable<PhotoGalleryCardProps['onDelete']>;
}

export const PhotoGalleryAdminPhotoCard: React.FC<PhotoGalleryAdminPhotoCardProps> = ({
  onEdit,
  onDelete,
  ...rest
}) => (
  <PhotoGalleryCard
    variant="admin"
    onEdit={onEdit}
    onDelete={onDelete}
    disableOriginalLink
    {...rest}
  />
);

export default PhotoGalleryAdminPhotoCard;
