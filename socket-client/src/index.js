import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
//import App from './App';
import ForeverBoard from './ForeverBoard';
import * as serviceWorker from './serviceWorker';

//ReactDOM.render(<App />, document.getElementById('root'));
ReactDOM.render(<ForeverBoard />, document.getElementById('root'));
serviceWorker.unregister();
