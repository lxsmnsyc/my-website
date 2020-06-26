import { styled } from 'styletron-react';

const TextInnerContainer = styled('div', {
  width: '75%',
  height: '100%',

  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',

  marginLeft: '32px',
  marginRight: '32px',
  marginTop: '16px',
  marginBottom: '16px',

  '@media screen and (orientation: portrait)': {
    width: '100%',
  },
});

export default TextInnerContainer;
