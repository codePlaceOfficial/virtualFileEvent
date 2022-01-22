const PubSub = require('pubsub-js');

const EVENT_TYPE = {
    fileChange: "FILE_CHANGE", createFile: "CREATE_FILE",
    createDir: "CREATE_DIR", deleteFile: "DELETE_FILE",
    getFileContent: "GET_FILE_CONTENT", moveFile: "MOVE_FILE",
    renameFile: "RENAME_FILE", resetFiles: "RESET_VIRTUAL_FILE",
    setFileContent: "SET_FILE_CONTENT"
};

const __generateEvent = (eventType, data) => {
    let event = {
        eventType,
        data
    }
    return event;
}

const generateEvent = {
    createDirEvent: (dirPath, dirName) => {
        return __generateEvent(EVENT_TYPE.createDir, { virtualPath: dirPath, dirName })
    },
    createFileEvent: (dirPath, fileName) => {
        return __generateEvent(EVENT_TYPE.createFile, { virtualPath: dirPath, fileName })
    },
    changeFileEvent: (filePath, data) => {
        return __generateEvent(EVENT_TYPE.changeFile, { virtualPath: filePath, data })
    },
    deleteFileEvent: (filePath) => {
        return __generateEvent(EVENT_TYPE.deleteFile, { virtualPath: filePath })
    },
    moveFileEvent: (oldPath, newPath) => {
        return __generateEvent(EVENT_TYPE.moveFile, { virtualPath: oldPath, newPath })
    },
    getFileContentEvent: (path, data) => {
        return __generateEvent(EVENT_TYPE.getFileContent, { virtualPath: path, data: data })
    },
    renameFileEvent: (path, newName) => {
        return __generateEvent(EVENT_TYPE.renameFile, { virtualPath: path, newName })
    },
    setFileContentEvent: (filePath, content) => {
        return __generateEvent(EVENT_TYPE.setFileContent, { virtualPath: filePath, content })
    },
    fileChangeEvent: (filePath) => {
        return __generateEvent(EVENT_TYPE.fileChange, { virtualPath: filePath })
    }
}

const __execEvent = (event, virtualFile) => {
    switch (event.eventType) {
        case EVENT_TYPE.createDir:
            virtualFile.createDir({ virtualPath: event.data.virtualPath, dirName: event.data.dirName })
            break;
        case EVENT_TYPE.createFile:
            virtualFile.createFile({ virtualPath: event.data.virtualPath, fileName: event.data.fileName })
            break;
        case EVENT_TYPE.renameFile:
            virtualFile.renameFile({ virtualPath: event.data.virtualPath, newName: event.data.newName })
            break;
        case EVENT_TYPE.deleteFile:
            virtualFile.deleteFile({ virtualPath: event.data.virtualPath })
            break;
        case EVENT_TYPE.moveFile:
            virtualFile.moveFile({ virtualPath: event.data.virtualPath, newPath: event.data.newPath })
            break;
        case EVENT_TYPE.setFileContent:
            virtualFile.changeFileContent({ virtualPath: event.data.virtualPath, content: event.data.content })
            break;
        default:
            break;
    }
}

const serverDefaultExecEvent = (event, virtualFile) => {
    PubSub.publish(event.eventType, event.data)

    switch (event.eventType) {
        case EVENT_TYPE.createDir:
        case EVENT_TYPE.createFile:
        case EVENT_TYPE.renameFile:
        case EVENT_TYPE.deleteFile:
        case EVENT_TYPE.setFileContent:
        case EVENT_TYPE.moveFile:
            __execEvent(event, virtualFile);
            break;
        case EVENT_TYPE.getFileContent:
            virtualFile.getFileContent(event.data.virtualPath).then(
                (data) => {
                    virtualFile.eventEmitter.emitEvent(generateEvent.getFileContentEvent(event.data.virtualPath, data))
                }
            )
            break;
        default:
            break;
    }
}
const clientDefaultExecEvent = (event, virtualFile) => {
    PubSub.publish(event.eventType, event.data)
    switch (event.eventType) {
        case EVENT_TYPE.createDir:
        case EVENT_TYPE.createFile:
        case EVENT_TYPE.renameFile:
        case EVENT_TYPE.deleteFile:
        case EVENT_TYPE.setFileContent:
            __execEvent(event, virtualFile);
            break;
        case EVENT_TYPE.getFileContent:
            virtualFile.setFileContent({ virtualPath: event.data.virtualPath, content: event.data.data })
            return;
        case EVENT_TYPE.fileChange:
            // console.log(event.data.virtualPath,"change")
            break;
        default:
            break;
    }
}

class EventEmitter {
    constructor(eventEmiter) {
        this.eventEmiter = eventEmiter
    }
    emitEvent(event) {
        this.eventEmiter(event);
    }
    subscribe(eventType, func) {
        return PubSub.subscribe(eventType, (_, data) => func(data));
    }
    unSubscribe = PubSub.unsubscribe
}


module.exports = {
    EVENT_TYPE,
    generateEvent,
    serverDefaultExecEvent,
    clientDefaultExecEvent,
    EventEmitter
}