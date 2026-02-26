'use client';

import { useState } from 'react';
import { RecipientContact } from '../../../../types/emails/recipients';

export interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number;
  threshold: number;
}

export interface VirtualizedItem {
  index: number;
  contact: RecipientContact;
  isVisible: boolean;
  top: number;
  height: number;
}

export interface UseContactVirtualizationOptions {
  config?: Partial<VirtualizationConfig>;
  enabled?: boolean;
}

export interface UseContactVirtualizationReturn {
  virtualizedItems: VirtualizedItem[];
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  scrollProps: {
    onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
    style: React.CSSProperties;
  };
  containerProps: {
    style: React.CSSProperties;
  };
  isVirtualized: boolean;
}

const DEFAULT_CONFIG: VirtualizationConfig = {
  itemHeight: 72,
  containerHeight: 400,
  overscan: 5,
  threshold: 50,
};

function computeVisibleRange(
  isVirtualized: boolean,
  contactsLength: number,
  scrollTop: number,
  config: VirtualizationConfig,
): { start: number; end: number } {
  if (!isVirtualized) {
    return { start: 0, end: contactsLength };
  }

  const visibleStart = Math.floor(scrollTop / config.itemHeight);
  const visibleEnd = Math.min(
    contactsLength,
    Math.ceil((scrollTop + config.containerHeight) / config.itemHeight),
  );

  return {
    start: Math.max(0, visibleStart - config.overscan),
    end: Math.min(contactsLength, visibleEnd + config.overscan),
  };
}

function computeVirtualizedItems(
  contacts: RecipientContact[],
  isVirtualized: boolean,
  visibleRange: { start: number; end: number },
  itemHeight: number,
): VirtualizedItem[] {
  if (!isVirtualized) {
    return contacts.map((contact, index) => ({
      index,
      contact,
      isVisible: true,
      top: index * itemHeight,
      height: itemHeight,
    }));
  }

  const items: VirtualizedItem[] = [];
  for (let i = visibleRange.start; i < visibleRange.end; i++) {
    const contact = contacts[i];
    if (contact) {
      items.push({
        index: i,
        contact,
        isVisible: true,
        top: i * itemHeight,
        height: itemHeight,
      });
    }
  }
  return items;
}

function computeContactGroups(contacts: RecipientContact[]): ContactGroup[] {
  const groups = new Map<string, RecipientContact[]>();

  contacts.forEach((contact) => {
    const firstLetter = contact.displayName.charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(firstLetter) ? firstLetter : '#';

    if (!groups.has(letter)) {
      groups.set(letter, []);
    }
    groups.get(letter)!.push(contact);
  });

  let currentIndex = 0;
  const sortedGroups: ContactGroup[] = [];

  const sortedLetters = Array.from(groups.keys()).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

  sortedLetters.forEach((letter) => {
    const groupContacts = groups.get(letter)!;
    sortedGroups.push({
      letter,
      contacts: groupContacts,
      startIndex: currentIndex,
      endIndex: currentIndex + groupContacts.length - 1,
    });
    currentIndex += groupContacts.length;
  });

  return sortedGroups;
}

export const useContactVirtualization = (
  contacts: RecipientContact[],
  options: UseContactVirtualizationOptions = {},
): UseContactVirtualizationReturn => {
  const { config: configOverrides = {}, enabled = true } = options;

  const config = { ...DEFAULT_CONFIG, ...configOverrides };

  const [scrollTop, setScrollTop] = useState(0);

  const isVirtualized = enabled && contacts.length >= config.threshold;

  const visibleRange = computeVisibleRange(isVirtualized, contacts.length, scrollTop, config);

  const virtualizedItems = computeVirtualizedItems(
    contacts,
    isVirtualized,
    visibleRange,
    config.itemHeight,
  );

  const totalHeight = isVirtualized
    ? contacts.length * config.itemHeight
    : Math.min(contacts.length * config.itemHeight, config.containerHeight);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    setScrollTop(target.scrollTop);
  };

  const scrollToIndex = (index: number) => {
    const scrollPosition = index * config.itemHeight;
    setScrollTop(scrollPosition);
  };

  const containerStyle: React.CSSProperties = {
    height: isVirtualized ? config.containerHeight : 'auto',
    maxHeight: config.containerHeight,
    overflow: 'auto',
    position: 'relative',
  };

  const innerStyle: React.CSSProperties = {
    height: totalHeight,
    position: 'relative',
  };

  return {
    virtualizedItems,
    totalHeight,
    scrollToIndex,
    scrollProps: {
      onScroll: handleScroll,
      style: innerStyle,
    },
    containerProps: {
      style: containerStyle,
    },
    isVirtualized,
  };
};

export interface ContactGroup {
  letter: string;
  contacts: RecipientContact[];
  startIndex: number;
  endIndex: number;
}

export const useContactGrouping = (contacts: RecipientContact[]): ContactGroup[] => {
  return computeContactGroups(contacts);
};
