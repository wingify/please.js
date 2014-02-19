/*global module:false*/
module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %> ' + '\n' +
				'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
				'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;' +
				' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n'
		},
		uglify: {
			options: {
				banner: '<%= meta.banner %>'
			},
			build: {
				src: 'src/<%= pkg.name %>.js',
				dest: '<%= pkg.name %>.min.js'
			}
		},
		jshint: {
			all: ['Gruntfile.js', 'src/**/*.js', 'tests/unit/**/*.js']
		},
		qunit: {
			all: ['tests/index.html']
		}

	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');

	grunt.registerTask('default', ['jshint', 'qunit', 'uglify']);
};
