/**
 * This module provides application configuration information to the rest of the application.
 * It reads the configuration from "/config/app.json"
 */

import * as fs from 'fs';
import * as path from 'path';
import { assign } from 'dojo-core/lang';
import Promise from 'dojo-shim/Promise';

/**
 * Interface for the application configuration, should mirror config/app.json
 */
export interface Config {
	/**
	 * Determined at runtime, the path to the application
	 */
	appPath: string;

	/**
	 * Determined at runtime, the path to the compiled source files
	 */
	srcPath: string;

	/**
	 * Determined at runtime, the AMD Loader for the host (NodeJS) environment
	 */
	hostRequire: Function;

	/**
	 * Deterimed at runtime, the AMD Loader for the browser environment
	 */
	dojoRequire: DojoLoader.Require;

	/**
	 * The application name
	 */
	name: string;

	/**
	 * An array of Module IDs (mids) to load when the application starts
	 */
	boot: string[];

	/**
	 * Is the application running in debug mode
	 */
	debug?: boolean;

	/**
	 * The applications logging level
	 */
	logLevel?: string;
}

/**
 * The configuration for the application
 */
let config = {} as Config;

/**
 * The internal resolver for the configuration promise
 */
let resolver: (value: Config) => void;

/**
 * The internal rejector if something goes wrong with loading the configuration
 */
let rejector: (reason: Error) => void;

/**
 * A flag to know when we are initialized
 */
let initialized = false;

/**
 * The promise that is fulfilled with the configuration once we have
 * initialized properly.
 */
export const ready = new Promise<Config>((resolve, reject) => {
	rejector = reject;
	resolver = (value: Config) => {
		initialized = true;
		resolve(value);
	};
});

/**
 * Initializes the configuration by reading in the config file
 * which is located in {{appPath}}/config/app.json
 * @param appPath The path where the application configuration is located
 */
export function init(appPath: string, srcPath: string, hostRequire: Function,
					 dojoRequire: DojoLoader.Require): Promise<Config> {
	/* if we have already initialized, just return the promise */
	if (initialized) {
		return ready;
	}

	/* read the configuration file */
	let configJson: any;
	try {
		configJson = JSON.parse(String(fs.readFileSync(path.resolve(appPath, 'assets/config/app.json'))));
	}
	catch (error) {
		/* we will reject the promise if we throw during the read */
		rejector(error);
	}

	/* mix it into the exported configuration object */
	assign(config, configJson);

	/* add the configuration path to the object, which was determined at runtime */
	config.appPath = appPath;

	/* add the src path to the object, which was determined at runtime */
	config.srcPath = srcPath;

	config.hostRequire = hostRequire;
	config.dojoRequire = dojoRequire;

	/* resolve the promise, so that everyone else can load properly */
	resolver(config);

	return ready;
}

/**
 * Exporting the configuration as the default for this module.
 */
export default config;
