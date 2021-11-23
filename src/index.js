import 'bootstrap-icons/font/bootstrap-icons.css';
import languageService from 'features/shared/services/languageService';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { GlobalProvider } from 'security/GlobalContext';
import App from './App';
import store from './app/store';
import Language from './features/shared/languages/Language';

const baseUrl = document.getElementsByTagName('base')[0].getAttribute('href');
const rootElement = document.getElementById('root');

const language = languageService.get();

const { NODE_ENV } = process.env;
window.isDebugMode = NODE_ENV === 'development';

import(/* webpackPrefetch: true  */ `./features/shared/languages/${language.code}.js`).then((module) => {
  Language.add(language.code, module);
});

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter basename={baseUrl}>
      <GlobalProvider>
        <App />
      </GlobalProvider>
    </BrowserRouter>
  </Provider>,
  rootElement
);

/*
serviceWorker.register({
  onUpdate: () => {
    console.log('update');
  },
});
*/
