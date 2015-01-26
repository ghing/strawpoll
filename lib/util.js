/**
 * From http://blog.benmcmahen.com/post/41122888102/creating-slugs-for-your-blog-using-express-js-and
 */
var slugify = function(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
};

var randomInt = function(min, max) {
  return parseInt(Math.random() * (max - min) + min);
};

exports.slugify = slugify;
exports.randomInt = randomInt;
