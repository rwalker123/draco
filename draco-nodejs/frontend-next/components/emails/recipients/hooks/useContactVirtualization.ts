'use client';

import { useMemo, useState, useCallback } from 'react';
import { RecipientContact } from '../../../../types/emails/recipients';

export interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number; // Number of items to render outside visible area
  threshold: number; // Minimum items to enable virtualization
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
  itemHeight: 72, // Height per contact item in pixels
  containerHeight: 400, // Max container height
  overscan: 5, // Render 5 extra items above/below visible area
  threshold: 50, // Enable virtualization for 50+ items
};

export const useContactVirtualization = (
  contacts: RecipientContact[],
  options: UseContactVirtualizationOptions = {},
): UseContactVirtualizationReturn => {
  const { config: configOverrides = {}, enabled = true } = options;

  const config = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...configOverrides,
    }),
    [configOverrides],
  );

  const [scrollTop, setScrollTop] = useState(0);

  // Determine if virtualization should be enabled
  const isVirtualized = useMemo(
    () => enabled && contacts.length >= config.threshold,
    [enabled, contacts.length, config.threshold],
  );

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (!isVirtualized) {
      return { start: 0, end: contacts.length };
    }

    const visibleStart = Math.floor(scrollTop / config.itemHeight);
    const visibleEnd = Math.min(
      contacts.length,
      Math.ceil((scrollTop + config.containerHeight) / config.itemHeight),
    );

    // Add overscan
    const start = Math.max(0, visibleStart - config.overscan);
    const end = Math.min(contacts.length, visibleEnd + config.overscan);

    return { start, end };
  }, [scrollTop, config, contacts.length, isVirtualized]);

  // Create virtualized items
  const virtualizedItems = useMemo<VirtualizedItem[]>(() => {
    if (!isVirtualized) {
      // Return all items when virtualization is disabled
      return contacts.map((contact, index) => ({
        index,
        contact,
        isVisible: true,
        top: index * config.itemHeight,
        height: config.itemHeight,
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
          top: i * config.itemHeight,
          height: config.itemHeight,
        });
      }
    }

    return items;
  }, [contacts, visibleRange, config.itemHeight, isVirtualized]);

  // Calculate total height
  const totalHeight = useMemo(
    () =>
      isVirtualized
        ? contacts.length * config.itemHeight
        : Math.min(contacts.length * config.itemHeight, config.containerHeight),
    [contacts.length, config.itemHeight, config.containerHeight, isVirtualized],
  );

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    setScrollTop(target.scrollTop);
  }, []);

  // Scroll to specific index
  const scrollToIndex = useCallback(
    (index: number) => {
      const scrollTop = index * config.itemHeight;
      // In a real implementation, you'd need a ref to the scroll container
      // For now, we just update the state which will trigger re-render
      setScrollTop(scrollTop);
    },
    [config.itemHeight],
  );

  // Container styles
  const containerStyle = useMemo(
    (): React.CSSProperties => ({
      height: isVirtualized ? config.containerHeight : 'auto',
      maxHeight: config.containerHeight,
      overflow: 'auto',
      position: 'relative',
    }),
    [isVirtualized, config.containerHeight],
  );

  // Inner container styles for virtualization
  const innerStyle = useMemo(
    (): React.CSSProperties => ({
      height: totalHeight,
      position: 'relative',
    }),
    [totalHeight],
  );

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

// Helper hook for managing contact grouping (alphabetical)
export interface ContactGroup {
  letter: string;
  contacts: RecipientContact[];
  startIndex: number;
  endIndex: number;
}

export const useContactGrouping = (contacts: RecipientContact[]): ContactGroup[] => {
  return useMemo(() => {
    const groups = new Map<string, RecipientContact[]>();

    // Group contacts by first letter of display name
    contacts.forEach((contact) => {
      const firstLetter = contact.displayName.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstLetter) ? firstLetter : '#';

      if (!groups.has(letter)) {
        groups.set(letter, []);
      }
      groups.get(letter)!.push(contact);
    });

    // Convert to array and calculate indices
    let currentIndex = 0;
    const sortedGroups: ContactGroup[] = [];

    // Sort letters alphabetically, with '#' at the end
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
  }, [contacts]);
};
