function toArray(list) {
    var i, array = [];
    for  (i=0; i<list.length;i++) {array[i] = list[i];}
    return array;
}
var els = document.getElementsByTagName('code');
toArray(els).forEach(function (el) {
    if (el.classList.contains("text")) {
        el.classList.remove("text");
        el.classList.add("no-highlight");
    }
});
hljs.initHighlightingOnLoad();
