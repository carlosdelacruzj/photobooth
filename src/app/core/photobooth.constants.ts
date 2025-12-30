export const PHOTO_COUNT = 4;
export const COLLAGE_WIDTH = 1080;
export const COLLAGE_HEIGHT = 1920;
export const COLLAGE_TEXT_AREA_HEIGHT = 220;
export const COLLAGE_MARGIN = 48;
export const COLLAGE_GAP = 24;

export interface Slot {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const getFixedSlots = (): Slot[] => {
  const innerWidth = COLLAGE_WIDTH - COLLAGE_MARGIN * 2;
  const innerHeight =
    COLLAGE_HEIGHT - COLLAGE_MARGIN * 2 - COLLAGE_TEXT_AREA_HEIGHT;
  const slotWidth = (innerWidth - COLLAGE_GAP) / 2;
  const slotHeight = (innerHeight - COLLAGE_GAP) / 2;

  const left = COLLAGE_MARGIN;
  const top = COLLAGE_MARGIN;
  const right = left + slotWidth + COLLAGE_GAP;
  const bottom = top + slotHeight + COLLAGE_GAP;

  return [
    { x: left, y: top, width: slotWidth, height: slotHeight },
    { x: right, y: top, width: slotWidth, height: slotHeight },
    { x: left, y: bottom, width: slotWidth, height: slotHeight },
    { x: right, y: bottom, width: slotWidth, height: slotHeight },
  ];
};
