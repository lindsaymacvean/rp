export const copyTable = (el) => {
    // create a Range object
    var range = document.createRange();
    // set the Node to select the "range"
    range.selectNode(el);
    // add the Range to the set of window selections
    var sel = window.getSelection();
    sel.addRange(range);
  
    // execute 'copy', can't 'cut' in this case
    document.execCommand('copy');
    sel.removeAllRanges();
};