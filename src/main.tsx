import { render } from 'solid-js/web';
import App from './App';

import './tailwind.css';

const root = document.getElementById('root');

if (root) {
  render(
    () => <App />,
    root,
  );
}
