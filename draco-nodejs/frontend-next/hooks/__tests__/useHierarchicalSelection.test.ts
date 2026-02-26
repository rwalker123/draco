import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { applySelectionToMap, useHierarchicalSelection } from '../useHierarchicalSelection';
import type { HierarchicalSelectionItem } from '../../types/emails/recipients';
import type { HierarchyMaps } from '../useHierarchicalMaps';

const createHierarchyMaps = (): HierarchyMaps => ({
  childrenMap: new Map([
    ['root', new Set(['child1', 'child2'])],
    ['child1', new Set(['grandchild1'])],
  ]),
  parentMap: new Map([
    ['child1', 'root'],
    ['child2', 'root'],
    ['grandchild1', 'child1'],
  ]),
  itemTypeMap: new Map([
    ['root', 'season'],
    ['child1', 'league'],
    ['child2', 'league'],
    ['grandchild1', 'team'],
  ]),
  siblingsMap: new Map([
    ['child1', new Set(['child2'])],
    ['child2', new Set(['child1'])],
  ]),
  playerCountMap: new Map([
    ['root', 10],
    ['child1', 5],
    ['child2', 3],
    ['grandchild1', 2],
  ]),
  managerCountMap: new Map([
    ['root', 2],
    ['child1', 1],
    ['child2', 1],
    ['grandchild1', 0],
  ]),
});

describe('applySelectionToMap', () => {
  it('selects an item and its children recursively', () => {
    const stateMap = new Map<string, HierarchicalSelectionItem>();
    const hierarchyMaps = createHierarchyMaps();

    applySelectionToMap(stateMap, 'root', 'selected', hierarchyMaps);

    expect(stateMap.get('root')?.state).toBe('selected');
    expect(stateMap.get('child1')?.state).toBe('selected');
    expect(stateMap.get('child2')?.state).toBe('selected');
    expect(stateMap.get('grandchild1')?.state).toBe('selected');
  });

  it('unselects an item and its children', () => {
    const stateMap = new Map<string, HierarchicalSelectionItem>();
    const hierarchyMaps = createHierarchyMaps();

    applySelectionToMap(stateMap, 'root', 'selected', hierarchyMaps);
    applySelectionToMap(stateMap, 'root', 'unselected', hierarchyMaps);

    expect(stateMap.get('root')?.state).toBe('unselected');
    expect(stateMap.get('child1')?.state).toBe('unselected');
    expect(stateMap.get('child2')?.state).toBe('unselected');
    expect(stateMap.get('grandchild1')?.state).toBe('unselected');
  });

  it('sets parent to intermediate when only some children are selected', () => {
    const stateMap = new Map<string, HierarchicalSelectionItem>();
    const hierarchyMaps = createHierarchyMaps();

    stateMap.set('root', { state: 'unselected', playerCount: 10, managerCount: 2 });
    stateMap.set('child1', { state: 'unselected', playerCount: 5, managerCount: 1 });
    stateMap.set('child2', { state: 'unselected', playerCount: 3, managerCount: 1 });

    applySelectionToMap(stateMap, 'child1', 'selected', hierarchyMaps);

    expect(stateMap.get('child1')?.state).toBe('selected');
    expect(stateMap.get('root')?.state).toBe('intermediate');
  });

  it('sets parent to selected when all children are selected', () => {
    const stateMap = new Map<string, HierarchicalSelectionItem>();
    const hierarchyMaps = createHierarchyMaps();

    stateMap.set('root', { state: 'unselected', playerCount: 10, managerCount: 2 });
    stateMap.set('child1', { state: 'unselected', playerCount: 5, managerCount: 1 });
    stateMap.set('child2', { state: 'unselected', playerCount: 3, managerCount: 1 });

    applySelectionToMap(stateMap, 'child1', 'selected', hierarchyMaps);
    applySelectionToMap(stateMap, 'child2', 'selected', hierarchyMaps);

    expect(stateMap.get('root')?.state).toBe('selected');
  });

  it('propagates player/manager counts up to parent', () => {
    const stateMap = new Map<string, HierarchicalSelectionItem>();
    const hierarchyMaps = createHierarchyMaps();

    stateMap.set('root', { state: 'unselected', playerCount: 0, managerCount: 0 });
    stateMap.set('child1', { state: 'unselected', playerCount: 0, managerCount: 0 });
    stateMap.set('child2', { state: 'unselected', playerCount: 0, managerCount: 0 });

    applySelectionToMap(stateMap, 'child1', 'selected', hierarchyMaps);

    const rootState = stateMap.get('root');
    expect(rootState?.playerCount).toBe(5);
    expect(rootState?.managerCount).toBe(1);
  });
});

describe('useHierarchicalSelection', () => {
  it('toggles selection and calls onSelectionChange', () => {
    const stateMap = new Map<string, HierarchicalSelectionItem>([
      ['item1', { state: 'unselected', playerCount: 3, managerCount: 1 }],
    ]);
    const hierarchyMaps = createHierarchyMaps();
    const onSelectionChange = vi.fn();

    const { result } = renderHook(() =>
      useHierarchicalSelection(stateMap, hierarchyMaps, false, onSelectionChange),
    );

    act(() => {
      result.current.handleSelectionChange('item1');
    });

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const [newMap, managersOnly] = onSelectionChange.mock.calls[0];
    expect(newMap.get('item1')?.state).toBe('selected');
    expect(managersOnly).toBe(false);
  });

  it('forces a specific state', () => {
    const stateMap = new Map<string, HierarchicalSelectionItem>([
      ['item1', { state: 'selected', playerCount: 3, managerCount: 1 }],
    ]);
    const hierarchyMaps = createHierarchyMaps();
    const onSelectionChange = vi.fn();

    const { result } = renderHook(() =>
      useHierarchicalSelection(stateMap, hierarchyMaps, false, onSelectionChange),
    );

    act(() => {
      result.current.handleSelectionChange('item1', 'unselected');
    });

    const [newMap] = onSelectionChange.mock.calls[0];
    expect(newMap.get('item1')?.state).toBe('unselected');
  });

  it('applies multiple selections at once', () => {
    const stateMap = new Map<string, HierarchicalSelectionItem>();
    const hierarchyMaps = createHierarchyMaps();
    const onSelectionChange = vi.fn();

    const { result } = renderHook(() =>
      useHierarchicalSelection(stateMap, hierarchyMaps, true, onSelectionChange),
    );

    act(() => {
      result.current.applyMultipleSelections(['child1', 'child2'], 'selected');
    });

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const [newMap, managersOnly] = onSelectionChange.mock.calls[0];
    expect(newMap.get('child1')?.state).toBe('selected');
    expect(newMap.get('child2')?.state).toBe('selected');
    expect(managersOnly).toBe(true);
  });
});
