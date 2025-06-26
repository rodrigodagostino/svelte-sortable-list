import type { ItemRect } from './index.js';

export interface SortableListCoordinates {
	pointer: { x: number; y: number } | null;
	pointerOrigin: { x: number; y: number } | null;
	itemsData: ItemRect[] | null;
}
