#! /usr/bin/env node

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

var readArticle = function readArticle( url ) {
  read( url, function(err, article, meta) {

    console.log( "\n" + ARTICLE_INDENT + article.title.toUpperCase().trim(), "\n" );

    // make sure we have linebreaks on paragraphs, in case html minified
    var content = article.content.replace( /\<\/p\>/g, "\n" );

    // strip unwanted tags
    content = sanitize( content, { allowedTags: [ ] } );

    // hard wrap
    content = wrap( content );


    // condense whitespace, explode by paragraph
    content = content.split( '\n' ); //.filter( function( str ) { return /\S/.test( str ); });

    // trim lines
    content = _.map(content, function( i ){ return i.trim(); });

    // implode, double linebreak to visually separate paragraphs
    content = content.join( "\n" );
    content = content.replace(/\n{3,}/g, '\n\n');
    content = content.replace(/\n/g, '\n'+ARTICLE_INDENT);

    // decode html entities
    content = entities.decode( content );
    console.log( content );

    article.close();
  });
}
// readArticle('http://www.philstar.com/headlines/2015/02/28/1428494/french-star-takes-different-role');


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

        readArticle(answers.link);

      });
    });
  });
}).on('error', function(e) {
  console.log("Got error: ", e);
});
