
import * as http from 'http'
import { JsonFile } from "./File";
import { getThisMachineHardwareStatus } from "./DLSPerformanceDetector";


const conf=new JsonFile("./config.json")
conf.init("port",8081)



http.createServer(function (request, response) {
    switch(request.url){
        case "/server_status":{
            // 发送 HTTP 头部
            // HTTP 状态值: 200 : OK
            // 内容类型: text/plain
            response.writeHead(200, {'Content-Type': 'application/json'});
            getThisMachineHardwareStatus().then(result=>{
                // 发送响应数据 "Hello World"
                response.end(JSON.stringify(result));
            })    
            break;        
        }
        default:{
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.end("")
            break;
        }
    }

    
}).listen(conf.get("port"));