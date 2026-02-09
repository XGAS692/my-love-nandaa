
export enum HandGesture {
  IDLE = 'IDLE',
  ROCK_ON = 'ROCK_ON',
  PEACE = 'PEACE',
  THUMBS_UP = 'THUMBS_UP',
  FIST = 'FIST'
}

export interface HandData {
  landmarks: any[];
  palmCenter: { x: number; y: number; z: number };
}
