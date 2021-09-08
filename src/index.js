import 'bootstrap-icons/font/bootstrap-icons.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Log } from 'oidc-client';
import { GlobalProvider } from 'security/GlobalContext';
import App from './App';
import store from './app/store';
import Language from './features/shared/languages/Language';
import cookiesHelper from './features/shared/lib/cookiesHelper';

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
