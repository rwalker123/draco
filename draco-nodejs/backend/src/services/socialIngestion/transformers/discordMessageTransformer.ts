import { CommunityMessageAttachmentType, DiscordRichContentNodeType } from '@draco/shared-schemas';
import type { DiscordMessage } from '../connectors/discordConnector.js';

interface NormalizedDiscordMessage {
  attachments: CommunityMessageAttachmentType[];
  richContent: DiscordRichContentNodeType[];
}

const TOKEN_REGEX = /<(a?):([^:>]+):([0-9]+)>|<@!?([0-9]+)>|<@&([0-9]+)>|<#([0-9]+)>/g;

const STICKER_FORMAT_MAP: Record<
  number,
  { extension: string; renderType: CommunityMessageAttachmentType['type'] | 'lottie' }
> = {
  1: { extension: 'png', renderType: 'image' },
  2: { extension: 'png', renderType: 'image' },
  3: { extension: 'json', renderType: 'lottie' },
  4: { extension: 'gif', renderType: 'image' },
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
  ...(animated ? { animated: true } : {}),
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
  const fileName = attachment.filename?.toLowerCase() ?? '';
  const normalizedUrl = attachment.url.toLowerCase();
  const looksLikeAudio =
    contentType.startsWith('audio') ||
    fileName.endsWith('.ogg') ||
    fileName.endsWith('.mp3') ||
    normalizedUrl.endsWith('.ogg') ||
    normalizedUrl.endsWith('.mp3');

  if (contentType.startsWith('video') && !isGifContent) {
    type = 'video';
  } else if (looksLikeAudio) {
    type = 'audio';
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

  const videoUrl = embed.video?.url ?? embed.video?.proxy_url ?? null;
  const thumbnail = embed.thumbnail?.url ?? embed.image?.url ?? embed.url ?? null;
  const rawUrl = embed.url ?? embed.thumbnail?.url ?? null;

  if (videoUrl) {
    return {
      type: 'video',
      url: videoUrl,
      thumbnailUrl: thumbnail ?? rawUrl ?? null,
    };
  }

  if (thumbnail) {
    return {
      type: 'image',
      url: thumbnail,
      thumbnailUrl: thumbnail,
    };
  }

  return null;
};

const normalizeStickerAttachment = (
  sticker: NonNullable<DiscordMessage['sticker_items']>[number],
): CommunityMessageAttachmentType | null => {
  if (!sticker?.id) {
    return null;
  }

  const format = STICKER_FORMAT_MAP[sticker.format_type ?? 1] ?? STICKER_FORMAT_MAP[1];
  const url = buildStickerCdnUrl(sticker.id, format.extension);

  if (format.renderType === 'lottie') {
    return {
      type: 'lottie',
      url,
      thumbnailUrl: null,
    } as CommunityMessageAttachmentType;
  }

  return {
    type: format.renderType as CommunityMessageAttachmentType['type'],
    url,
    thumbnailUrl: format.renderType === 'image' ? url : null,
  };
};

const getSystemUserLabel = (message: DiscordMessage): string => {
  return (
    message.author?.global_name ??
    message.author?.display_name ??
    message.author?.username ??
    'A new member'
  );
};

const SYSTEM_JOIN_TEMPLATES = [
  'A wild {user} appeared.',
  '{user} joined the party.',
  '{user} is here.',
  'Everyone welcome {user}!',
  "Glad you're here, {user}.",
];

const buildSystemMessageText = (message: DiscordMessage): string | null => {
  switch (message.type) {
    case 7: {
      const user = getSystemUserLabel(message);
      if (!message.id) {
        return SYSTEM_JOIN_TEMPLATES[0].replace('{user}', user);
      }
      const templateIndex = Number(BigInt(message.id) % BigInt(SYSTEM_JOIN_TEMPLATES.length));
      const template = SYSTEM_JOIN_TEMPLATES[templateIndex] ?? SYSTEM_JOIN_TEMPLATES[0];
      return template.replace('{user}', user);
    }
    default:
      return null;
  }
};

const extractComponentLabels = (components?: DiscordMessage['components']): string[] => {
  if (!components || !components.length) {
    return [];
  }

  const labels: string[] = [];
  for (const component of components) {
    if (component.label) {
      labels.push(component.label);
    }
    for (const nested of component.components ?? []) {
      if (nested.label) {
        labels.push(nested.label);
      }
    }
  }
  return labels;
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

  const mentionChannelLabels = new Map<string, string>();
  for (const channel of message.mention_channels ?? []) {
    if (channel.name) {
      mentionChannelLabels.set(channel.id, channel.name);
    }
  }

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

  if (richContent.length === 0) {
    const systemText = buildSystemMessageText(message);
    if (systemText) {
      richContent.push(createTextNode(systemText));
    }
  }

  const componentLabels = extractComponentLabels(message.components);
  if (componentLabels.length) {
    const text = componentLabels.join('\n');
    richContent.push(createTextNode(text));
  }

  return {
    attachments,
    richContent,
  };
};
