/**
 * Bootstrap a Chromium BrowserWindow Environment
 *
 * These modules are compiled slightly differently than the rest of the modules located
 * in /src.  This is because they need to emitted as "plain" JavaScript files so that
 * the loaders can be loaded.
 */

/**
 * A user can configure the boot variable to be bootstrapped
 * once the rest of the process is completed
 */
declare const boot: {
	mids: string[];
	callback: Function;
};

/* some global variables that we know are available in this environment */
declare let require: any;
declare const __dirname: string;

const hostRequire = require('remote').getCurrentWindow().hostRequire;

/* making loading working seemlessly between environments requires a bit
 * of analysis */
const path = require('path');
const built = Boolean(__dirname.match(/[\/\\]app(\.asar)?.boot$/));

/* figure out some paths */
const srcPath = path.resolve(__dirname, built ? '../src' : '../_build/src');
const appPath = path.resolve(__dirname, '../');

/* load the dojo loader for this page */
const loaderPath = path.resolve(__dirname, '../node_modules/dojo-loader/');
const dojoRequire = require(loaderPath);

/* Configure the loader */
dojoRequire.config({
	baseUrl: appPath,
	packages: [
		{
			name: 'app',
			location: srcPath
		}, {
			name: 'dojo',
			location: built ? path.resolve(__dirname, '../node_modules/dojo') : './node_modules/dojo'
		}, {
			name: 'dijit',
			location: built ? path.resolve(__dirname, '../node_modules/dijit') : './node_modules/dijit'
		}, {
			name: 'dojo-core',
			location: built ? path.resolve(__dirname, '../node_modules/dojo-core') : './node_modules/dojo-core'
		}
	]
});
dojoRequire.async = true;

/* require in a module with a callback */
dojoRequire([ 'app/config', 'dojo/request/registry' ], function (config: any, registry: any) {
	/* initialise the configuration */
	config.init(appPath, srcPath, hostRequire, dojoRequire);
	require('remote').getCurrentWindow().dojoRequire = dojoRequire;
	if (boot) {
		dojoRequire(boot.mids, boot.callback);
	}
});
