//整体思路：首先自己作为客户端，向dls高速请求
//通过dlsapi.ts,可以实现对控制台变化的监听，只在控制台变化时发消息
//这样的话就可以避免轮询造成的巨大网络开销，也能避免dls内置http服务的局限性
//有了这些作为基础之后，再做dls的监听就好办了
//测试方式，在codeserver上运行服务端程序
//然后在termux内做简易客户端进行测试
//后面这个客户端成熟了，就直接放到远程服务器上就行了
//首先，实现dls获取远程服务器数据并打印到控制台即可
import { DLSAPI} from "./DLSAPI/dlsapi.js";
import {FMPLogger as Logger} from "./Logger.js"
import * as ws from "ws";
import { config } from "./config.js";
import { authorizedClients, checkClientAuthed, wsServer } from "./WSServer.js";
import { sendConsoleUpdate, sendProcessStatusUpdatePack } from "./DLSAPI/ServerHelper.js";
import { ProcessStatus } from "./DLSAPI/APIStruct.js";
class DLSActiveManager{

    maxIdleTime=10000
    DLSLastActive=Date.now()
    session:DLSAPI
    constructor(session:DLSAPI){
        this.session=session
    }
    activate(){
        //激活后需要设置一个定时，到时间之后取消激活
        this.DLSLastActive=Date.now();
        //等待最大空闲时间后取消激活
        setTimeout(this.deactivate.bind(this),this.maxIdleTime+1)
        //进行激活操作
        this.session.refreshInterval=0
    }
    deactivate(){
        //因为每次激活都会在相对最晚的时间点尝试取消激活
        //首先检查是否空闲超时
        if(Date.now()-this.DLSLastActive<this.maxIdleTime)return;
        //这里就直接取消激活就行了
        //为什么？就不怕较早激活的行为提前取消激活，导致较晚的激活行为过早取消激活吗？
        //这种情况不会发生，因为一旦有更晚的激活行为，那么这个激活行为会修改上次激活时间
        //修改了这个时间之后，较早的激活行为试图取消激活时，会发现自己不满足取消激活条件
        //所以，只有最后一个激活行为才能成功取消激活
        //因为没有人在最后一个激活行为之后再激活了，这让最后一个激活行为的取消激活满足条件
        this.session.refreshInterval=2000
    }
}

export const serverSessions=new Map<string,{
    session:DLSAPI,
    lastStatus:ProcessStatus,
    activeManager:DLSActiveManager
}>()
Object.keys(config.get("servers")).forEach(serverName=>{
    const {address,token}=config.get("servers")[serverName]
    const session=new DLSAPI(address,token);
    const activeManager=new DLSActiveManager(session)
    //连接建立后直接激活一次
    activeManager.activate()
    session.postConsoleRefresh.push(newInfo=>{
        //只有日志数量不为空时才会触发对各个客户端的广播
        if(newInfo.logsAppended.length>0){
            //不为空时判定DLS进入活跃状态
            activeManager.activate();
            //下面这个会打印新日志，用作调试
            //newInfo.logsAppended.forEach(log=>console.log(log.text));
            authorizedClients.get(serverName)?.forEach(client => {
                //需要鉴权，但是不发token错误
                if(checkClientAuthed(serverName,client)&&client.readyState===ws.WebSocket.OPEN){
                    sendConsoleUpdate(client,{
                        type:"console_update",
                        serverName,
                        data:newInfo.logsAppended
                    })
                }
            });            
        }

    })
    //serverSessions.get(serverName).lastStatus=ProcessStatus.STOPPED
    session.postProcessStatusRefresh.push(status=>{
        if(status.status!==serverSessions.get(serverName).lastStatus){
            //公开
            wsServer.clients.forEach(client => {
                if(client.readyState===ws.WebSocket.OPEN){
                    sendProcessStatusUpdatePack(client,{
                        type:"process_status_update",
                        serverName,
                        data:status
                    })
                }
            });
            serverSessions.get(serverName).lastStatus=status.status
        }
    })
    session.start();
    serverSessions.set(serverName,{
        session,
        lastStatus:ProcessStatus.STOPPED,
        activeManager
    })
})

