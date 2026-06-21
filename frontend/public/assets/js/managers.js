document.addEventListener("DOMContentLoaded", () => {


    ClassicEditor
        .create(document.querySelector('#inputMailEditor'), {
            toolbar: [
                'bold', 'italic', 'underline', '|',
                'link', 'imageUpload', 'undo', 'redo', '|',
                'insertTable', 'blockQuote', 'emoji', '|',
                'bulletedList', 'numberedList', '|',
                'alignment:left', 'alignment:center', 'alignment:right', 'alignment:justify'
            ]
        })
        .then(editor => {
            window.editor = editor;
        })
        .catch(error => {
            console.error(error);
        });

});