
import * as ws from "ws"
import { 
    APIError,
    AuthedPack,
    ConsoleUpdatePack,
    FetchAllServerLogsResultPack,
    FetchHardwareStatusResultPack,
    FetchProcessStatusResultPack,
    hearbeat,
    ProcessStatusUpdatePack ,
    ReqeustFailedPack
} from "./APIStruct";
type DLSAPIErrorReason=
    "PATHINVALID"
    |"NETWORKTIMEDOUT"
    |"UNKNOWN"
    |"INCORRECTTOKEN"
    |"UNEXPECTEDSTATUS"
    |"OUTDATEDAPIVERSION"
    |"BUG"
    |"APIFORMATERROR"
export class DLSAPIError extends Error{
    code:DLSAPIErrorReason
    HTTPStatusCode:number|undefined
    constructor(msg:string,code:DLSAPIErrorReason,HTTPStatusCode?:number){
        super(msg)
        this.code=code;
        this.HTTPStatusCode=HTTPStatusCode
    }
}
export function sendConsoleUpdate(client:ws,data:ConsoleUpdatePack){
    clientSend(client,data)

}
export function sendProcessStatusUpdatePack(client:ws,data:ProcessStatusUpdatePack){
    clientSend(client,data)

}
export function sendClientError(client:ws,data:APIError){
    clientSend(client,data)
}
export function sendRequestFailed(client:ws,data:ReqeustFailedPack){
    clientSend(client,data)
}
export function sendHeartbeat(client:ws){
    client.send(hearbeat)
}
export function sendAuthedBack(client:ws,data:AuthedPack){
    clientSend(client,data)
}
export function sendFetchAllServerLogsResultPack(client:ws,data:FetchAllServerLogsResultPack){
    clientSend(client,data)
}
export function sendFetchProcessStatusResultPack(client:ws,data:FetchProcessStatusResultPack){
    clientSend(client,data)
}
export function sendFetchHardwareStatusResultPack(client:ws,data:FetchHardwareStatusResultPack){
    clientSend(client,data)
}
function clientSend(client:ws,data:any){
    client.send(JSON.stringify(data))
}