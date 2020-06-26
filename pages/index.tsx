import React from 'react';

import DarkBlob from '../components/DarkBlob';
import SmoothCursor from '../models/SmoothCursor';
import Container from '../components/Container';
import TextOuterContainer from '../components/TextOuterContainer';
import TextInnerContainer from '../components/TextInnerContainer';
import Greetings from '../components/Greetings';
import Hobbies from '../components/Hobbies';

export default function Index() {
  return (
    <SmoothCursor.Provider>
      <Container>
        <DarkBlob />
        <TextOuterContainer>
          <TextInnerContainer>
            <Greetings />
            <Hobbies />
          </TextInnerContainer>
        </TextOuterContainer>
      </Container>
    </SmoothCursor.Provider>
  );
}
