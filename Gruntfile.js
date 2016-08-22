/* jshint node:true */

var os = require('os');

var TASKS = [
	'grunt-contrib-clean',
	'grunt-contrib-copy',
	'grunt-electron',
	'grunt-electron-builder-wrapper',
	'grunt-shell',
	'grunt-ts',
	'grunt-tslint',
	'intern',
	'remap-istanbul'
];

/**
 * A utility function to mix in objects to a target
 */
function mixin(target) {
	for (var i = 1; i < arguments.length; i++) {
		var source = arguments[i];
		for (var key in source) {
			target[key] = source[key];
		}
	}
	return target;
}

module.exports = function (grunt) {
	TASKS.forEach(grunt.loadNpmTasks.bind(grunt));

	/* load local tasks */
	grunt.loadTasks('tasks');

	/* load package configuration information */
	var tsconfigContent = grunt.file.read('tsconfig.json');
	var tsconfig = JSON.parse(tsconfigContent);
	var packageJson = grunt.file.readJSON('package.json');

	/* this will set some preferred options we want to ensure are used with
	 * tsc when compiling the project */
	var tsOptions = mixin({}, tsconfig.compilerOptions, {
		failOnTypeErrors: true,
		fast: 'never'
	});

	/* remap files glob to avoid a tsc issue with creating extra paths */
	tsconfig.filesGlob = tsconfig.filesGlob.map(function (glob) {
		if (/^\.\//.test(glob)) {
			return glob.slice(2);
		}
		return glob;
	});

	grunt.initConfig({
		name: packageJson.name,
		version: packageJson.version,

		tsconfig: tsconfig,
		tsconfigContent: tsconfigContent,
		packageJson: packageJson,

		/* file globs for tasks */
		all: [ '<%= tsconfig.filesGlob %>' ],
		bootFiles: [ 'boot/**/*.ts' ],
		skipTests: [ '<%= all %>', '!tests/**/*.ts' ],
		staticTestFiles: [ 'tests/**/*.{html,css,json,xml}' ],
		devDirectory: '<%= tsconfig.compilerOptions.outDir %>',
		stageDirectory: '_stage',

		/* configuration for tasks */
		clean: {
			dist: {
				src: [ 'dist/', '<%= stageDirectory %>' ]
			},
			dev: {
				src: '<%= devDirectory %>'
			},
			src: {
				src: 'src/**/*.js',
				filter: function (path) {
					var mapPath = path + '.map';
					if (grunt.file.exists(mapPath)) {
						grunt.file['delete'](mapPath);
						return true;
					}
					return false;
				}
			},
			boot: {
				src: 'boot/**/*.js'
			},
			tests: {
				src: 'tests/**/*.js',
				filter: function (path) {
					var mapPath = path + '.map';
					if (grunt.file.exists(mapPath)) {
						grunt.file['delete'](mapPath);
						return true;
					}
					return false;
				}
			},
			coverage: {
				src: [ 'html-report', 'coverage*.json' ]
			}
		},

		copy: {
			/* Build */
			testStaticFiles: {
				expand: true,
				cwd: '.',
				src: '<%= staticTestFiles %>',
				dest: '<%= devDirectory %>'
			},
			staticDevFiles: {
				expand: true,
				cwd: 'src/',
				src: '**/*.{html,css,json,xml}',
				dest: '<%= devDirectory %>/src/'
			},

			/* Staging for release */
			staticFiles: {
				expand: true,
				cwd: '.',
				src: [
					'README.md',
					'LICENSE',
					'package.json',
					'assets/**/*'
				],
				dest: '<%= stageDirectory %>/'
			},
			staticBuildFiles: {
				expand: true,
				cwd: 'src/',
				src: '**/*.{html,css,json,xml}',
				dest: '<%= stageDirectory %>/src/'
			},
			nodeModules: {
				expand: true,
				cwd: '.',
				src: [ 'node_modules/**/*' ],
				dest: '<%= stageDirectory %>/'
			},
			bootScripts: {
				expand: true,
				cwd: '.',
				src: 'boot/**/*.js',
				dest: '<%= stageDirectory %>/'
			},
			nsisPlugins: {
				expand: true,
				cwd: 'assets/win/NSIS',
				src: '**/*.{nsh,dll}',
				dest: os.tmpdir() + '/'
			}
		},

		electron: {
			options: {
				name: '<%= name %>',
				dir: '<%= stageDirectory %>',
				out: 'dist',
				version: '0.36.7',
				asar: true,
				prune: true,
				'app-version': '<%= version %>',
				protocols: [
					{
						name: '<%= name %>',
						schemes: [ 'myapp' ]
					}
				]
			},
			osx: {
				options: {
					platform: 'darwin',
					arch: 'x64',
					'app-category-type': 'public.app-category.utilities',
					icon: 'assets/osx/pluginapp.icns'
				}
			},
			win: {
				options: {
					platform: 'win32',
					arch: [ 'ia32', 'x64' ],
					icon: 'assets/osx/pluginapp.ico'
				}
			}
		},

		'electron-builder': {
			osx: {
				options: {
					appPath: 'dist/<%= name %>-darwin-x64/<%= name %>.app',
					platform: 'osx',
					out: 'dist/installer/osx',
					config: 'installers.json'
				}
			},
			win: {
				options: {
					appPath: 'dist/<%= name %>-win32-ia32',
					platform: 'win',
					out: 'dist/installer/win',
					config: 'installers.json'
				}
			},
			'win-user': {
				options: {
					appPath: 'dist/<%= name %>-win32-ia32',
					platform: 'win',
					out: 'dist/installer/win-user',
					config: 'installers-user.json'
				}
			}
		},

		intern: {
			options: {
				runType: 'runner',
				config: '<%= devDirectory %>/tests/intern',
				reporters: [ 'Runner' ]
			},
			node: {
				options: {
					runType: 'client',
					reporters: [
						'Console',
						'node_modules/remap-istanbul/lib/intern-reporters/JsonCoverage'
					]
				}
			}
		},

		remapIstanbul: {
			src: 'coverage-final.json',
			options: {
				reports: {
					'json': 'coverage-final.json',
					'html': 'html-report',
					'text': null
				}
			}
		},

		shell: {
			prune: {
				command: 'npm prune --production',
				options: { execOptions: { cwd: '<%= stageDirectory %>' } }
			},
			intern: {
				command: 'node_modules/.bin/electron'
					+ ' . config=<%= devDirectory %>/tests/intern reporters=Console'
					+ ' reporters=node_modules/remap-istanbul/lib/intern-reporters/JsonCoverage'
			}
		},

		ts: {
			options: tsOptions,
			dev: {
				/* intern doesn't currently support inline source maps */
				options: {
					sourceMap: true,
					inlineSourceMap: false,
					inlineSources: false
				},
				outDir: '<%= devDirectory %>',
				src: '<%= all %>'
			},
			dist: {
				options: {
					inlineSourceMap: true,
					inlineSources: true
				},
				outDir: '<%= stageDirectory %>/src',
				src: '<%= skipTests %>'
			},
			bootNode: {
				options: {
					inlineSourceMap: true,
					inlineSources: true
				},
				outDir: undefined,
				src: 'boot/node.ts'
			},
			bootChromium: {
				options: {
					inlineSourceMap: true,
					inlineSources: true
				},
				outDir: undefined,
				src: 'boot/chromium.ts'
			}
		},

		tslint: {
			options: {
				configuration: grunt.file.readJSON('tslint.json')
			},
			src: {
				src: [
					'<%= all %>',
					'<%= bootFiles %>',
					'!typings/**/*.ts',
					'!tests/typings/**/*.ts',
					'!node_modules/**/*.ts'
				]
			}
		}
	});

	grunt.registerTask('dev', [
		/* check the source code is following coding guidelines */
		'tslint',

		/* do a development build of the source code */
		'ts:dev',

		/* build the node boot script */
		'ts:bootNode',

		/* build the chromium boot script */
		'ts:bootChromium',

		/* copy any static files we need for testing */
		'copy:testStaticFiles',

		/* copy any static files we need for the app */
		'copy:staticDevFiles',

		/* update the TypeScript project configuration file */
		'updateTsconfig'
	]);

	grunt.registerTask('test', [
		/* do a dev build */
		'dev',

		/* run intern */
		'shell:intern',

		/* remap the coverage to get better view of the source code */
		'remapIstanbul'
	]);

	grunt.registerTask('dist', [
		/* clean up temporary files */
		'clean',

		/* check the source code is following coding guidelines */
		'tslint',

		/* build a distribution version of the code */
		'ts:dist',

		/* build the node boot script */
		'ts:bootNode',

		/* build the chromium boot script */
		'ts:bootChromium',

		/* copy the boot files */
		'copy:bootScripts',

		/* copy static files that don't get built */
		'copy:staticFiles',

		/* copy some additional files needed for a built verison */
		'copy:staticBuildFiles',

		/* copy our node modules which we need to bundle */
		'copy:nodeModules',

		/* prune the npm packages for a production build */
		'shell:prune'
	]);

	grunt.registerTask('osxinstaller', [
		/* build the distribution */
		'dist',

		/* build the executable for OSX */
		'electron:osx',

		/* build the installer for OSX */
		'electron-builder:osx'
	]);

	grunt.registerTask('wininstaller', [
		/* build the distribution */
		'dist',

		/* build the executables for Windows */
		'electron:win',

		/* copy the NSIS plugins */
		'copy:nsisPlugins',

		/* build the installers for Windows */
		'electron-builder:win',
		'electron-builder:win-user'
	]);

	grunt.registerTask('binaries', [
		'dist',
		'electron'
	]);

	grunt.registerTask('installers', [
		'binaries',
		'electron-builder'
	]);

	grunt.registerTask('default', [
		/* clean up temporary files */
		'clean',

		/* do a development build */
		'dev'
	]);
};
