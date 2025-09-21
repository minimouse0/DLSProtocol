import { serverSessions} from ".";
import { config, port } from "./config";
import {FMPLogger as Logger} from "./Logger.js"

import * as ws from "ws";
import { getThisMachineHardwareStatus } from "./DLSPerformanceDetector/DLSPerformanceDetector.js";
import { SimpleHTTPReq } from "./http";
export function sendClientError(client:ws,error:string,msg:string,otherOptions:any={}){
    client.send(JSON.stringify({
        type:"error",
        error,
        msg,
        ...otherOptions
    }))
}
//先做ws,ws好做
export const wsServer=new ws.Server({port});
export const authorizedClients = new Map<string,Set<ws>>();
function authClient(client:ws,serverName:string,token:string){
    if(authorizedClients.get(serverName)==undefined)authorizedClients.set(serverName,new Set())
    if(token==config.get("servers")[serverName].token){
        authorizedClients.get(serverName).add(client)
        return true;
    }
    else{
        rejectAsNotAuthed(serverName,client)
        return false;
    }

}
export function checkClientAuthed(server:string,client:ws){
    return Boolean(authorizedClients.get(server)?.has(client));
}
export function rejectAsNotAuthed(serverName:string,client:ws){
    sendClientError(client,"token_incorrect","服务器"+serverName+"尚未验证！",{serverName})
}
//发心跳包防止长连接断开
//心跳包不需要鉴权
setInterval(()=>wsServer.clients.forEach(client=>client.send("{\"type\":\"hb\"}")),9000)
wsServer.on("connection",client=>{
    client.on("message",rawData=>{
        try{
            const parsedData=JSON.parse(rawData.toString());
            const {type,data,serverName,requestUID}=parsedData
            //先检查是否有serverName，如果没有则直接拒绝
            if(serverName==undefined){
                sendClientError(client,"pattern_not_provided","发送的数据中缺少serverName字段",{pattern:"serverName"})
                return;
            }
            switch(type){
                //鉴权用API
                case "auth":
                    if(authClient(client,serverName,parsedData.token)){
                        client.send(JSON.stringify({
                            type:"authed",
                            requestUID
                        }))
                    }
                    else{
                        rejectAsNotAuthed(serverName,client)
                    }
                    break;
                //需要鉴权
                case "execute":
                    if(checkClientAuthed(serverName,client)){
                        serverSessions.get(serverName).session.execute([data]);
                        //如果客户端尝试执行了命令，那么激活相应会话
                        serverSessions.get(serverName).activeManager.activate()
                    }
                    else rejectAsNotAuthed(serverName,client)
                    break;
                //需要鉴权
                case "fetch_all_server_logs":
                    if(checkClientAuthed(serverName,client))client.send(JSON.stringify({
                        type:"fetch_all_server_logs_result",
                        data:serverSessions.get(serverName).session.logs,
                        requestUID
                    }))
                    else rejectAsNotAuthed(serverName,client)
                    break;
                //公开
                case "fetch_process_status":
                    client.send(JSON.stringify({
                        type:"fetch_process_status_result",
                        data:serverSessions.get(serverName).lastStatus,
                        requestUID
                    }))
                    break;
                //公开
                case "fetch_hardware_status":
                    new Promise<any>(resolve=>{
                        switch(config.get("servers")[serverName].performance?.type){
                            case "local":{
                                getThisMachineHardwareStatus().then(result=>resolve(result))
                                break;
                            }
                            case undefined:
                            case "native":{
                                serverSessions.get(serverName).session.getHardwareStatus().then(result=>resolve(result))
                                break;
                            }
                            case "detector":{
                                //由于这里是直接读取原始请求，所以需要对其重新编码
                                //考虑服务器未开启、端口填错等情况
                                SimpleHTTPReq.GET(config.get("servers")[serverName].performance?.address+"/server_status")
                                    .then(result=>resolve(JSON.parse(result.responseData)))
                                    .catch(e=>{
                                        resolve({
                                            code:503,
                                            msg:"连接DLSPerformanceDetector失败！"
                                        })
                                    })
                                    
                                break;
                            }
                            default:throw new Error("不支持的硬件信息来源："+config.get("servers")[serverName].performance?.type)
                        }                        
                    }).then(result=>{
                        client.send(JSON.stringify({
                            type:"fetch_hardware_status_result",
                            data:result,
                            requestUID
                        }))
                    })

                    break;
                default:
                    throw new Error("不支持的行为："+type);
            }
        }
        catch(e){
            Logger.info("无法解析客户端 "+"[暂不支持显示客户端id]"+" 发来的数据：\n"+e)
        }
    })
    client.on('close',ws=>{
        
    })
})

