#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var program = require('commander');
var async = require('async');
var escapeStringRegexp = require('escape-string-regexp');

const PREFIX = "/**i18n*/";
const SUFFIX = "/*i18n**/";
const DIRECTORY = "./src/app";
const EXTENSIONS = "ts, html";


program
    .version('0.0.1')
    .option('-p, --prefix <prefix>', 'The prefix for translatable text. Default: ' + PREFIX)
    .option('-s, --suffix <suffix>', 'The suffix for translatable text. Default: ' + SUFFIX)
    .option('-d, --dir <directory>', 'Directory to search. Default: ' + DIRECTORY)
    .option('-e, --extensions <extensions>', 'Extensions of files to search (for multiple, seperate with comma). Default: ' + EXTENSIONS)
    .parse(process.argv);


function flatten(lists) {
    return lists.reduce(function (a, b) {
        return a.concat(b);
    }, []);
}
function getDirectories(srcpath) {
    return fs.readdirSync(srcpath)
        .map(file => path.join(srcpath, file))
        .filter(path => fs.statSync(path).isDirectory());
}
function getDirectoriesRecursive(srcpath) {
    return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
}

function getExtensionsArray(extensions) {
    var array;

    if (extensions != "")
        extensions = extensions.replace(/\s/g, '');
    else
        extensions = EXTENSIONS;


    array = extensions.split(',');
    array = array.filter(String);

    return array;
}

function sortObj( obj, order ) {
	"use strict";

	var key,
		tempArry = [],
		i,
		tempObj = {};

	for ( key in obj ) {
		tempArry.push(key);
	}

	tempArry.sort(
		function(a, b) {
			return a.toLowerCase().localeCompare( b.toLowerCase() );
		}
	);

	if( order === 'desc' ) {
		for ( i = tempArry.length - 1; i >= 0; i-- ) {
			tempObj[ tempArry[i] ] = obj[ tempArry[i] ];
		}
	} else {
		for ( i = 0; i < tempArry.length; i++ ) {
			tempObj[ tempArry[i] ] = obj[ tempArry[i] ];
		}
	}

	return tempObj;
}


var directory = program.dir || DIRECTORY;
var prefix = program.prefix || PREFIX;
var suffix = program.suffix || SUFFIX;
var extensions = program.extensions || EXTENSIONS;
var extensionsArray = getExtensionsArray(extensions);

console.log('Parsing translations in %s; prefix=%s suffix=%s extensions=%s ...', directory, prefix, suffix, extensions);

var strings = [];
var newTR = {};
var newEN = {};

var allDirectories = getDirectoriesRecursive(directory);

async.series([

    function(callback) {
        async.eachOf(allDirectories, function (directory, key, callback) {

            fs.readdir(directory, (err, files) => {

                async.eachOf(files, function (file, key, callback) {

                    var fileextension = file.split('.').pop();

                    if (extensionsArray.indexOf(fileextension) != -1) {

                        fs.readFile(directory + '/' + file, 'utf-8', function (err, content) {
                            //console.log("directory + '/' + file ", directory + '/' + file);
                            if (content) {
                                if ((content.includes(prefix) && content.includes(suffix))) {

                                    var escapedPrefix = escapeStringRegexp(prefix);
                                    var escapedSuffix = escapeStringRegexp(suffix);

                                    // content deki kurala uyanları array e at
                                    var rege = new RegExp(escapedPrefix + "(.*?)" + escapedSuffix, "g")

                                    while (matches = rege.exec(content)) {
                                        var string = matches[1].replace(/\'/g, '').replace(/\"/g, '');
                                        //console.log("string ", string);
                                        strings.push(string);
                                    }
                                }

                                if (content.includes(' | translate')) {

                                    var rege = /(['"`])((?:(?!\1).|\\\1)+)\1\s*\|\s*translate/g;

                                    while (matches = rege.exec(content)) {
                                        var string = matches[2];
                                        //console.log("string ", string);
                                        strings.push(string);
                                    }
                                }
                            }
                            callback();
                        });

                    }else{
                        callback();
                    }

                }, function (err) {
                    if (err) return callback(err);
                    callback();
        
                });

            })
        }, function (err) {
            if (err) return callback(err);            
            callback();

        });
    },


    function(callback) {
        
        fs.readFile('src/assets/i18n/tr.json', 'utf-8', function (err, content) {
        tr = JSON.parse(content);
            
            async.eachOf(strings, function(string, key, callback){

                if(tr[string] != undefined){
                    newTR[string] = tr[string];
                }else{
                    newTR[string] = "";
                }

                callback();

            },function(err){
                if(err) return callback(err);
                callback();
            })

            
        });

    },

    function(callback){
        var returnTR = sortObj(newTR);
        var stringJSONTR = JSON.stringify(returnTR, null, "\t");
        fs.writeFile('src/assets/i18n/tr.json', stringJSONTR, (err) => {
            if (err) throw err;
            console.log('The tr file has been saved!');
            callback();
          });
        
    },
    function(callback) {
        
        fs.readFile('src/assets/i18n/en.json', 'utf-8', function (err, content) {
        en = JSON.parse(content);
            
            async.eachOf(strings, function(string, key, callback){

                if(tr[string] != undefined){
                    newEN[string] = en[string];
                }else{
                    newEN[string] = "";
                }

                callback();

            },function(err){
                if(err) return callback(err);
                callback();
            })

            
        });

    },

    function(callback){
        var returnEN = sortObj(newEN);
        var stringJSONEN = JSON.stringify(returnEN, null, "\t");
        fs.writeFile('src/assets/i18n/en.json', stringJSONEN, (err) => {
            if (err) throw err;
            console.log('The en file has been saved!');
            callback();
          });
        
    }
    
],
function(error) {
    if(error) console.log(error);
    
    console.log("Successfully extracted "+strings.length+" keywords from "+allDirectories.length+" directories");
});