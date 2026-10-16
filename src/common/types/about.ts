// A production npm package shipped with the app.
export interface PackageLicense {
  // name@version, asks main for the license text
  id: string;
  name: string;
  version: string;
  // SPDX expression from package.json, "UNKNOWN" when missing
  license: string;
  author?: string;
  // Repository or homepage, http(s) only
  url?: string;
  // GPL family, MPL, EPL, CC BY-SA... listed first
  copyleft: boolean;
}

// A license or notice shipped in resources/licenses.
export interface LicenseDocument {
  id: string;
  title: string;
}

export interface AboutInfo {
  versions: { electron: string; chrome: string; node: string };
  packages: PackageLicense[];
  documents: LicenseDocument[];
}

export interface LicenseText {
  id: string;
  title: string;
  text: string;
  // THIRD_PARTY_NOTICES.md, shown rendered
  markdown?: boolean;
}
