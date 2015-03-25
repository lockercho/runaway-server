all: essentials pack 

pack:
	npk ./build
	cp -f build/out/runaway.js/runaway.js ./build

essentials:
	mkdir -p build
	cp -rf bin build/bin
	cp -rf routes build/routes
	cp -rf bower_components build/bower_components
	cp -rf node_modules build/node_modules
	cp -rf public build/public
	cp -rf views build/views
	cp -f runaway.sql build
	cp -f *.js build
	cp -f users.htpasswd.template build
	cp -f bower.json build
	cp -f package.json build


clean:
	rm -rf build
	rm -rf dist

run:
	cp config.ini build
	cp users.htpasswd build
	PORT=3005 node build/runaway.js