import { describe, expect, it } from 'vitest';
import { normalizeDiscordMessage } from '../discordMessageTransformer.js';
import type { DiscordMessage } from '../../connectors/discordConnector.js';

const baseMessage: DiscordMessage = {
  id: '123',
  content: '',
  timestamp: new Date().toISOString(),
  author: {
    id: '42',
    username: 'author',
  },
};

describe('normalizeDiscordMessage', () => {
  it('produces rich content nodes for custom emoji and mentions', () => {
    const message: DiscordMessage = {
      ...baseMessage,
      content: 'Hello <:wave:7890> <@555>!',
      mentions: [
        {
          id: '555',
          username: 'coach',
          display_name: 'Coach Carter',
        },
      ],
    };

    const result = normalizeDiscordMessage(message);

    expect(result.richContent).toEqual([
      { type: 'text', text: 'Hello ' },
      {
        type: 'emoji',
        id: '7890',
        name: 'wave',
        url: 'https://cdn.discordapp.com/emojis/7890.png?size=64&quality=lossless',
      },
      { type: 'text', text: ' ' },
      {
        type: 'mention',
        id: '555',
        mentionType: 'user',
        label: 'Coach Carter',
        raw: '<@555>',
      },
      { type: 'text', text: '!' },
    ]);
  });

  it('collects gif attachments, gif embeds, and sticker assets', () => {
    const message: DiscordMessage = {
      ...baseMessage,
      attachments: [
        {
          id: '1',
          filename: 'celebrate.gif',
          url: 'https://cdn.discordapp.com/attachments/celebrate.gif',
          content_type: 'image/gif',
        },
      ],
      embeds: [
        {
          type: 'gifv',
          url: 'https://giphy.com/embed/party',
          video: {
            url: 'https://media.giphy.com/media/party/giphy.mp4',
            proxy_url: 'https://media.giphy.com/media/party/giphy.gif',
          },
          thumbnail: {
            url: 'https://media.giphy.com/media/party/giphy.gif',
          },
        },
      ],
      sticker_items: [
        {
          id: '9988',
          name: 'sticker-fun',
          format_type: 4,
        },
      ],
    };

    const result = normalizeDiscordMessage(message);

    expect(result.attachments).toEqual([
      {
        type: 'image',
        url: 'https://cdn.discordapp.com/attachments/celebrate.gif',
        thumbnailUrl: 'https://cdn.discordapp.com/attachments/celebrate.gif',
      },
      {
        type: 'image',
        url: 'https://media.giphy.com/media/party/giphy.mp4',
        thumbnailUrl: 'https://media.giphy.com/media/party/giphy.gif',
      },
      {
        type: 'image',
        url: 'https://cdn.discordapp.com/stickers/9988.gif?size=160',
        thumbnailUrl: 'https://cdn.discordapp.com/stickers/9988.gif?size=160',
      },
    ]);
  });
});
