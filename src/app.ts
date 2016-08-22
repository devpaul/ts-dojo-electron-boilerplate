/**
 * This is the main "application" module that is bootstrapped
 */

import { app } from 'electron';
import Promise from 'dojo-shim/Promise';
import log from './log';

function initialize(): Promise<void> {
	return Promise.resolve();
}

const pluginApp = {
	initialized: false,
	initialize: Promise.resolve().then(function () {
		// delayed using A+ promises to ensure pluginApp is exported before initializing
		return initialize().then(function () {
			log.info('application started');
			pluginApp.initialized = true;
		}, function (error) {
			log.error('could not initialize the application', error);
			throw error;
		});
	})
};

app.on('window-all-closed', function() {
	log.info('All windows closed.');
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

export default pluginApp;
