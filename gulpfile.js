var gulp = require("gulp");
var gulpsync = require('gulp-sync')(gulp);
var less = require("gulp-less");
var connect = require("gulp-connect");
var notifier = require('node-notifier');
var notify = require("gulp-notify");
var spritesmith = require('gulp.spritesmith');
var buffer = require('vinyl-buffer');
var imagemin = require('gulp-imagemin');
var merge = require('merge-stream');
var nunjucksRender = require('gulp-nunjucks-render');
var rigger = require('gulp-rigger');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var clean = require('gulp-clean');
var watch = require('gulp-watch');
var uncache = require('gulp-uncache');

var postcss      = require('gulp-postcss');
var autoprefixer = require('autoprefixer');

var postcssSVG = require('postcss-svg');

var path = {
	src: 'src/',
	destination: 'build/'
};

// Images first run
gulp.task('images-init', function() {
	// Copy images
	gulp.src(path.src + 'img/opt/*.*')
		.pipe(gulp.dest(path.destination + 'img/'));

	// Copy user images
	gulp.src(path.src + 'images/*.*')
		.pipe(gulp.dest(path.destination + 'images/'));
});

// Images watch
gulp.task('images', function() {
	gulp.src(path.src + 'img/unopt/*.*')
		.pipe(imagemin())
		.pipe(gulp.dest(path.src + 'img/opt/'));

	gulp.src(path.src + 'img/opt/*.*')
		.pipe(gulp.dest(path.destination + 'img/'));

	gulp.src(path.src + 'img/unopt/*.*')
		.pipe(clean())
		.pipe(notify("Images processed"))
		.pipe(connect.reload());
});

// User images watch
gulp.task('user-images', function() {
	gulp.src(path.src + 'images/*.*')
		.pipe(gulp.dest(path.destination + 'images/'))
		.pipe(connect.reload());
});

// Fonts first run
gulp.task('fonts-init', function() {
	// Copy fonts
	gulp.src(path.src + 'fonts/*.*')
		.pipe(gulp.dest(path.destination + 'fonts/'));
});

// Favicons first run
gulp.task('favicons-init', function() {
	// Copy favicons
	gulp.src(path.src + 'favicons/*.*')
		.pipe(gulp.dest(path.destination));
});

// Server
gulp.task('connect', function() {
	connect.server({
		port: 1393,
		livereload: true,
		root: 'build'
	});
});

// Less
gulp.task('less', function() {
	gulp.src(path.src + 'css/main.less')
		.pipe(sourcemaps.init())
		.pipe(less({
			compress: true
		}))
			.on('error', function(err){
				notifier.notify({
					'title': 'Error',
					'message': err.message
				});
				console.log(err.message);
				return false;
			})
		.pipe(postcss([
			autoprefixer({
				browsers: ['last 2 versions']
			}),
			postcssSVG({
				paths: ['src/img/svg-icons/'],
			}),
		]))
		.pipe(notify("Everything is fine!"))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.destination + 'css/'))
		.pipe(connect.reload())
});

// Html
gulp.task('nunjucks', function() {
	// Gets .html and .nunjucks files in pages
	return gulp.src(path.src + 'templates/*.+(twig)')
		.pipe(nunjucksRender({
			path: [path.src + 'templates']
		}))
		.on('error', function(err) {
			notifier.notify({
				'title': "Error",
				'message': err.message
			});
			return false;
		})
		.pipe(uncache())
		.pipe(gulp.dest(path.destination))
		.pipe(connect.reload());
});

// Js
gulp.task('js', function () {
	gulp.src(path.src + 'scripts/app.js')
		.pipe(rigger())
		.on('error', function(err) {
			notifier.notify({
				'title': "Error",
				'message': err.message
			});
			return false;
		})
		.pipe(uglify({comments: false}))
		.on('error', function(err) {
			notifier.notify({
				'title': "Error",
				'message': err.message
			});
			return false;
		})
		.pipe(rename('app.min.js'))
		.pipe(notify({
			'title': 'JS compilation',
			'message': 'Everything is fine!!'
		}))
		.pipe(gulp.dest(path.destination + 'scripts'))
		.pipe(connect.reload());
});


gulp.task('reload', function() {
	gulp.src('css/main.less')
		.pipe(connect.reload());
});

// Watch for less, js and twig files, images
gulp.task('watch', function() {
	watch(path.src + 'img/unopt/*.*', function(event, cb) {
		gulp.start('images');
	});

	watch(path.src + 'images/*.*', function(event, cb) {
		gulp.start('user-images');
	});

	watch(path.src + 'templates/**/*.twig', function(event, cb) {
		gulp.start('nunjucks');
	});

	watch(path.src + 'scripts/**/*.js', function(event, cb) {
		gulp.start('js');
		gulp.start('nunjucks');
	});

	watch(path.src + '**/*.less', function(event, cb) {
		gulp.start('less');
		gulp.start('nunjucks');
	});
});

// Cleaner that runs when launch gulp
gulp.task('clean', function () {
	return gulp.src(path.destination, {read: false})
		.pipe(clean());
});

// Default task compiles all and starts server, then watches
gulp.task('default', gulpsync.sync([
	'clean',
	[
		'less',
		'nunjucks',
		'js',
		'images-init',
		'fonts-init',
		'favicons-init',
		'connect',
		'watch',
	]
]));

