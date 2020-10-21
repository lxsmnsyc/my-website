
import { styletron } from './styletron';

export const gradientAnimation = styletron.renderKeyframes({
  '0%': {
    backgroundPosition: '0% 50%',
  },
  '50%': {
    backgroundPosition: '100% 50%',
  },
  '100%': {
    backgroundPosition: '0% 50%',
  },
});

const GRADIENTS = [
  'linear-gradient(60deg, #f72585ff, #7209b7ff, #3a0ca3ff, #4361eeff, #4cc9f0ff)',
  'linear-gradient(60deg, #390099ff, #9e0059ff, #ff0054ff, #ff5400ff, #ffbd00ff)',
  'linear-gradient(60deg, #2d00f7ff, #6a00f4ff, #8900f2ff, #a100f2ff, #b100e8ff, #bc00ddff, #d100d1ff, #db00b6ff, #e500a4ff, #f20089ff)',
  'linear-gradient(60deg, #70d6ffff, #ff70a6ff, #ff9770ff, #ffd670ff, #e9ff70ff)',
  'linear-gradient(60deg, #cdb4dbff, #ffc8ddff, #ffafccff, #bde0feff, #a2d2ffff)',
  'linear-gradient(60deg, #2d00f7ff, #6a00f4ff, #8900f2ff, #a100f2ff, #b100e8ff, #bc00ddff, #d100d1ff, #db00b6ff, #e500a4ff, #f20089ff)',
  'linear-gradient(60deg, #ffbe0bff, #fb5607ff, #ff006eff, #8338ecff, #3a86ffff)',
];

export const gradientStyle = {
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundColor: '#fff',
  backgroundImage: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
  color: 'white',
  backgroundSize: '200%',
  animationName: gradientAnimation,
  animationDuration: '8s',
  animationTimingFunction: 'linear',
  animationDirection: 'forwards',
  animationIterationCount: 'infinite',
};
