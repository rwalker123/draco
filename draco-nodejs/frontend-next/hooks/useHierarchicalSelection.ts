'use client';

import { useCallback } from 'react';
import { HierarchicalSelectionItem } from '../types/emails/recipients';
import { HierarchyMaps } from './useHierarchicalMaps';

export function applySelectionToMap(
  stateMap: Map<string, HierarchicalSelectionItem>,
  itemId: string,
  newState: 'selected' | 'unselected',
  hierarchyMaps: HierarchyMaps,
): void {
  const playerCount = hierarchyMaps.playerCountMap.get(itemId) || 0;
  const managerCount = hierarchyMaps.managerCountMap.get(itemId) || 0;
  stateMap.set(itemId, { state: newState, playerCount, managerCount });

  const updateChildren = (parentId: string, state: 'selected' | 'unselected') => {
    const children = hierarchyMaps.childrenMap.get(parentId);
    if (children) {
      children.forEach((childId) => {
        const childPlayerCount = hierarchyMaps.playerCountMap.get(childId) || 0;
        const childManagerCount = hierarchyMaps.managerCountMap.get(childId) || 0;
        stateMap.set(childId, {
          state,
          playerCount: childPlayerCount,
          managerCount: childManagerCount,
        });
        updateChildren(childId, state);
      });
    }
  };

  updateChildren(itemId, newState);

  const updateParentChain = (id: string) => {
    const parentId = hierarchyMaps.parentMap.get(id);
    if (!parentId) return;

    const children = hierarchyMaps.childrenMap.get(parentId);
    if (!children) return;

    let selectedCount = 0;
    let totalPlayerCount = 0;
    let totalManagerCount = 0;

    children.forEach((childId) => {
      const childState = stateMap.get(childId);
      if (childState) {
        if (childState.state === 'selected') {
          selectedCount++;
          totalPlayerCount += childState.playerCount;
          totalManagerCount += childState.managerCount;
        } else if (childState.state === 'intermediate') {
          totalPlayerCount += childState.playerCount;
          totalManagerCount += childState.managerCount;
        }
      }
    });

    if (selectedCount === children.size) {
      stateMap.set(parentId, {
        state: 'selected',
        playerCount: totalPlayerCount,
        managerCount: totalManagerCount,
      });
    } else if (selectedCount > 0 || totalPlayerCount > 0) {
      stateMap.set(parentId, {
        state: 'intermediate',
        playerCount: totalPlayerCount,
        managerCount: totalManagerCount,
      });
    } else {
      stateMap.set(parentId, { state: 'unselected', playerCount: 0, managerCount: 0 });
    }

    updateParentChain(parentId);
  };

  updateParentChain(itemId);
}

export function useHierarchicalSelection(
  itemSelectedState: Map<string, HierarchicalSelectionItem>,
  hierarchyMaps: HierarchyMaps,
  managersOnly: boolean,
  onSelectionChange: (
    itemSelectedState: Map<string, HierarchicalSelectionItem>,
    managersOnly: boolean,
  ) => void,
) {
  const handleSelectionChange = useCallback(
    (itemId: string, forceState?: 'selected' | 'unselected') => {
      const newStateMap = new Map(itemSelectedState);
      const currentState = newStateMap.get(itemId)?.state || 'unselected';
      const newState = forceState ?? (currentState === 'selected' ? 'unselected' : 'selected');

      applySelectionToMap(newStateMap, itemId, newState, hierarchyMaps);
      onSelectionChange(newStateMap, managersOnly);
    },
    [itemSelectedState, hierarchyMaps, managersOnly, onSelectionChange],
  );

  const applyMultipleSelections = useCallback(
    (itemIds: string[], state: 'selected' | 'unselected') => {
      const newStateMap = new Map(itemSelectedState);

      itemIds.forEach((itemId) => {
        applySelectionToMap(newStateMap, itemId, state, hierarchyMaps);
      });

      onSelectionChange(newStateMap, managersOnly);
    },
    [itemSelectedState, hierarchyMaps, managersOnly, onSelectionChange],
  );

  return {
    handleSelectionChange,
    applyMultipleSelections,
  };
}
