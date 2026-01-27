import React from 'react';
import { AboutModal } from '@ohif/ui-next';
import detect from 'browser-detect';
import { useTranslation } from 'react-i18next';

function AboutModalDefault() {
  const { t } = useTranslation('AboutModal');
  const { os, version, name } = detect();
  const browser = `${name[0].toUpperCase()}${name.substr(1)} ${version}`;

  // M3DZ custom version
  const m3dzVersion = '0.0.1';

  return (
    <AboutModal className="w-[400px]">
      <AboutModal.ProductName>M3DZ</AboutModal.ProductName>
      <AboutModal.ProductVersion>{m3dzVersion}</AboutModal.ProductVersion>

      <AboutModal.Body>
        <AboutModal.DetailItem
          label={t('Current Browser & OS')}
          value={`${browser}, ${os}`}
        />
        <div className="pt-4 text-sm text-muted-foreground">
          Made with love from 🇻🇪
        </div>
      </AboutModal.Body>
    </AboutModal>
  );
}

// Custom title for the modal
AboutModalDefault.title = 'Acerca de M3DZ';

export default {
  'ohif.aboutModal': AboutModalDefault,
};
