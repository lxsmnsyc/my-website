import { styled } from 'styletron-react';

const TextInnerContainer = styled('div', {
  width: '50%',
  height: '100%',

  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',

  marginLeft: '16px',
  marginRight: '16px',
  marginTop: '16px',
  marginBottom: '16px',

  '@media screen and (orientation: portrait)': {
    width: '100%',
  },
});

export default TextInnerContainer;
