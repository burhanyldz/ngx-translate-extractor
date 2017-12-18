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


var directory = program.dir || DIRECTORY;
var prefix = program.prefix || PREFIX;
var suffix = program.suffix || SUFFIX;
var extensions = program.extensions || EXTENSIONS;
var extensionsArray = getExtensionsArray(extensions);

console.log('Parsing translations in %s; prefix=%s suffix=%s extensions=%s ...', directory, prefix, suffix, extensions);

var strings = [];

var allDirectories = getDirectoriesRecursive(directory);

async.series([

    function(callback) {
        async.eachOf(allDirectories, function (directory, key, callback) {
 console.log("directory ", directory);

            fs.readdir(directory, (err, files) => {
 console.log("directory ", directory);

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

                    }

                }, function (err) {
                    if (err) return callback(rr);
                    callback();
        
                });

            })
        }, function (err) {
 console.log("err ", err);
            if (err) return callback(rr);
            
 console.log("ended ");
            callback();

        });
    },
    function(callback) {
 console.log("callback ", callback);
        console.log("strings", strings);
        callback();
    }
    
],
function(error) {
 console.log("error ", error);
 console.log("result ");

    })