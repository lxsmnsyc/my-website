/**
 * @license
 * MIT License
 *
 * Copyright (c) 2020 Alexis Munsayac
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 *
 * @author Alexis Munsayac <alexis.munsayac@gmail.com>
 * @copyright Alexis Munsayac 2020
 */
import React from 'react';

import { Icon } from '@zeit-ui/react-icons';
import Codepen from '@zeit-ui/react-icons/codepen';
import Github from '@zeit-ui/react-icons/github';
import Linkedin from '@zeit-ui/react-icons/linkedin';
import Twitter from '@zeit-ui/react-icons/twitter';
import Globe from '@zeit-ui/react-icons/globe';
import Mail from '@zeit-ui/react-icons/mail';

import { styled } from 'styletron-react';
import { memo } from 'react';

const ICON_SIZE = 24;

interface SocialItem {
  key: string;
  link: string;
  Icon: Icon;
}

export const SOCIAL: SocialItem[] = [
  { key: 'codepen', Icon: Codepen, link: 'https://codepen.io/lxsmnsyc' },
  { key: 'github', Icon: Github, link: 'https://github.com/lxsmnsyc' },
  { key: 'linkedin', Icon: Linkedin, link: 'https://www.linkedin.com/in/alexis-munsayac-467a27124/' },
  { key: 'twitter', Icon: Twitter, link: 'https://twitter.com/lxsmnsyc' },
  { key: 'globe', Icon: Globe, link: 'https://lyon.com.ph' },
  { key: 'mail', Icon: Mail, link: 'mailto:alexis@lyon.com.ph' },
];

const SocialMediaList = styled('ul', {
  paddingLeft: '0px',
  display: 'flex',
  flexDirection: 'row',
  listStyle: 'none',
});

const SocialMediaListItem = styled('li', {
  marginLeft: '0px',
  marginRight: '32px',
  marginTop: '16px',
  marginBottom: '16px',
});

const Anchor = styled('a', {
  textDecoration: 'none',
  color: 'inherit',
});

const Social = memo(() => (
  <SocialMediaList>
    {
      SOCIAL.map((item) => (
        <SocialMediaListItem key={item.key}>
          <Anchor href={item.link} title={item.key}>
            <item.Icon size={ICON_SIZE} />
          </Anchor>
        </SocialMediaListItem>
      ))
    }
  </SocialMediaList>
));

export default Social;
