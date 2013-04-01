function toArray(list) {
    var i, array = [];
    for  (i=0; i<list.length;i++) {array[i] = list[i];}
    return array;
}
var els = document.getElementsByTagName('code');
toArray(els).forEach(function (el) {
    if ("text" === el.className) {
        el.className = "no-highlight";
    }
});
hljs.initHighlightingOnLoad();

function toggleGeoStyleUpdateStorage() {
    localStorage.geo_style =
        (localStorage.geo_style === undefined || localStorage.geo_style === 'true')
        ? 'false'
        : 'true';

    toggleGeoStyle();
}
function toggleGeoStyle() {
    var els = document.querySelectorAll('link[rel=stylesheet]');
    toArray(els).forEach(function (el) {
        el.href = (el.href.match('css2') !== null)
            ? el.href.replace('/css2/', '/css/')
            : el.href.replace('/css/', '/css2/');
    });
}
if (localStorage.geo_style === 'true') {
    toggleGeoStyle();
}
