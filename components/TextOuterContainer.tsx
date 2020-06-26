import { styled } from 'styletron-react';

const TextOuterContainer = styled('div', {
  gridRow: '1 / 2',
  gridColumn: '1 / 2',
  width: '100%',
  height: '100%',

  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
});

export default TextOuterContainer;
