export const filterGroups = () => {
    var input = document.getElementById('search_input');
    var toSearch = input.value.toUpperCase();
    var results = [];

    // Search through each the groups and then each of the individual groups properties
    for (var group in flatGroupData) {
        for (var field in flatGroupData[group]) {
        var txtValue = flatGroupData[group][field].toString().toUpperCase();
        if (txtValue.indexOf(toSearch) != -1) {
            results.push(flatGroupData[group].eventId);
        }
        }
    }

    // Loop through all list items, and hide those who don't match the search query
    var searchGroups = document.getElementById("groupsList");
    var items = searchGroups.getElementsByClassName('searchItems');
    for (var i = 0; i < items.length; i++) {
        if (results.includes(items[i].id)) {
        items[i].style.display = "";
        } else {
        items[i].style.display = "none";
        }
    }
};

