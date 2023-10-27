class DragDropUtil {

  static getFileFromInput(inputEl, callback) {
    inputEl.addEventListener('change', function(e){
      callback(inputEl.files);
      e.stopPropagation();
      e.preventDefault();
    });
  }

  static dropFile(dropEl, callback) {
    dropEl.addEventListener('dragenter', function(e){
      e.stopPropagation();
      e.preventDefault();
      dropEl.classList.add('drop-over');
    });
    dropEl.addEventListener('dragover', function(e){
      e.stopPropagation();
      e.preventDefault();
    });
    dropEl.addEventListener('dragleave', function(e){
      e.stopPropagation();
      e.preventDefault();
      dropEl.classList.remove('drop-over');
    });
    dropEl.addEventListener('drop', function(e){
      e.stopPropagation();
      e.preventDefault();
      dropEl.classList.remove('drop-over');
      // return file
      const files = e.target.files || e.dataTransfer.files;
      var reader = new FileReader();
      reader.onload = (e) => {
        callback(e.target.result);
      };
      reader.readAsDataURL(files[0]);
    }, false);
  }

}

export default DragDropUtil;
