module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt); 
    grunt.initConfig({
        concurrent: {
            target: {
                tasks: ['nodemon', 'less','watch'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        nodemon: {
          dev: {
             script: './bin/www'
          }
        },
        less: {
          development: {
            options: {
                concat: false,
                compress: true
            },
            files: {
              "./public/stylesheets/style.css": "./public/stylesheets/style.less"
            }
          }
        },
        watch: {
          css: {
            files: './public/stylesheets/*.less',
            tasks: ['less'],
            options: {
              livereload: true,
            },
          },
        },
    });    

    // grunt.loadNpmTasks('grunt-nodemon');
    // grunt.loadNpmTasks('grunt-contrib-less');
    // grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', [ 'concurrent:target']);

};