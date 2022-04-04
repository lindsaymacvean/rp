(function() {

    // axios.get('https://g3z09urod0.execute-api.eu-west-2.amazonaws.com/ReadableApiStage/documents', {
    axios.get('https://hzk5v7sv55.execute-api.eu-west-1.amazonaws.com/ReadableApiStage/documents', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            var template = Handlebars.compile(document.querySelector("#documentsTemplate").innerHTML);
            document.querySelector("#documentsList").innerHTML = template({ documents: resp.data.data.files });
        })
})();