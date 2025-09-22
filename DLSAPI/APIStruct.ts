export enum ProcessStatus{
    STOPPED,
    RUNNING,
    SUSPEND,
    CRASHED,
    BACKINGUP
}

export interface DLSLog{
    log_id:number,
    time?:number,
    text:string,
    color_text:string,
    clientRemark?:string
}
export interface ConsoleUpdatePack{
    type:"console_update"
    serverName:string
    data:DLSLog[]
}
export interface ProcessStatusUpdatePack{
    
    type:"process_status_update",
    serverName:string,
    data:{
        status: ProcessStatus;
    }
}
export interface AuthedPack{
    type:"authed",
    requestUID:string
}
export interface FetchAllServerLogsResultPack{
    type:"fetch_all_server_logs_result",
    data:DLSLog[],
    requestUID:string
}
export interface FetchProcessStatusResultPack{
    type:"fetch_process_status_result",
    data:ProcessStatus,
    requestUID:string
}
export interface HardwareStatusResult{
    code: number,
    cpu_count:number,
    cpu_freq: number, // GHz
    cpu_rate: number,
    mem_rate: number,
    mem_used: number, // MB
    mem_total: number, // MB
    disks_info: {
        symbol: string,
        disk_used: number, // GB
        disk_total: number// GB
    }[]
}
export interface FetchHardwareStatusResultPack{
    type:"fetch_hardware_status_result",
    data:HardwareStatusResult,
    requestUID:string
}
type clientErrorType="token_incorrect"
    |"pattern_not_provided"
export interface APIError{
    
    type:"error",
    error:clientErrorType,
    msg:string,
    serverName:string,
    attachments?:any
}
export interface ReqeustFailedPack{
    
    type:"request_falied",
    serverName:string
    requestType:string,
    requestUID:string,
    attachments?:any
}
export const hearbeat="{\"type\":\"hb\"}"