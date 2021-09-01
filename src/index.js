import 'bootstrap-icons/font/bootstrap-icons.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Log } from 'oidc-client';
import App from './App';
import store from './app/store';
import * as serviceWorker from './serviceWorker';
import Language from './features/shared/languages/Language';
import cookiesHelper from './features/shared/lib/cookiesHelper';

import authService from './features/shared/authorization/AuthorizeService';

const baseUrl = document.getElementsByTagName('base')[0].getAttribute('href');
const rootElement = document.getElementById('root');

const cookieValue = cookiesHelper.getCulture();

Log.logger = console;

if (cookieValue) {
  if (cookieValue.indexOf('en-') > -1) {
    import(/* webpackPrefetch: true  */ './features/shared/languages/en.js').then((module) => {
      Language.add('en', module);
    });
  }

  if (cookieValue.indexOf('ko-') > -1) {
    import(/* webpackPrefetch: true  */ './features/shared/languages/ko.js').then((module) => {
      Language.add('ko', module);
    });
  }

  if (cookieValue.indexOf('vi-') > -1) {
    import(/* webpackPrefetch: true  */ './features/shared/languages/vi.js').then((module) => {
      Language.add('vi', module);
    });
  }

  if (cookieValue.indexOf('th-') > -1) {
    import(/* webpackPrefetch: true  */ './features/shared/languages/th.js').then((module) => {
      Language.add('th', module);
    });
  }
}

authService.signinSilentCallback();

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter basename={baseUrl}>
      <App />
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
