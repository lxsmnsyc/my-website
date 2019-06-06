import React from 'react';

import { BrowserRouter, Route } from 'react-router-dom';

import Index from './pages/Index';
import Menu from './pages/Menu';
import About from './pages/About';
import Works from './pages/Works';
import Contacts from './pages/Contacts';

import Nav from './components/Nav';
import Cursor from './components/Cursor';

export default () => (
  <BrowserRouter>
    <Nav />
    <Route exact path="/" component={Index} />
    <Route path="/about" component={About} />
    <Route path="/works" component={Works} />
    <Route path="/menu" component={Menu} />
    <Route path="/contacts" component={Contacts} />
    <Cursor />
  </BrowserRouter>
);
