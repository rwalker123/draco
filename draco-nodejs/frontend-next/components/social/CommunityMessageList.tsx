'use client';

import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { OpenInNew, Image as ImageIcon, Movie, AttachFile, Audiotrack } from '@mui/icons-material';
import type {
  CommunityMessagePreviewType,
  CommunityMessageAttachmentType,
} from '@draco/shared-schemas';
import DiscordRichContent from './DiscordRichContent';
import DiscordStickerAnimation from './DiscordStickerAnimation';

const defaultFormatTimestamp = (value: string): string => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export interface CommunityMessageListProps {
  messages: CommunityMessagePreviewType[];
  formatTimestamp?: (timestamp: string) => string;
  onPermalinkClick?: (permalink?: string) => void;
}

const AttachmentIcon = ({ type }: { type: CommunityMessageAttachmentType['type'] }) => {
  switch (type) {
    case 'image':
      return <ImageIcon fontSize="small" />;
    case 'video':
      return <Movie fontSize="small" />;
    case 'audio':
      return <Audiotrack fontSize="small" />;
    case 'lottie':
      return <ImageIcon fontSize="small" />;
    default:
      return <AttachFile fontSize="small" />;
  }
};

const CommunityMessageList: React.FC<CommunityMessageListProps> = ({
  messages,
  formatTimestamp = defaultFormatTimestamp,
  onPermalinkClick,
}) => {
  return (
    <List>
      {messages.map((message, index) => {
        const canOpen = Boolean(onPermalinkClick && message.permalink);
        return (
          <React.Fragment key={message.id}>
            {index > 0 ? <Divider component="li" /> : null}
            <ListItem
              alignItems="flex-start"
              disableGutters
              onClick={() =>
                canOpen ? onPermalinkClick?.(message.permalink ?? undefined) : undefined
              }
              sx={{
                cursor: canOpen ? 'pointer' : 'default',
                px: 1,
                borderRadius: 1,
                opacity: canOpen ? 1 : 0.75,
                '&:hover': canOpen ? { backgroundColor: 'action.hover' } : undefined,
              }}
            >
              <ListItemAvatar>
                <Avatar src={message.avatarUrl ?? undefined}>
                  {(message.authorDisplayName ?? 'C').charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography component="div" variant="body2">
                    <Box
                      component="div"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography variant="subtitle2" component="span">
                        {message.authorDisplayName}
                      </Typography>
                      <Chip label={`#${message.channelName}`} size="small" variant="outlined" />
                      <Typography variant="caption" color="text.secondary" component="span">
                        {formatTimestamp(message.postedAt)}
                      </Typography>
                      {message.permalink ? (
                        <Button
                          size="small"
                          startIcon={<OpenInNew fontSize="inherit" />}
                          component="a"
                          href={message.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Reply in Discord
                        </Button>
                      ) : null}
                    </Box>
                  </Typography>
                }
                secondary={
                  <Stack spacing={1} sx={{ mt: 1 }} component="div">
                    <Typography variant="body2" color="text.primary" component="div">
                      <DiscordRichContent nodes={message.richContent} fallback={message.content} />
                    </Typography>
                    {message.attachments && message.attachments.length > 0 ? (
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" component="div">
                        {message.attachments.map((attachment, attachmentIndex) => {
                          const lowerUrl = attachment.url.toLowerCase();
                          let normalizedType: CommunityMessageAttachmentType['type'] =
                            attachment.type;

                          if (normalizedType === 'image' && /\.(mp4|webm|mov)$/i.test(lowerUrl)) {
                            normalizedType = 'video';
                          } else if (
                            normalizedType === 'file' &&
                            /\.(gif|png|jpg|jpeg|webp)$/i.test(lowerUrl)
                          ) {
                            normalizedType = 'image';
                          } else if (
                            normalizedType === 'file' &&
                            /\.(mp4|webm|mov)$/i.test(lowerUrl)
                          ) {
                            normalizedType = 'video';
                          } else if (
                            normalizedType === 'file' &&
                            /\.(mp3|ogg|wav|m4a)$/i.test(lowerUrl)
                          ) {
                            normalizedType = 'audio';
                          }

                          if (normalizedType === 'lottie') {
                            const json = attachment.metadata?.lottieJson ?? null;
                            return (
                              <Box key={`${message.id}-${attachment.url}`} sx={{ minWidth: 200 }}>
                                {json ? (
                                  <DiscordStickerAnimation json={json} />
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    Sticker unavailable
                                  </Typography>
                                )}
                              </Box>
                            );
                          }

                          if (normalizedType === 'image') {
                            return (
                              <Box
                                key={`${message.id}-${attachment.url}`}
                                component="img"
                                src={attachment.thumbnailUrl ?? attachment.url}
                                alt={`Attachment image ${attachmentIndex + 1}`}
                                sx={{
                                  maxWidth: 160,
                                  maxHeight: 160,
                                  borderRadius: 1,
                                  objectFit: 'cover',
                                }}
                              />
                            );
                          }

                          if (normalizedType === 'audio') {
                            return (
                              <Box key={`${message.id}-${attachment.url}`} sx={{ minWidth: 200 }}>
                                <audio
                                  controls
                                  src={attachment.url}
                                  style={{ width: '100%' }}
                                  preload="none"
                                >
                                  <track kind="captions" />
                                </audio>
                              </Box>
                            );
                          }

                          if (normalizedType === 'video') {
                            const contentLower = (message.content ?? '').toLowerCase();
                            const isGifLike =
                              attachment.thumbnailUrl?.toLowerCase().includes('.gif') ||
                              attachment.url.toLowerCase().includes('.gif') ||
                              contentLower.includes('.gif') ||
                              attachment.url.includes('tenor') ||
                              attachment.url.includes('giphy');
                            return (
                              <Box key={`${message.id}-${attachment.url}`} sx={{ minWidth: 240 }}>
                                <video
                                  controls={!isGifLike}
                                  autoPlay={isGifLike}
                                  loop={isGifLike}
                                  muted={isGifLike}
                                  playsInline
                                  src={attachment.url}
                                  style={{ width: '100%', maxHeight: 320 }}
                                  preload={isGifLike ? 'auto' : 'metadata'}
                                  poster={attachment.thumbnailUrl ?? undefined}
                                />
                              </Box>
                            );
                          }

                          return (
                            <Chip
                              key={`${message.id}-${attachment.url}`}
                              icon={<AttachmentIcon type={attachment.type} />}
                              label={attachment.type}
                              component="a"
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              clickable
                              variant="outlined"
                            />
                          );
                        })}
                      </Stack>
                    ) : null}
                  </Stack>
                }
                primaryTypographyProps={{ component: 'div' }}
                secondaryTypographyProps={{ component: 'div' }}
              />
            </ListItem>
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default CommunityMessageList;
