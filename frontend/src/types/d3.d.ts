declare module 'd3' {
  const line: any;
  const curveCatmullRomClosed: any;
  const schemeTableau10: readonly string[];
  const select: (selector: string | Element | null) => any;
}

export type Point = [number, number, number];
export type Point2D = [number, number];