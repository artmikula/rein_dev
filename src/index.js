import 'bootstrap-icons/font/bootstrap-icons.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { GlobalProvider } from 'security/GlobalContext';
import App from './App';
import store from './app/store';
import Language from './features/shared/languages/Language';
import cookiesHelper from './features/shared/lib/cookiesHelper';

const baseUrl = document.getElementsByTagName('base')[0].getAttribute('href');
const rootElement = document.getElementById('root');

const languageCode = cookiesHelper.getLanguageCode();

import(/* webpackPrefetch: true  */ `./features/shared/languages/${languageCode}.js`).then((module) => {
  Language.add('ko', module);
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
