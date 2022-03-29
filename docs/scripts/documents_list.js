(function() {

    var template = Handlebars.compile(document.querySelector("#documentsTemplate").innerHTML);
    document.querySelector("#documentsList").innerHTML = template({ documents: [{ name: "doc1" }, { name: "doc2" }, { name: "doc3" }, { name: "doc1" }, { name: "doc2" }, { name: "doc3" }, { name: "doc1" }, { name: "doc2" }, { name: "doc3" }, { name: "doc1" }, { name: "doc2" }, { name: "doc3" }, { name: "doc1" }, { name: "doc2" }, { name: "doc3" }, { name: "doc1" }, { name: "doc2" }, { name: "doc3" }] });

    // axios.get('https://hzk5v7sv55.execute-api.eu-west-1.amazonaws.com/ReadableApiStage/facilitator/list', {
    //         headers: {
    //             'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
    //         }
    //     })
    //     .then(resp => {
    //         var template = Handlebars.compile(document.querySelector("#facilitatorTemplate").innerHTML);
    //         document.querySelector("#facilitatorsList").innerHTML = template({ facilitators: resp.data.Items });
    //     })
})();