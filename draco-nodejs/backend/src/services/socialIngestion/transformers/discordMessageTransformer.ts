import { CommunityMessageAttachmentType, DiscordRichContentNodeType } from '@draco/shared-schemas';
import type { DiscordMessage } from '../connectors/discordConnector.js';

interface NormalizedDiscordMessage {
  attachments: CommunityMessageAttachmentType[];
  richContent: DiscordRichContentNodeType[];
}

const TOKEN_REGEX = /<(a?):([^:>]+):([0-9]+)>|<@!?([0-9]+)>|<@&([0-9]+)>|<#([0-9]+)>/g;

const STICKER_EXTENSION: Record<
  number,
  { extension: string; type: CommunityMessageAttachmentType['type'] }
> = {
  1: { extension: 'png', type: 'image' },
  2: { extension: 'png', type: 'image' },
  3: { extension: 'json', type: 'file' },
  4: { extension: 'gif', type: 'image' },
};

const buildEmojiCdnUrl = (id: string, animated: boolean) =>
  `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?size=64&quality=lossless`;

const buildStickerCdnUrl = (id: string, extension: string) =>
  extension === 'json'
    ? `https://cdn.discordapp.com/stickers/${id}.${extension}`
    : `https://cdn.discordapp.com/stickers/${id}.${extension}?size=160`;

const createTextNode = (text: string): DiscordRichContentNodeType => ({ type: 'text', text });

const createEmojiNode = (
  id: string,
  name: string,
  animated: boolean,
): DiscordRichContentNodeType => ({
  type: 'emoji',
  id,
  name,
  url: buildEmojiCdnUrl(id, animated),
  animated: animated || undefined,
});

const createMentionNode = (
  id: string,
  mentionType: 'user' | 'channel' | 'role',
  label?: string,
  raw?: string,
): DiscordRichContentNodeType => ({
  type: 'mention',
  id,
  mentionType,
  label,
  raw,
});

const addAttachment = (
  list: CommunityMessageAttachmentType[],
  seen: Set<string>,
  attachment: CommunityMessageAttachmentType | null | undefined,
) => {
  if (!attachment || !attachment.url || seen.has(attachment.url)) {
    return;
  }

  list.push({ ...attachment, thumbnailUrl: attachment.thumbnailUrl ?? null });
  seen.add(attachment.url);
};

const normalizeFileAttachment = (
  attachment: NonNullable<DiscordMessage['attachments']>[number],
): CommunityMessageAttachmentType | null => {
  if (!attachment?.url) {
    return null;
  }

  const contentType = attachment.content_type?.toLowerCase() ?? '';
  const isGifContent =
    contentType === 'image/gif' ||
    (contentType === 'video/mp4' &&
      (attachment.url.includes('.gif') || attachment.filename?.includes('.gif')));

  let type: CommunityMessageAttachmentType['type'] = 'file';
  if (contentType.startsWith('video') && !isGifContent) {
    type = 'video';
  } else if (contentType.startsWith('image') || isGifContent) {
    type = 'image';
  }

  const thumbnail = attachment.proxy_url ?? attachment.url;

  return {
    type,
    url: attachment.url,
    thumbnailUrl: thumbnail ?? null,
  };
};

const normalizeEmbedAttachment = (
  embed: NonNullable<DiscordMessage['embeds']>[number],
): CommunityMessageAttachmentType | null => {
  if (!embed) {
    return null;
  }

  const embedType = embed.type?.toLowerCase();
  const possibleUrl =
    embed.video?.url ?? embed.url ?? embed.thumbnail?.url ?? embed.video?.proxy_url;

  if (!possibleUrl) {
    return null;
  }

  const looksLikeGif =
    embedType === 'gifv' ||
    possibleUrl.includes('.gif') ||
    embed.thumbnail?.url?.includes('.gif') ||
    embed.video?.url?.includes('.gif');

  if (!looksLikeGif) {
    return null;
  }

  const thumbnail = embed.thumbnail?.url ?? embed.video?.proxy_url ?? possibleUrl;

  return {
    type: 'image',
    url: possibleUrl,
    thumbnailUrl: thumbnail ?? null,
  };
};

const normalizeStickerAttachment = (
  sticker: NonNullable<DiscordMessage['sticker_items']>[number],
): CommunityMessageAttachmentType | null => {
  if (!sticker?.id) {
    return null;
  }

  const format = STICKER_EXTENSION[sticker.format_type ?? 1] ?? STICKER_EXTENSION[1];
  const url = buildStickerCdnUrl(sticker.id, format.extension);

  return {
    type: format.type,
    url,
    thumbnailUrl: format.type === 'image' ? url : null,
  };
};

export const normalizeDiscordMessage = (message: DiscordMessage): NormalizedDiscordMessage => {
  const attachments: CommunityMessageAttachmentType[] = [];
  const seen = new Set<string>();

  for (const attachment of message.attachments ?? []) {
    addAttachment(attachments, seen, normalizeFileAttachment(attachment));
  }

  for (const embed of message.embeds ?? []) {
    addAttachment(attachments, seen, normalizeEmbedAttachment(embed));
  }

  for (const sticker of message.sticker_items ?? []) {
    addAttachment(attachments, seen, normalizeStickerAttachment(sticker));
  }

  const mentionUserLabels = new Map(
    (message.mentions ?? []).map((mention) => [
      mention.id,
      mention.display_name ?? mention.global_name ?? mention.username,
    ]),
  );

  const mentionChannelLabels = new Map(
    (message.mention_channels ?? []).map((channel) => [channel.id, channel.name ?? channel.id]),
  );

  const richContent: DiscordRichContentNodeType[] = [];
  const content = message.content ?? '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  TOKEN_REGEX.lastIndex = 0;

  while ((match = TOKEN_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      if (text) {
        richContent.push(createTextNode(text));
      }
    }

    if (match[1] !== undefined) {
      const animated = match[1] === 'a';
      const name = match[2];
      const id = match[3];
      richContent.push(createEmojiNode(id, name, animated));
    } else if (match[4] !== undefined) {
      const id = match[4];
      const label = mentionUserLabels.get(id);
      richContent.push(createMentionNode(id, 'user', label, match[0]));
    } else if (match[5] !== undefined) {
      const id = match[5];
      richContent.push(createMentionNode(id, 'role', undefined, match[0]));
    } else if (match[6] !== undefined) {
      const id = match[6];
      const label = mentionChannelLabels.get(id) ?? `#${id}`;
      richContent.push(createMentionNode(id, 'channel', label, match[0]));
    }

    lastIndex = TOKEN_REGEX.lastIndex;
  }

  if (lastIndex < content.length) {
    const trailing = content.slice(lastIndex);
    if (trailing) {
      richContent.push(createTextNode(trailing));
    }
  }

  if (richContent.length === 0 && content) {
    richContent.push(createTextNode(content));
  }

  return {
    attachments,
    richContent,
  };
};
