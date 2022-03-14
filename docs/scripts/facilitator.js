(function () {

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    axios.get(`https://hzk5v7sv55.execute-api.eu-west-1.amazonaws.com/ReadableApiStage/facilitator?id=${id}`)
        .then(resp => {
            var template = Handlebars.compile(document.querySelector("#facilitatorDataTempalte").innerHTML);
            document.querySelector("#facilitatorData").innerHTML = template(resp.data.Item);
        })

    axios.get(`https://hzk5v7sv55.execute-api.eu-west-1.amazonaws.com/ReadableApiStage/group/list?facilitatorId=${id}`)
    .then(resp => {
        var template = Handlebars.compile(document.querySelector("#groupTemplate").innerHTML);
        document.querySelector("#groupOutput").innerHTML = template({groups: resp.data.Responses.group});
    })
})();