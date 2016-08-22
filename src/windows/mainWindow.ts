/**
 * This module manages the mainWindow
 */

import { BrowserWindow } from 'electron';
import log from '../log';
import config from '../config';

let mainWindow: Electron.BrowserWindow = null;

const view: ApplicationWindow = {
	get window(): Electron.BrowserWindow {
		return mainWindow;
	},

	isOpen() {
		return !!view.window;
	},

	show() {
		if (view.isOpen()) {
			view.window.show();
			return;
		}

		// Create the browser window.
		const window = mainWindow = new BrowserWindow({ width: 800, height: 600 });

		(<any> window)['hostRequire'] = config.hostRequire;

		// and load the index.html of the app.
		window.loadURL(`file://${config.srcPath}/index.html`);

		// Open the DevTools.
		window.webContents.openDevTools();

		log.info('Created mainWindow');

		// Emitted when the window is closed.
		window.on('closed', function() {
			// Dereference the window object, usually you would store windows
			// in an array if your app supports multi windows, this is the time
			// when you should delete the corresponding element.
			mainWindow = null;
		});

		return window;
	}
};

export default view;
