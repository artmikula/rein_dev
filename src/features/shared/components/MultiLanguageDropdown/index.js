import React from 'react';
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import axios from 'axios';
import { LANGUAGE, CULTURE } from '../../constants';
import CookiesHelper from '../../lib/cookiesHelper';

export default function MultiLanguageDropdown() {
  const langCode = CookiesHelper.getLanguageCode();

  const handleChangeLanguage = (code) => {
    const fd = new FormData();
    fd.append('culture', CULTURE[code]);
    fd.append('returnUrl', '/');

    axios
      .post('/Home/SetLanguage', fd)
      .then(() => window.location.reload())
      .catch((err) => console.log(err));
  };

  return (
    <UncontrolledDropdown setActiveFromChild className="mr-2">
      <DropdownToggle className="border-0 shadow-none align-items-center" color="primary">
        <i className="bi bi-globe h4 mb-0" />
      </DropdownToggle>
      <DropdownMenu right className="border-0 shadow">
        {Object.keys(LANGUAGE).map((key) => (
          <DropdownItem key={key} className="small" active={key === langCode} onClick={() => handleChangeLanguage(key)}>
            {LANGUAGE[key]}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </UncontrolledDropdown>
  );
}
