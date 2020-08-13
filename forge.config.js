const path = require('path');
const fs = require('fs-extra');
const package = require('./package.json');
const AdmZip = require('adm-zip');


// windows codesign
if (process.env['WINDOWS_CODESIGN_FILE']) {
	const certPath = path.join(__dirname, 'win-certificate.pfx');
	if (fs.existsSync(certPath)) {
		process.env['WINDOWS_CODESIGN_FILE'] = certPath;
	}
}


module.exports = {
	packagerConfig: {
		asar: true,
		icon: path.resolve(__dirname, "build", "icon"),
		appBundleId: 'edu.txstate.edu',
		appCategoryType: 'public.app-category.education',
		win32metadata: {
			CompanyName: 'R-Squared Solutions LLC',
			OriginalFilename: 'dental-ta'
		},
		ignore: [
			/\/github(\/?)/,
			/package-lock\.json/,
			/\.editorconfig/,
			/\.gitattributes/,
			/\.gitignore/,
			/\.npmrc/,
			/readme\.md/
		]
	},
	makers: [
		{
			name: '@electron-forge/maker-squirrel',
			platforms: ['win32'],
			config: (arch) => {
				return {
					name: 'dental-ta',
					authors: 'Ron Richardson',
					noMsi: true,
					remoteReleases: '',
					setupExe: `dental-ta-${package.version}-setup-${arch}.exe`,
					setupIcon: path.resolve(__dirname, 'build', 'icon.ico'),
					certificateFile: process.env['WINDOWS_CODESIGN_FILE'],
					certificatePassword: process.env['WINOWS_CODESIGN_PASSWORD']
				}
			}
		},
		{
			name: '@electron-forge/maker-zip',
			platforms: ['darwin', 'win32']
		}
	],
	publishers: [
		{
			name: '@electron-forge/publisher-github',
			config: {
				repository: {
					owner: 'rer145',
					name: 'dental-ta'
				},
				draft: true,
				prerelease: true
			}
		}
	],
	hooks: {
		generateAssets: async() => {
			//copy over files?
		}
	}
};
