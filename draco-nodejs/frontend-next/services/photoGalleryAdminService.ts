import {
  createAccountGalleryAlbum,
  createAccountGalleryPhoto,
  deleteAccountGalleryAlbum,
  deleteAccountGalleryPhoto,
  listAccountGalleryAlbumsAdmin,
  listAccountGalleryPhotosAdmin,
  updateAccountGalleryAlbum,
  updateAccountGalleryPhoto,
} from '@draco/shared-api-client';
import type {
  CreatePhotoGalleryAlbumType,
  PhotoGalleryAdminAlbumListType,
  PhotoGalleryAdminAlbumType,
  PhotoGalleryListType,
  PhotoGalleryPhotoType,
  UpdatePhotoGalleryAlbumType,
  UpdatePhotoGalleryPhotoType,
} from '@draco/shared-schemas';
import type { CreateAccountGalleryPhotoData } from '@draco/shared-api-client';
import { createApiClient } from '../lib/apiClientFactory';
import { assertNoApiError, unwrapApiResult } from '../utils/apiResult';

export interface CreateGalleryPhotoInput {
  title: string;
  caption?: string | null;
  albumId?: string | null;
  file: File | Blob;
}

export interface UpdateGalleryPhotoInput {
  title?: string;
  caption?: string | null;
  albumId?: string | null;
}

const createClient = (token?: string | null) => createApiClient({ token: token ?? undefined });

export async function listGalleryPhotosAdmin(
  accountId: string,
  token?: string | null,
  signal?: AbortSignal,
): Promise<PhotoGalleryListType> {
  const client = createClient(token);
  const result = await listAccountGalleryPhotosAdmin({
    client,
    path: { accountId },
    signal,
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to load gallery photos');
}

export async function createGalleryPhotoAdmin(
  accountId: string,
  input: CreateGalleryPhotoInput,
  token?: string | null,
): Promise<PhotoGalleryPhotoType> {
  const client = createClient(token);
  const body: NonNullable<CreateAccountGalleryPhotoData['body']> = {
    title: input.title,
    caption: input.caption ?? undefined,
    albumId: input.albumId ?? null,
    photo: input.file,
  };

  const result = await createAccountGalleryPhoto({
    client,
    path: { accountId },
    body,
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to create gallery photo');
}

export async function updateGalleryPhotoAdmin(
  accountId: string,
  photoId: string,
  input: UpdateGalleryPhotoInput,
  token?: string | null,
): Promise<PhotoGalleryPhotoType> {
  const client = createClient(token);
  const payload: UpdatePhotoGalleryPhotoType = {};

  if (input.title !== undefined) {
    payload.title = input.title;
  }

  if (input.caption !== undefined) {
    payload.caption = input.caption;
  }

  if (input.albumId !== undefined) {
    payload.albumId = input.albumId;
  }

  const result = await updateAccountGalleryPhoto({
    client,
    path: { accountId, photoId },
    body: payload,
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to update gallery photo');
}

export async function deleteGalleryPhotoAdmin(
  accountId: string,
  photoId: string,
  token?: string | null,
): Promise<void> {
  const client = createClient(token);
  const result = await deleteAccountGalleryPhoto({
    client,
    path: { accountId, photoId },
    throwOnError: false,
  });

  assertNoApiError(result, 'Failed to delete gallery photo');
}

export async function listGalleryAlbumsAdmin(
  accountId: string,
  token?: string | null,
  signal?: AbortSignal,
): Promise<PhotoGalleryAdminAlbumListType> {
  const client = createClient(token);
  const result = await listAccountGalleryAlbumsAdmin({
    client,
    path: { accountId },
    signal,
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to load gallery albums');
}

export async function createGalleryAlbumAdmin(
  accountId: string,
  input: CreatePhotoGalleryAlbumType,
  token?: string | null,
): Promise<PhotoGalleryAdminAlbumType> {
  const client = createClient(token);
  const result = await createAccountGalleryAlbum({
    client,
    path: { accountId },
    body: input,
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to create gallery album');
}

export async function updateGalleryAlbumAdmin(
  accountId: string,
  albumId: string,
  input: UpdatePhotoGalleryAlbumType,
  token?: string | null,
): Promise<PhotoGalleryAdminAlbumType> {
  const client = createClient(token);
  const result = await updateAccountGalleryAlbum({
    client,
    path: { accountId, albumId },
    body: input,
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to update gallery album');
}

export async function deleteGalleryAlbumAdmin(
  accountId: string,
  albumId: string,
  token?: string | null,
): Promise<void> {
  const client = createClient(token);
  const result = await deleteAccountGalleryAlbum({
    client,
    path: { accountId, albumId },
    throwOnError: false,
  });

  assertNoApiError(result, 'Failed to delete gallery album');
}
