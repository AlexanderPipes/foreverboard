import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import ForeverBoard from './ForeverBoard';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<ForeverBoard />, document.getElementById('root'));
serviceWorker.unregister();
