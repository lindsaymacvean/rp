

export async function downloadFile(fileUrl, outputLocationPath) {
    // start circle loader
    document.getElementById('overlay').style.display = 'block';
    axios.get(fileUrl, {
        responseType: 'arraybuffer', 
        headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
        }
    })
    .then(function (response) {
        var blob = new Blob([response.data]);
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = outputLocationPath;
        link.click();
    })
    .then(() => {
        // stop circle loader
        document.getElementById('overlay').style.display = 'none';
    });
}
