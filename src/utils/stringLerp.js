const lerp = (a, b, t) => a + (b - a) * (t * t * (3 - 2 * t));
const charLerp = (a, b, t) => String.fromCharCode(lerp(a.charCodeAt(0), b.charCodeAt(0), t));

export default (str1, str2, t, mode) => {
  let a = str1;
  let b = str2;

  if (t >= 1) {
    return str2;
  }
  if (t <= 0) {
    return str1;
  }
  // two modes
  // 1. char-by-char interpolation
  // 2. full string interpolation

  // get string lengths
  const len1 = a.length;
  const len2 = b.length;

  // pick the longer string length
  const longer = Math.max(len1, len2);

  // add whitespace padding
  if (len1 < len2) {
    for (let i = len2 - len1; i > 0; i -= 1) {
      a += ' ';
    }
  } else if (len2 < len1) {
    for (let i = len1 - len2; i > 0; i -= 1) {
      b += ' ';
    }
  }
  let result = '';
  if (mode === 1) {
    // get the actual value of each index
    const indexValue = 1 / longer;

    // get the character position (nearest)
    const pos = Math.max(1, Math.floor(longer * t) + 1);

    // pick all characters that aren't needed for interpolation
    for (let i = 0; i < pos - 1; i += 1) {
      result += b.charAt(i);
    }

    // interpolate character
    const char1 = a.charAt(pos - 1);
    const char2 = b.charAt(pos - 1);
    const grad = (t - pos * indexValue) / indexValue;
    const interpolated = charLerp(char1, char2, grad);

    result += interpolated;
    // get the strings after the pos
    for (let i = pos; i < longer; i += 1) {
      result += a.charAt(i);
    }
  }
  if (mode === 2) {
    for (let i = 0; i < longer; i += 1) {
      const char1 = a.charAt(i);
      const char2 = b.charAt(i);
      result += charLerp(char1, char2, t);
    }
  }
  return result;
};
