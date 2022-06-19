export const setLoading = () => {
    var loaderModal = new bootstrap.Modal(document.getElementById('loaderModal'), {
        keyboard: false
      })
    loaderModal.show()
}

export const stopLoading = () => {
    var loaderModal = new bootstrap.Modal(document.getElementById('loaderModal'))
    loaderModal.hide()
}