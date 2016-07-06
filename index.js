#!/usr/bin/env node

var read = require('node-readability'),
  sanitize = require('sanitize-html'),
  _ = require('lodash'),
  http = require('https'),
  parser = require('xml2js').parseString,
  inquirer = require('inquirer'),
  size = require('window-size'),
  wrap = require('wordwrap')(55),
  entities = require('html-entities').AllHtmlEntities;

var entities = new entities();
var ARTICLE_INDENT = "    ";

var url = 'https://news.google.com.ph/news?cf=all&hl=en&pz=1&ned=en_ph&topic=n&output=rss';

var content;

var readArticle = function readArticle( url ) {
  return new Promise(function(resolve, reject) {
    read( url, function(err, article, meta) {

      content = "\n" + ARTICLE_INDENT + article.title.toUpperCase().trim();

      // make sure we have linebreaks on paragraphs, in case html minified
      content = content + article.content.replace( /\<\/p\>/g, "\n" );

      article.close();

      // strip unwanted tags
      content = sanitize( content, { allowedTags: [ ] } );

      // hard wrap
      content = wrap( content );

      // condense whitespace, explode by paragraph
      content = content.split( '\n' ); //.filter( function( str ) { return /\S/.test( str ); });

      // trim lines
      content = _.map(content, function( i ){ return i.trim(); });

      // implode, double linebreak to visually separate paragraphs
      content = ARTICLE_INDENT + content.join( "\n" );
      content = content.replace(/\n{3,}/g, '\n\n');
      content = content.replace(/\n/g, '\n'+ARTICLE_INDENT);

      // decode html entities
      content = entities.decode( content ).trimRight();
      content = content.split('\n');
      content.push('END');

      resolve(content);

    });
  });
}
// readArticle('http://www.philstar.com/headlines/2015/02/28/1428494/french-star-takes-different-role');

function more(content, page) {
  var end = false;
  process.stdout.write('\n');
  inquirer.prompt([
    {
      type: 'confirm',
      message: 'More ['+page+' of '+Math.ceil(content.length/size.height)+']',
      name: 'continue',
      default: true
    }
  ], function(answer){
    process.stdout.write('\n');
    if(answer.continue) {
      process.stdout.cursorTo(0);
      process.stdout.clearLine();
      start = page * size.height-2;
      _.each(content.slice(start, (start + size.height-2)), function(line){
        if(line=='END') {
          console.log('\r\n');
          inquirer.prompt([
            {
              type: 'confirm',
              message: 'Back to list?',
              name: 'read',
              default: true
            }
          ], function(answer){
            if(answer.read) begin();
            else process.exit();
          });
          end = true;
        } else {
          process.stdout.write(line+'\n');
        }
      });
      if(!end) more(content, page+1);
    } else {
      process.exit();
    }
  });

}

function begin() {
  http.get(url, function(res) {
    var body = '';

    res.on('data', function(chunk) {
      body += chunk;
    });

    res.on('end', function() {
      parser(body, function(err, json){

        var urlmap = {};

        var choices = _.map(json.rss.channel[0].item, function(i){

          var name = i.title.toString();
          var link = i.link.toString();
          return {
            name: entities.decode( name.trim() ),
            value: link.substring(link.indexOf("url=")+4, link.length)
          }
        });
        choices.push(new inquirer.Separator());
        inquirer.prompt([
          {
            type      : "list",
            name      : "link",
            message   : "Balita",
            paginated : true,
            choices   : choices
          }
        ], function( answers ) {

          console.log( "  Loading: "+answers.link );

          readArticle(answers.link).then(function(content) {
            _.each(content.slice(0, size.height-2), function(line){
              process.stdout.write(line+'\n');
            });
            more(content, 1);
          });

        });
      });
    });
  }).on('error', function(e) {
    console.log("Got error: ", e);
  });
}

begin();
