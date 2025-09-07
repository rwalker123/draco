'use client';

import { useCallback } from 'react';
import { HierarchicalSelectionItem } from '../types/emails/recipients';
import { HierarchyMaps } from './useHierarchicalMaps';

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
    (itemId: string) => {
      const newStateMap = new Map(itemSelectedState);
      const currentState = newStateMap.get(itemId)?.state || 'unselected';
      const newState = currentState === 'selected' ? 'unselected' : 'selected';

      // Update the clicked item
      const playerCount = hierarchyMaps.playerCountMap.get(itemId) || 0;
      newStateMap.set(itemId, { state: newState, playerCount });

      // Recursive function to update children
      const updateChildren = (parentId: string, state: 'selected' | 'unselected') => {
        const children = hierarchyMaps.childrenMap.get(parentId);
        if (children) {
          children.forEach((childId) => {
            const childPlayerCount = hierarchyMaps.playerCountMap.get(childId) || 0;
            newStateMap.set(childId, { state, playerCount: childPlayerCount });
            updateChildren(childId, state);
          });
        }
      };

      // Update all children to match the new state
      updateChildren(itemId, newState);

      // Recursive function to update parent chain
      const updateParentChain = (itemId: string) => {
        const parentId = hierarchyMaps.parentMap.get(itemId);
        if (!parentId) return;

        const children = hierarchyMaps.childrenMap.get(parentId);
        if (!children) return;

        let selectedCount = 0;
        let totalPlayerCount = 0;

        children.forEach((childId) => {
          const childState = newStateMap.get(childId);
          if (childState) {
            if (childState.state === 'selected') {
              selectedCount++;
              totalPlayerCount += childState.playerCount;
            } else if (childState.state === 'intermediate') {
              totalPlayerCount += childState.playerCount;
            }
          }
        });

        if (selectedCount === children.size) {
          // All children selected -> parent selected
          newStateMap.set(parentId, { state: 'selected', playerCount: totalPlayerCount });
        } else if (selectedCount > 0 || totalPlayerCount > 0) {
          // Some children selected or intermediate -> parent intermediate
          newStateMap.set(parentId, { state: 'intermediate', playerCount: totalPlayerCount });
        } else {
          // No children selected -> parent unselected
          newStateMap.set(parentId, { state: 'unselected', playerCount: 0 });
        }

        // Recursively update parent's parent
        updateParentChain(parentId);
      };

      updateParentChain(itemId);

      onSelectionChange(newStateMap, managersOnly);
    },
    [itemSelectedState, hierarchyMaps, managersOnly, onSelectionChange],
  );

  return {
    handleSelectionChange,
  };
}
