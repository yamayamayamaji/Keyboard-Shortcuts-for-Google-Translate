module.exports = function(grunt) {
    var taskName;

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        dir: {
            dev: 'dev',
            dist: 'dist',
            sass: 'sass',
            zipStore: 'ChromeWebStore',
        },

        // タスクの設定
        sass: {
            dev: {
                options: {
                    cacheLocation: '<%= dir.sass %>/.sass-cache'
                },
                files: {
                    '<%= dir.dev %>/content.css': '<%= dir.sass %>/content.scss',
                    '<%= dir.dev %>/content202011.css': '<%= dir.sass %>/content202011.scss',
                    '<%= dir.dev %>/options.css': '<%= dir.sass %>/options.scss'
                }
            },
            dist: {
                options: {
                    cacheLocation: '<%= dir.sass %>/.sass-cache',
                    sourcemap: 'none',
                    style: 'compressed'
                },
                files: [{
                    expand: true,
                    cwd: '<%= dir.sass %>/',
                    src: [ '*.scss' ],
                    dest: '<%= dir.dist %>/',
                    ext: '.css'
                }]
            }
        },

        jsonmin: {
            dev: {
                files: {
                    '<%= dir.dev %>/default_settings.min.json': '<%= dir.dev %>/default_settings.json',
                    '<%= dir.dev %>/default_settings202011.min.json': '<%= dir.dev %>/default_settings202011.json'
                }
            },
            dist: {
                files: {
                    '<%= dir.dist %>/default_settings.min.json': '<%= dir.dev %>/default_settings.json',
                    '<%= dir.dist %>/default_settings202011.min.json': '<%= dir.dev %>/default_settings202011.json'
                }
            }
        },

        copy: {
            deploy: {
                expand: true,
                cwd: '<%= dir.dev %>/',
                src: [ '*/**', '*.{js,html}', 'manifest.json' ],
                dest: '<%= dir.dist %>/'
            }
        },

        clean: {
            dist: {
                src: [ '<%= dir.dist %>/*' ]
            }
        },

        watch: {
            sass: {
                files: [ '<%= dir.sass %>/*.scss' ],
                tasks: [ 'sass:dev']
            },
            json: {
                files: [ '<%= dir.dev %>/*.json', '!<%= dir.dev %>/*.min.json', '!<%= dir.dev %>/manifest.json' ],
                tasks: [ 'jsonmin:dev' ]
            }
        },

        zip: {
            deploy: {
                src: [ '<%= dir.dist %>/**' ],
                dest: '<%= dir.zipStore %>/Keyboard-Shortcuts-for-Google-Translate.zip'
            }
        }
    });

    // プラグインのロード
    for (taskName in grunt.config('pkg').devDependencies) {
        if (taskName.indexOf('grunt-') === 0) {
            grunt.loadNpmTasks(taskName);
        }
    }

    // デフォルトタスクの設定
    grunt.registerTask('default', ['watch']);
    grunt.registerTask('deploy', ['clean:dist', 'copy:deploy', 'sass:dist', 'jsonmin:dist', 'zip']);
};
