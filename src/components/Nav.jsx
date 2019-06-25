/* eslint-disable react/prop-types */
import React, { useRef, useEffect } from 'react';

import { Link } from 'react-router-dom';

import NavItem from './NavItem';
import { addTarget, removeTarget } from './Cursor';

import '../css/Nav.css';

const Logo = ({ title }) => {
  const ref = useRef(null);
  useEffect(() => {
    const item = ref.current;

    addTarget(item);

    return () => {
      removeTarget(item);
    };
  });
  return (
    <Link innerRef={ref} className="Logo" to="/">
      {title.split('').map((x, i) => (<span key={`char${i}`} className={`char${i}`}>{x}</span>))}
    </Link>
  );
};

export default () => (
  <nav>
    <Logo title="LXSMNSYC" />
    <NavItem target="contacts" start="contacts" end="CONTACTS" />
    <NavItem target="about" start="about" end="ABOUT" />
    <NavItem target="works" start="works" end="WORKS" />
    <NavItem target="menu" start="menu" end="MENU" />
  </nav>
);
