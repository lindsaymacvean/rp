(function () {
    axios.get('https://hzk5v7sv55.execute-api.eu-west-1.amazonaws.com/ReadableApiStage/facilitator/list')
        .then(resp => {
            var template = Handlebars.compile(document.querySelector("#facilitatorTemplate").innerHTML);
            document.querySelector("#facilitatorsList").innerHTML = template(facilitators: resp.data.Items);
        })
})();