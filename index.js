#! /usr/bin/env node

var read = require('node-readability'),
  sanitize = require('sanitize-html'),
  _ = require('lodash'),
  http = require('http'),
  parser = require('xml2json'),
  inquirer = require('inquirer'),
  entities = require('html-entities').AllHtmlEntities;

var entities = new entities();
var ARTICLE_INDENT = "    ";

var insertLines = function insertLines( a ) {
  var a_split = a.split(" ");
  var res = "";
  for ( var i = 0; i < a_split.length; i++ ) {
    res += a_split[i] + " ";
    if ( (i+1) % 12 === 0 )
      res += "[break]";
    }
  return res;
}

var url = 'http://news.google.com.ph/news?pz=1&cf=all&ned=en_ph&hl=en&topic=n&output=rss';

var readArticle = function readArticle( url ) {
  read( url, function(err, article, meta) {

    console.log( "\n" + ARTICLE_INDENT + article.title.toUpperCase(), "\n" );

    // make sure we have linebreaks on paragraphs, in case html minified
    var content = article.content.replace( /\<\/p\>/g, "\n" );

    // strip unwanted tags
    content = sanitize( content, { allowedTags: [ ] } );

    // condense whitespace, explode by paragraph
    content = content.split( '\n' ).filter( function( str ) { return /\S/.test( str ); });

    // trim lines, linebreak every 12 words
    content = _.map(content, function( i ){ return insertLines( i.trim() ).replace( /\[break\]/g, "\n" + ARTICLE_INDENT ) });

    // implode, double linebreak to visually separate paragraphs
    content = content.join( "\n\n" + ARTICLE_INDENT );

    // decode html entities
    content = entities.decode( content );
    console.log( ARTICLE_INDENT + content + "\n" );

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
    var json = parser.toJson(body); //returns a string containing the JSON structure by default
    var response = JSON.parse(json);

    var urlmap = {};

    // _.each(response.rss.channel.item, function(i){ urlmap[entities.decode( i.title.trim() )] = i.link; });
    // console.log(urlmap);

    var choices = _.map(response.rss.channel.item, function(i){
      return {
        name: entities.decode( i.title.trim() ),
        value: i.link.substring(i.link.indexOf("url=")+4, i.link.length)
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
}).on('error', function(e) {
  console.log("Got error: ", e);
});
