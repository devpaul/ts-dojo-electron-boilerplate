/**
 * This module setups and then exports a bunyan logger interface for managing logging for the application
 */

import * as bunyan from 'bunyan';
import { app } from 'electron';
import * as path from 'path';

/* create an internal buffer for logs */
export const ringbuffer = new bunyan.RingBuffer({ limit: 100 });

/* create new logger instance */
let log = bunyan.createLogger({
	name: 'pluginapp',
	streams: [
		{
			/* this stream logs to the console */
			level: 'info',
			stream: process.stdout
		},
		{
			/* this stream logs to the internal ring buffer, which retains the last 100
			 * log messages */
			level: 'trace',
			type: 'raw',
			stream: ringbuffer
		}
	]
});

log.info(`Logger started`);

const logPath = path.resolve(app.getPath('userData'), 'app.log');

/* add a stream logging to a file */
log.addStream({
	type: 'rotating-file',
	path: logPath,
	period: '1d',
	count: 5
});

log.info(`Logging to file: ${logPath}`);

export default log;
