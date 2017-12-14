#!/usr/bin/env node

var fs         = require('fs');
var path       = require('path');
var program = require('commander');
var escapeStringRegexp = require('escape-string-regexp');

const PREFIX = "*i18n-";
const SUFFIX = "-i18n*";
const DIRECTORY = "./src/app";
const EXTENSIONS = "ts, html";


program
.version('0.0.1')
.option('-p, --prefix <prefix>', 'The prefix for translatable text. Default: '+PREFIX)
.option('-s, --suffix <suffix>', 'The suffix for translatable text. Default: '+SUFFIX)
.option('-d, --dir <directory>', 'Directory to search. Default: '+DIRECTORY)
.option('-e, --extensions <extensions>', 'Extensions of files to search (for multiple, seperate with comma). Default: '+EXTENSIONS)
.parse(process.argv);


function flatten(lists) {
    return lists.reduce(function(a, b) {
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

function getExtensionsArray(extensions){
    var array;

    if(extensions != "")
        extensions = extensions.replace(/\s/g, '');
    else
        extensions = EXTENSIONS;
    

    array = extensions.split(',');   
    array = array.filter(String);

    return array;
}



    var directory  = program.dir || DIRECTORY;
    var prefix  = program.prefix || PREFIX;
    var suffix  = program.suffix || SUFFIX;
    var extensions  = program.extensions || EXTENSIONS;
    var extensionsArray = getExtensionsArray(extensions);

    console.log('Parsing translations in %s; prefix=%s suffix=%s extensions=%s ...', directory, prefix, suffix, extensions);
    
    var strings = [];

    var allDirectories = getDirectoriesRecursive(directory);
    
    allDirectories.forEach(function (directory) {

        fs.readdir(directory, (err, files) => {

            files.forEach(file => {

                var fileextension = file.split('.').pop();

                if( extensionsArray.indexOf(fileextension) != -1){

                    fs.readFile(directory + '/' + file, 'utf-8', function (err, content) {
 //console.log("directory + '/' + file ", directory + '/' + file);
                        if(content){
                            if( content.includes( prefix ) && content.includes( suffix ) ){
                                
                                var escapedPrefix = escapeStringRegexp(prefix);
                                var escapedSuffix = escapeStringRegexp(suffix);
                                   
                                // content deki kurala uyanları array e at
                                var occurances = content.match(new RegExp(escapedPrefix+"(.*?)"+escapedSuffix, "ig"));
                                occurances.forEach(element => {
                                    var string = element.replace(prefix, '').replace(suffix, '');
                                    strings.push(string);
                                    console.log(string);
                                });
                                
    
                            }
                        }
                        

                        
                    });

                }
                
            });

        })

    });

    
