import appConfig from 'features/shared/lib/appConfig';
import languageService from 'features/shared/services/languageService';
import React from 'react';
import { DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { LANGUAGE } from '../../constants';

export default function MultiLanguageDropdown() {
  const language = languageService.get();

  const handleChangeLanguage = async (code, name) => {
    if (language.code !== code) {
      const language = { code, name };
      languageService.set(language);

      Object.assign(appConfig, { language });
      window.location.reload();
    }
  };

  return (
    <UncontrolledDropdown setActiveFromChild className="mr-2">
      <DropdownToggle className="border-0 shadow-none align-items-center" color="primary">
        <i className="bi bi-globe h4 mb-0" />
      </DropdownToggle>
      <DropdownMenu right className="border-0 shadow">
        {Object.keys(LANGUAGE).map((key) => (
          <DropdownItem
            key={key}
            className="small"
            active={key === language.code}
            onClick={() => handleChangeLanguage(key, LANGUAGE[key])}
          >
            {LANGUAGE[key]}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </UncontrolledDropdown>
  );
}
