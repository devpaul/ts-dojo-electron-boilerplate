/**
 * Bootstrap the Electron NodeJS Environment
 *
 * These modules are compiled slightly differently than the rest of the modules located
 * in /src.  This is because they need to emmitted as "plain" JavaScript files so that
 * the loaders can be loaded.
 */

/// <reference path="../typings/index.d.ts" />

declare var require: any;

/* if we wish to test, an arguent of "config=*" should be passed */
if (process.argv.some(arg => Boolean(arg.match(/^config=/)))) {
	/**
	 * Bootstrapping Intern for testing
	 */
	require('intern/client');
}
else {
	/**
	 * Bootstrapping Electron's NodeJS Environment
	 */
	const electron = require('electron');
	const fs = require('fs');
	const path = require('path');

	/* determine if we are running in a dev or dist mode */
	const built = Boolean(__dirname.match(/[\/\\]app(\.asar)?.boot$/));

	/* determine the paths for various things */
	const appPath = '../';
	const srcPath = path.resolve(__dirname, built ? '../src' : '../_build/src');
	const loaderConfigFile = built ? '../assets/config/loader_app.json' : '../assets/config/loader_dev.json';
	const loaderConfig = JSON.parse(String(fs.readFileSync(path.resolve(__dirname, loaderConfigFile))));

	/* remap loader configuration to absolute paths, this is far more reliable
	* in a deployed application */
	loaderConfig.packages.forEach((item: { name: string; location: string; }) => {
		item.location = path.resolve(__dirname, item.location);
	});

	/**
	 * Replace the electron/node loader with the dojo loader.
	 */
	require = require('dojo-loader');

	/**
	 * Setup some configuration
	 */
	require.config(loaderConfig);

	/**
	 * Add a handler that requires in the application configuration module and
	 * configures it.  After the module is loaded and configured, load the modules
	 * that are in the config's boot property.
	 */
	electron.app.on('ready', function() {
		require([ 'app/config' ], function(config: any) {
			config.init(path.resolve(__dirname, appPath), srcPath, require)
				.then((config: any) => {
					require([ 'app/log' ], function({ ready }) {
						ready.then(() => {
							require(config.boot, function() { });
						});
					});
				}, (error: Error) => {
					throw error;
				});
		});
	});
}
