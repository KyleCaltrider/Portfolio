class WebWorker {
    constructor(worker) {
        const code = worker.toString(),
              blob = new Blob(["(" + code + ")()"]);
        return new Worker(URL.createObjectURL(blob));
    }
}

export default WebWorker;