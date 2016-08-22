/**
 * This module declares some of the ambient interfaces that are used in the application
 */

interface ApplicationWindow {
	window: Electron.BrowserWindow;
	isOpen(): boolean;
	show(): Electron.BrowserWindow;
}

declare module 'app/config' {
	import config from 'src/config';
	export default config;
}
