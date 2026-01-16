
import { AspectRatio } from './types';

export const ASPECT_RATIOS: AspectRatio[] = [
  { label: 'Free', value: 0, category: 'Standard' },
  { label: '1:1', value: 1, category: 'Standard' },
  { label: '4:5', value: 4/5, category: 'Standard' },
  { label: '16:9', value: 16/9, category: 'Standard' },
  { label: '9:16', value: 9/16, category: 'Standard' },
  { label: '3:2', value: 3/2, category: 'Standard' },
  { label: '4:3', value: 4/3, category: 'Standard' },
  { label: '21:9', value: 21/9, category: 'Cinema' },
  { label: '2.39:1', value: 2.39, category: 'Cinema' },
  { label: '1.85:1', value: 1.85, category: 'Cinema' },
  { label: 'A-Series', value: 1 / Math.sqrt(2), category: 'Print' },
  { label: '8:10', value: 8/10, category: 'Print' },
  { label: 'Golden', value: 1.618, category: 'Advanced' },
  { label: 'Panorama', value: 3/1, category: 'Advanced' },
];

export const CATEGORIES = ['Standard', 'Cinema', 'Print', 'Advanced'] as const;
