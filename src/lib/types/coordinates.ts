import type { ItemData } from './index.js';

export interface SortableListCoordinates {
	pointer: { x: number; y: number } | null;
	pointerOrigin: { x: number; y: number } | null;
	itemsData: ItemData[] | null;
}
