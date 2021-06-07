const EPSILON = 0.0000001;

function PfromC(c: number): number {
  let ppon = 0.0;
  let ppbn = 0.0;
  let sum = 0.0;

  /**
     * Calculate max fails
     */
  const fails = Math.ceil(1.0 / c);

  /**
     * Simulate n successions
     */
  for (let n = 1; n <= fails; n += 1) {
    ppon = Math.min(1.0, n * c) * (1.0 - ppbn);
    ppbn += ppon;

    sum += (n * ppon);
  }

  return 1 / sum;
}

function CfromP(p: number): number {
  let hi = p;
  let lo = 0.0;
  let mid = 0.0;
  let p1 = 0.0; let
    p2 = 1.0;

  for (;;) {
    mid = (hi + lo) * 0.5;
    p1 = PfromC(mid);
    if (Math.abs(p1 - p2) <= EPSILON) break;

    if (p1 > p) {
      hi = mid;
    } else {
      lo = mid;
    }

    p2 = p1;
  }

  return mid;
}

export default class PRD {
  private C: number;

  private progress: number;

  constructor(chance: number) {
    this.C = CfromP(chance);
    this.progress = 1;
  }

  /**
     * Gets the next success from the PRD
     * @returns Boolean
     */
  next() {
    // Roll
    const r = Math.random();

    // Check for the random success
    if (r < this.progress * this.C) {
      // Reset progress
      this.progress = 1;
      return true;
    }

    // Increment progress
    this.progress += 1;
    return false;
  }

  reset() {
    this.progress = 1;
  }
}
